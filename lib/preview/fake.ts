/* Tiny in-memory stand-in for the Supabase client, used only when SISI_PREVIEW=1. Reads filter fixtures; writes are accepted and ignored. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ME, rpcs, tables } from './fixtures';

type Row = Record<string, any>;

class Query implements PromiseLike<any> {
  private rows: Row[];
  private head = false;
  private wantCount = false;
  private one: 'single' | 'maybe' | null = null;
  private write = false;
  constructor(table: string) { this.rows = [...(tables[table] ?? [])]; }
  select(_cols?: string, opts?: { count?: string; head?: boolean }) { this.head = !!opts?.head; this.wantCount = !!opts?.count; return this; }
  insert() { this.write = true; return this; }
  upsert() { this.write = true; return this; }
  update() { this.write = true; return this; }
  delete() { this.write = true; return this; }
  eq(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] !== v); return this; }
  in(c: string, v: any[]) { this.rows = this.rows.filter((r) => v.includes(r[c])); return this; }
  is(c: string, v: any) { this.rows = this.rows.filter((r) => (v === null ? r[c] == null : r[c] === v)); return this; }
  not(c: string, _op: string, v: any) { this.rows = this.rows.filter((r) => (v === null ? r[c] != null : r[c] !== v)); return this; }
  gte(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] >= v); return this; }
  gt(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] > v); return this; }
  lte(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] <= v); return this; }
  lt(c: string, v: any) { this.rows = this.rows.filter((r) => r[c] < v); return this; }
  contains() { return this; }
  ilike() { return this; }
  order(c: string, o?: { ascending?: boolean }) { const d = o?.ascending === false ? -1 : 1; this.rows.sort((a, b) => (a[c] > b[c] ? d : a[c] < b[c] ? -d : 0)); return this; }
  limit(n: number) { this.rows = this.rows.slice(0, n); return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }
  then<R1 = any, R2 = never>(res?: ((v: any) => R1 | PromiseLike<R1>) | null, rej?: ((e: any) => R2 | PromiseLike<R2>) | null): PromiseLike<R1 | R2> {
    const out = this.write ? { data: this.one ? null : [], error: null, count: 0 }
      : this.head ? { data: null, error: null, count: this.rows.length }
      : this.one ? { data: this.rows[0] ?? null, error: this.one === 'single' && !this.rows[0] ? { message: 'not found' } : null }
      : { data: this.rows, error: null, count: this.wantCount ? this.rows.length : null };
    return Promise.resolve(out).then(res, rej);
  }
}

export function fakeClient(): SupabaseClient {
  return {
    from: (t: string) => new Query(t),
    rpc: (name: string, args: any) => Promise.resolve({ data: rpcs[name]?.(args ?? {}) ?? [], error: null }),
    auth: {
      getUser: async () => ({ data: { user: { id: ME, email: 'nomsa@demo.sisi.app' } }, error: null }),
      signOut: async () => ({ error: null }),
    },
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: async () => {},
  } as unknown as SupabaseClient;
}

export const previewOn = () => process.env.SISI_PREVIEW === '1' && process.env.NODE_ENV !== 'production';
