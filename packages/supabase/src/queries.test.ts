import { describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  adminListExpeditions,
  adminListOrders,
  fetchCategories,
  fetchMyPurchasedExpeditions,
  fetchOrderByReference,
  getMyRole,
  isAdmin,
  listVendorProposals,
  orderCounts,
  saveActivity,
  submitVendorProposal,
  updateMyProfile,
  uploadActivityPhoto,
  uploadAvatar,
  vendorProposalCounts,
} from './queries';
import { createFakeClient, queueResponse, type FakeSupabaseClient } from './test-utils';

// All queries take a SupabaseClient — our fake satisfies the runtime shape
// the helpers call. Cast at the call site to avoid copying the entire
// supabase-js TS surface area.
const asClient = (c: FakeSupabaseClient) => c as unknown as SupabaseClient;

describe('submitVendorProposal', () => {
  it('rejects submissions with no contact method', async () => {
    const client = createFakeClient();
    await expect(
      submitVendorProposal(asClient(client), {
        vendor_name: 'Acme',
        vendor_type: 'transportation',
        title: 'Shuttles',
        description: 'Daily shuttles',
      }),
    ).rejects.toThrow(/email or phone/i);
  });

  it('inserts when an email is provided', async () => {
    const client = createFakeClient();
    queueResponse(client, 'vendor_proposals.insert', {
      data: { id: 'p1', vendor_name: 'Acme', status: 'new' },
      error: null,
    });
    const out = await submitVendorProposal(asClient(client), {
      vendor_name: 'Acme',
      vendor_type: 'transportation',
      title: 'Shuttles',
      description: 'Daily shuttles',
      contact_email: 'ops@acme.co',
    });
    expect(out.id).toBe('p1');
    const call = client.store.calls[0];
    expect(call.table).toBe('vendor_proposals');
    expect(call.verb).toBe('insert');
    expect(call.payload).toMatchObject({ vendor_name: 'Acme', contact_email: 'ops@acme.co' });
  });

  it('propagates database errors', async () => {
    const client = createFakeClient();
    queueResponse(client, 'vendor_proposals.insert', {
      data: null,
      error: { message: 'duplicate key' },
    });
    await expect(
      submitVendorProposal(asClient(client), {
        vendor_name: 'Acme',
        vendor_type: 'other',
        title: 'X',
        description: 'Y',
        contact_phone: '+57 300',
      }),
    ).rejects.toMatchObject({ message: 'duplicate key' });
  });
});

describe('listVendorProposals', () => {
  it('skips the status filter when status is "all"', async () => {
    const client = createFakeClient();
    queueResponse(client, 'vendor_proposals.select', { data: [], error: null });
    await listVendorProposals(asClient(client), { status: 'all' });

    const call = client.store.calls[0];
    expect(call.filters.some((f) => f[0] === 'eq' && f[1] === 'status')).toBe(false);
  });

  it('applies the status + type filters when provided', async () => {
    const client = createFakeClient();
    queueResponse(client, 'vendor_proposals.select', { data: [], error: null });
    await listVendorProposals(asClient(client), { status: 'new', type: 'transportation' });

    const call = client.store.calls[0];
    expect(call.filters).toEqual(
      expect.arrayContaining([
        ['eq', 'status', 'new'],
        ['eq', 'vendor_type', 'transportation'],
      ]),
    );
  });
});

describe('vendorProposalCounts', () => {
  it('returns a count for every status', async () => {
    const client = createFakeClient();
    // 5 statuses → 5 head:true count queries
    const counts = [3, 1, 2, 0, 4];
    for (const c of counts) {
      queueResponse(client, 'vendor_proposals.select', { data: [], error: null, count: c });
    }
    const result = await vendorProposalCounts(asClient(client));
    expect(Object.keys(result).sort()).toEqual(
      ['accepted', 'archived', 'new', 'rejected', 'reviewing'].sort(),
    );
    // counts are issued in parallel — assert the sum and that we hit the table 5x
    expect(client.store.calls.length).toBe(5);
    expect(Object.values(result).reduce((a, b) => a + b, 0)).toBe(counts.reduce((a, b) => a + b, 0));
  });
});

describe('orderCounts', () => {
  it('aggregates each terminal status separately', async () => {
    const client = createFakeClient();
    // 6 statuses → 6 head:true queries
    for (let i = 0; i < 6; i++) {
      queueResponse(client, 'orders.select', { data: [], error: null, count: i });
    }
    const result = await orderCounts(asClient(client));
    expect(Object.keys(result).sort()).toEqual(
      ['approved', 'declined', 'error', 'pending', 'refunded', 'voided'].sort(),
    );
    expect(client.store.calls.length).toBe(6);
  });
});

describe('adminListOrders', () => {
  it('omits the status filter on "all"', async () => {
    const client = createFakeClient();
    queueResponse(client, 'orders.select', { data: [], error: null });
    await adminListOrders(asClient(client), { status: 'all' });
    const call = client.store.calls[0];
    expect(call.filters.some((f) => f[0] === 'eq' && f[1] === 'status')).toBe(false);
  });

  it('caps results to the supplied limit', async () => {
    const client = createFakeClient();
    queueResponse(client, 'orders.select', { data: [], error: null });
    await adminListOrders(asClient(client), { limit: 50 });
    const limitCall = client.store.calls[0].filters.find((f) => f[0] === 'limit');
    expect(limitCall?.[1]).toBe(50);
  });
});

describe('fetchOrderByReference', () => {
  it('looks up by wompi_reference', async () => {
    const client = createFakeClient();
    queueResponse(client, 'orders.select', {
      data: { id: 'o1', wompi_reference: 'abc-123' },
      error: null,
    });
    const out = await fetchOrderByReference(asClient(client), 'abc-123');
    expect(out?.id).toBe('o1');
    const call = client.store.calls[0];
    expect(call.filters).toContainEqual(['eq', 'wompi_reference', 'abc-123']);
  });

  it('returns null when no row matches', async () => {
    const client = createFakeClient();
    queueResponse(client, 'orders.select', { data: null, error: null });
    expect(await fetchOrderByReference(asClient(client), 'nope')).toBeNull();
  });
});

describe('fetchCategories', () => {
  it('filters to active rows when activeOnly is set', async () => {
    const client = createFakeClient();
    queueResponse(client, 'categories.select', { data: [], error: null });
    await fetchCategories(asClient(client), { activeOnly: true });
    expect(client.store.calls[0].filters).toContainEqual(['eq', 'is_active', true]);
  });

  it('does not filter by default', async () => {
    const client = createFakeClient();
    queueResponse(client, 'categories.select', { data: [], error: null });
    await fetchCategories(asClient(client));
    expect(client.store.calls[0].filters.some((f) => f[0] === 'eq' && f[1] === 'is_active')).toBe(false);
  });
});

describe('adminListExpeditions', () => {
  it('passes through search + categoryId filters', async () => {
    const client = createFakeClient();
    queueResponse(client, 'expeditions.select', { data: [], error: null });
    await adminListExpeditions(asClient(client), { search: 'Cocora', categoryId: 'c1' });
    const call = client.store.calls[0];
    expect(call.filters).toEqual(
      expect.arrayContaining([
        ['eq', 'category_id', 'c1'],
        ['ilike', 'title', '%Cocora%'],
      ]),
    );
  });
});

describe('fetchMyPurchasedExpeditions', () => {
  it('returns an empty list for guests (no auth)', async () => {
    const client = createFakeClient(); // user: null by default
    expect(await fetchMyPurchasedExpeditions(asClient(client))).toEqual([]);
  });

  it('dedupes by expedition id', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'orders.select', {
      data: [
        { expedition: { id: 'e1', title: 'Cocora' } },
        { expedition: { id: 'e2', title: 'Tayrona' } },
        { expedition: { id: 'e1', title: 'Cocora' } }, // duplicate (multiple paid orders)
        { expedition: null }, // expedition was deleted
      ],
      error: null,
    });
    const out = await fetchMyPurchasedExpeditions(asClient(client));
    expect(out.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('only matches approved orders for this user', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'orders.select', { data: [], error: null });
    await fetchMyPurchasedExpeditions(asClient(client));
    const call = client.store.calls[0];
    expect(call.filters).toEqual(
      expect.arrayContaining([
        ['eq', 'buyer_profile_id', 'u1'],
        ['eq', 'status', 'approved'],
      ]),
    );
  });
});

describe('saveActivity', () => {
  beforeEach(() => undefined);

  it('rejects when the caller is signed out', async () => {
    const client = createFakeClient(); // user: null
    await expect(
      saveActivity(asClient(client), {
        title: 't',
        activity_type: 'hike',
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        distance_km: 0,
        elevation_gain_m: 0,
        duration_seconds: 0,
        track: [],
      }),
    ).rejects.toThrow(/sign in/i);
  });

  it('derives is_independent from expedition_id when omitted', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'activities.insert', { data: { id: 'a1' }, error: null });
    await saveActivity(asClient(client), {
      title: 'Walk',
      activity_type: 'walk',
      expedition_id: null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      distance_km: 1,
      elevation_gain_m: 0,
      duration_seconds: 600,
      track: [],
    });
    const insertCall = client.store.calls.find((c) => c.table === 'activities' && c.verb === 'insert')!;
    const payload = insertCall.payload as { is_independent: boolean; expedition_id: string | null };
    expect(payload.is_independent).toBe(true);
    expect(payload.expedition_id).toBeNull();
  });

  it('passes through explicit terrain_tags + is_independent and computes avg speed', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'activities.insert', { data: { id: 'a1' }, error: null });
    await saveActivity(asClient(client), {
      title: 'Cocora loop',
      activity_type: 'hike',
      expedition_id: 'e1',
      is_independent: false,
      terrain_tags: ['mountain', 'forest'],
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      distance_km: 10,
      elevation_gain_m: 500,
      duration_seconds: 3600,
      track: [],
    });
    const insertCall = client.store.calls.find((c) => c.table === 'activities' && c.verb === 'insert')!;
    const payload = insertCall.payload as {
      avg_speed_kmh: number;
      terrain_tags: string[];
      is_independent: boolean;
    };
    expect(payload.terrain_tags).toEqual(['mountain', 'forest']);
    expect(payload.is_independent).toBe(false);
    expect(payload.avg_speed_kmh).toBeCloseTo(10, 5);
  });

  it('inserts track rows when points are present', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'activities.insert', { data: { id: 'a1' }, error: null });
    queueResponse(client, 'activity_tracks.insert', { data: null, error: null });
    await saveActivity(asClient(client), {
      title: 't',
      activity_type: 'run',
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      distance_km: 0.5,
      elevation_gain_m: 0,
      duration_seconds: 300,
      track: [
        { lat: 4.6, lng: -74.08, altitude_m: 2600, speed_ms: 0, timestamp: 0 },
        { lat: 4.61, lng: -74.07, altitude_m: 2610, speed_ms: 0, timestamp: 60_000 },
      ],
    });
    const trackInsert = client.store.calls.find((c) => c.table === 'activity_tracks');
    expect(trackInsert).toBeDefined();
    const rows = trackInsert!.payload as Array<{ sequence: number; lat: number }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].sequence).toBe(0);
    expect(rows[1].sequence).toBe(1);
  });
});

describe('uploadActivityPhoto', () => {
  it('rejects unauthenticated callers', async () => {
    const client = createFakeClient();
    await expect(
      uploadActivityPhoto(asClient(client), 'a1', new Blob([new Uint8Array([1]).buffer]), 'p.jpg'),
    ).rejects.toThrow(/sign in/i);
  });

  it('writes a per-user-folder path and inserts metadata', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'activity_photos.insert', {
      data: { id: 'ph1', activity_id: 'a1', url: 'x' },
      error: null,
    });
    await uploadActivityPhoto(asClient(client), 'a1', new Blob([new Uint8Array([1]).buffer]), 'pic.jpg', {
      lat: 4.6,
      lng: -74.08,
    });
    const insert = client.store.calls.find((c) => c.table === 'activity_photos')!;
    expect((insert.payload as { activity_id: string }).activity_id).toBe('a1');
    expect((insert.payload as { lat: number }).lat).toBe(4.6);
  });
});

describe('updateMyProfile', () => {
  it('rejects unauthenticated callers', async () => {
    const client = createFakeClient();
    await expect(updateMyProfile(asClient(client), { display_name: 'Sam' })).rejects.toThrow(
      /sign in/i,
    );
  });

  it('rejects an empty display name', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    await expect(updateMyProfile(asClient(client), { display_name: '   ' })).rejects.toThrow(
      /1.{0,3}80/,
    );
  });

  it('rejects malformed instagram handles', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    await expect(
      updateMyProfile(asClient(client), { instagram_handle: 'has spaces!' }),
    ).rejects.toThrow(/instagram/i);
  });

  it('normalizes instagram handle (strip @, lowercase) and writes the patch', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'profiles.update', {
      data: { id: 'u1', display_name: 'Sam', instagram_handle: 'mingaco' },
      error: null,
    });
    const out = await updateMyProfile(asClient(client), {
      display_name: 'Sam',
      instagram_handle: '@MingaCo',
    });
    expect(out.id).toBe('u1');
    const call = client.store.calls.find((c) => c.table === 'profiles' && c.verb === 'update')!;
    expect(call.payload).toMatchObject({
      display_name: 'Sam',
      instagram_handle: 'mingaco',
    });
    // RLS belt-and-braces: the helper still scopes the update by auth.uid().
    expect(call.filters).toContainEqual(['eq', 'id', 'u1']);
  });

  it('clears instagram_handle when an empty string is passed', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'profiles.update', {
      data: { id: 'u1', instagram_handle: null },
      error: null,
    });
    await updateMyProfile(asClient(client), { instagram_handle: '' });
    const call = client.store.calls.find((c) => c.table === 'profiles' && c.verb === 'update')!;
    expect(call.payload).toMatchObject({ instagram_handle: null });
  });
});

describe('uploadAvatar', () => {
  it('rejects unauthenticated callers', async () => {
    const client = createFakeClient();
    await expect(
      uploadAvatar(asClient(client), new Blob([new Uint8Array([1]).buffer]), 'me.png'),
    ).rejects.toThrow(/sign in/i);
  });

  it('returns a public URL under the caller folder', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    const url = await uploadAvatar(asClient(client), new Blob([new Uint8Array([1]).buffer]), 'me.png');
    expect(url).toMatch(/^https:\/\/cdn\.example\/u1\//);
  });
});

describe('role helpers', () => {
  it('getMyRole returns null when not signed in', async () => {
    const client = createFakeClient();
    expect(await getMyRole(asClient(client))).toBeNull();
  });

  it('isAdmin is true only for admin profiles', async () => {
    const client = createFakeClient({ user: { id: 'u1' } });
    queueResponse(client, 'profiles.select', { data: { role: 'admin' }, error: null });
    expect(await isAdmin(asClient(client))).toBe(true);

    const client2 = createFakeClient({ user: { id: 'u2' } });
    queueResponse(client2, 'profiles.select', { data: { role: 'user' }, error: null });
    expect(await isAdmin(asClient(client2))).toBe(false);
  });
});
