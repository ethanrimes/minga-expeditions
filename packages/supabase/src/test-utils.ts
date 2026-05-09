// Minimal in-memory Supabase client double for unit tests.
//
// The real PostgREST builder is a thenable that lets you chain filter calls
// (.eq, .ilike, .or, .order, .limit) before resolving. We model that with a
// recorder + a per-call result registry: tests prime a queue of responses
// per `from(table).<verb>` and the fake hands them out in FIFO order.

export type FakeResponse<T = unknown> =
  | { data: T; error: null; count?: number | null }
  | { data: null; error: { message: string }; count?: number | null };

type Verb = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

interface CallRecord {
  table: string;
  verb: Verb;
  filters: Array<[string, ...unknown[]]>;
  payload?: unknown;
  selectArgs?: unknown[];
  countMode?: 'exact' | 'planned' | 'estimated' | null;
  head?: boolean;
}

export interface CallStore {
  calls: CallRecord[];
  // queue.get(`<table>.<verb>`) returns responses to dispense in order.
  queue: Map<string, FakeResponse[]>;
  // auth.getUser response
  user: { id: string; email?: string } | null;
}

export interface FakeSupabaseClient {
  store: CallStore;
  from: (table: string) => Builder;
  auth: {
    getUser: () => Promise<{ data: { user: CallStore['user'] } }>;
  };
  storage: {
    from: (bucket: string) => {
      upload: (path: string, file: unknown) => Promise<FakeResponse>;
      getPublicUrl: (path: string) => { data: { publicUrl: string } };
    };
  };
}

interface Builder {
  select: (...args: unknown[]) => Builder;
  insert: (payload: unknown) => Builder;
  update: (payload: unknown) => Builder;
  delete: () => Builder;
  upsert: (payload: unknown) => Builder;
  eq: (col: string, val: unknown) => Builder;
  neq: (col: string, val: unknown) => Builder;
  ilike: (col: string, val: unknown) => Builder;
  or: (val: unknown) => Builder;
  order: (col: string, opts?: unknown) => Builder;
  limit: (n: number) => Builder;
  single: () => Promise<FakeResponse>;
  maybeSingle: () => Promise<FakeResponse>;
  then: (
    onFulfilled?: (res: FakeResponse & { count?: number | null }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise<unknown>;
}

export function createFakeClient(initial?: Partial<CallStore>): FakeSupabaseClient {
  const store: CallStore = {
    calls: [],
    queue: new Map(),
    user: null,
    ...(initial ?? {}),
  };

  function dequeue(key: string): FakeResponse {
    const list = store.queue.get(key);
    if (!list || list.length === 0) {
      throw new Error(`No fake response queued for ${key}`);
    }
    return list.shift()!;
  }

  function makeBuilder(record: CallRecord): Builder {
    // Cache the resolved response so .then can be called multiple times by
    // the JS Promise machinery without dequeuing twice.
    let resolved: Promise<FakeResponse & { count?: number | null }> | null = null;
    const resolveOnce = () => {
      if (!resolved) {
        const key = `${record.table}.${record.verb}`;
        try {
          const res = dequeue(key) as FakeResponse & { count?: number | null };
          if (record.countMode && typeof res.count !== 'number') {
            // head:true callers expect a `count`; only derive from data when
            // the test didn't supply one explicitly.
            const derived = Array.isArray(res.data) ? res.data.length : 0;
            (res as { count?: number }).count = derived;
          }
          resolved = Promise.resolve(res);
        } catch (e) {
          resolved = Promise.reject(e);
        }
      }
      return resolved!;
    };
    const builder: Builder = {
      select: (...args: unknown[]) => {
        record.verb = record.verb ?? 'select';
        record.selectArgs = args;
        // Detect count: head: true
        const opt = args[1] as { count?: 'exact'; head?: boolean } | undefined;
        if (opt?.count) record.countMode = opt.count;
        if (opt?.head) record.head = true;
        if (!record.verb) record.verb = 'select';
        if (record.verb !== 'select' && record.verb !== 'insert' && record.verb !== 'update' && record.verb !== 'delete' && record.verb !== 'upsert') {
          record.verb = 'select';
        }
        // .insert(...).select(...) keeps verb=insert; otherwise default select
        return builder;
      },
      insert: (payload: unknown) => {
        record.verb = 'insert';
        record.payload = payload;
        return builder;
      },
      update: (payload: unknown) => {
        record.verb = 'update';
        record.payload = payload;
        return builder;
      },
      delete: () => {
        record.verb = 'delete';
        return builder;
      },
      upsert: (payload: unknown) => {
        record.verb = 'upsert';
        record.payload = payload;
        return builder;
      },
      eq: (col: string, val: unknown) => {
        record.filters.push(['eq', col, val]);
        return builder;
      },
      neq: (col: string, val: unknown) => {
        record.filters.push(['neq', col, val]);
        return builder;
      },
      ilike: (col: string, val: unknown) => {
        record.filters.push(['ilike', col, val]);
        return builder;
      },
      or: (val: unknown) => {
        record.filters.push(['or', val]);
        return builder;
      },
      order: (col: string, opts?: unknown) => {
        record.filters.push(['order', col, opts]);
        return builder;
      },
      limit: (n: number) => {
        record.filters.push(['limit', n]);
        return builder;
      },
      single: () => resolveOnce(),
      maybeSingle: () => resolveOnce(),
      then: (resolve, reject) => resolveOnce().then(resolve, reject),
    };
    return builder;
  }

  return {
    store,
    from: (table: string) => {
      const record: CallRecord = { table, verb: 'select', filters: [] };
      store.calls.push(record);
      return makeBuilder(record);
    },
    auth: {
      getUser: async () => ({ data: { user: store.user } }),
    },
    storage: {
      from: (_bucket: string) => ({
        upload: async () => ({ data: { path: 'mock/path' }, error: null } as FakeResponse),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.example/${path}` } }),
      }),
    },
  };
}

// Convenience: queue a response for a specific (table, verb) pair.
export function queueResponse<T>(client: FakeSupabaseClient, key: string, response: FakeResponse<T>) {
  if (!client.store.queue.has(key)) client.store.queue.set(key, []);
  client.store.queue.get(key)!.push(response as FakeResponse);
}
