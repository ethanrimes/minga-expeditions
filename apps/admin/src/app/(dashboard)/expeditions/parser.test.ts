import { describe, it, expect } from 'vitest';
import { parseExpeditionFormFields, type ExpeditionFormValue } from './parser';

function fd(entries: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.append(k, v);
  return f;
}

function ok(input: Record<string, string>): ExpeditionFormValue {
  const out = parseExpeditionFormFields(fd(input));
  if ('error' in out) throw new Error(`expected success, got: ${out.error}`);
  return out.value;
}

const minimum = {
  title: 'Cocora loop',
  description: 'A wax-palm walk through the cloud forest.',
  category_id: 'cat-uuid',
  location_name: 'Valle de Cocora',
};

describe('parseExpeditionFormFields', () => {
  it('coerces a happy-path submission', () => {
    const value = ok({
      ...minimum,
      region: 'Quindío',
      country: 'Colombia',
      start_lat: '4.6411',
      start_lng: '-75.4855',
      distance_km: '12.5',
      elevation_gain_m: '600',
      difficulty: '3',
      price_cents: '15000000',
      currency: 'cop',
      is_official: 'on',
      is_published: 'on',
    });
    expect(value).toMatchObject({
      title: 'Cocora loop',
      region: 'Quindío',
      country: 'Colombia',
      distance_km: 12.5,
      elevation_gain_m: 600,
      difficulty: 3,
      price_cents: 15_000_000,
      currency: 'COP',
      is_official: true,
      is_published: true,
    });
    expect(value.start_lat).toBeCloseTo(4.6411, 5);
    expect(value.start_lng).toBeCloseTo(-75.4855, 5);
  });

  it('returns null for blank numeric fields rather than NaN', () => {
    const value = ok({
      ...minimum,
      start_lat: '',
      start_lng: '',
      distance_km: '',
      elevation_gain_m: '',
    });
    expect(value.start_lat).toBeNull();
    expect(value.start_lng).toBeNull();
    expect(value.distance_km).toBeNull();
    expect(value.elevation_gain_m).toBeNull();
  });

  it('clamps difficulty to the 1-5 range', () => {
    expect(ok({ ...minimum, difficulty: '0' }).difficulty).toBe(1);
    expect(ok({ ...minimum, difficulty: '99' }).difficulty).toBe(5);
    expect(ok({ ...minimum, difficulty: '3' }).difficulty).toBe(3);
  });

  it('forbids negative prices', () => {
    expect(ok({ ...minimum, price_cents: '-100' }).price_cents).toBe(0);
  });

  it('defaults country to Colombia and currency to COP', () => {
    const value = ok(minimum);
    expect(value.country).toBe('Colombia');
    expect(value.currency).toBe('COP');
  });

  it('region empty-string becomes null', () => {
    expect(ok({ ...minimum, region: '   ' }).region).toBeNull();
  });

  it.each([
    ['no title', { ...minimum, title: '' }],
    ['no description', { ...minimum, description: '' }],
    ['no category_id', { ...minimum, category_id: '' }],
    ['no location_name', { ...minimum, location_name: '' }],
  ])('rejects when %s', (_label, entries) => {
    const out = parseExpeditionFormFields(fd(entries));
    expect('error' in out && out.error).toMatch(/required/i);
  });

  it('treats checkbox absence as false', () => {
    const value = ok(minimum);
    expect(value.is_official).toBe(false);
    expect(value.is_published).toBe(false);
  });
});
