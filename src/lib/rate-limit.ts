/**
 * Простой in-memory rate limit для логина.
 * На Fluid Compute счётчик живёт на тёплом инстансе — достаточно против брутфорса.
 * Ключ: email + IP.
 */

type Bucket = { fails: number; blockedUntil: number };

const buckets = new Map<string, Bucket>();

const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

function key(email: string, ip: string) {
  return `${email.toLowerCase()}|${ip}`;
}

function prune(now: number) {
  if (buckets.size < 2000) return;
  for (const [k, v] of buckets) {
    if (v.blockedUntil < now && v.fails === 0) buckets.delete(k);
  }
}

export function assertLoginAllowed(
  email: string,
  ip: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const b = buckets.get(key(email, ip));
  if (!b) return { ok: true };
  if (b.blockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) };
  }
  return { ok: true };
}

export function recordLoginFailure(email: string, ip: string) {
  const now = Date.now();
  const k = key(email, ip);
  const b = buckets.get(k) || { fails: 0, blockedUntil: 0 };
  b.fails += 1;
  if (b.fails >= MAX_FAILS) {
    b.blockedUntil = now + BLOCK_MS;
    b.fails = 0;
  }
  buckets.set(k, b);
  // сброс окна через WINDOW_MS
  setTimeout(() => {
    const cur = buckets.get(k);
    if (cur && cur.blockedUntil < Date.now()) {
      cur.fails = Math.max(0, cur.fails - 1);
      if (cur.fails === 0) buckets.delete(k);
      else buckets.set(k, cur);
    }
  }, WINDOW_MS).unref?.();
}

export function recordLoginSuccess(email: string, ip: string) {
  buckets.delete(key(email, ip));
}
