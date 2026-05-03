const KV_URL = process.env.KV_REST_API_URL || "";
const KV_TOKEN = process.env.KV_REST_API_TOKEN || "";

// In-memory mock database for local testing when KV is not configured
const mockKV: Record<string, string> = {};

export async function kvCommand<T = unknown>(command: string[]): Promise<T> {
  // If no KV is configured, use the mock database
  if (!KV_URL || !KV_TOKEN) {
    const [op, key, value] = command;
    console.warn(`⚠️ KV not configured! Using local mock for [${op}] ${key}`);
    
    if (op === "GET") return (mockKV[key] || null) as T;
    if (op === "SET") {
      mockKV[key] = value;
      return "OK" as T;
    }
    if (op === "DEL") {
      delete mockKV[key];
      return 1 as T;
    }
    if (op === "LRANGE") return [] as T;
    return null as T;
  }

  // Normal fetch to Upstash
  try {
    const res = await fetch(KV_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    
    if (!res.ok) {
      throw new Error(`KV error ${res.status}`);
    }
    const data = await res.json();
    return (data as { result: T }).result;
  } catch (err) {
    console.error("KV fetch failed:", err);
    throw new Error("Database connection failed. Please check your KV configuration.");
  }
}

export async function kvGet(key: string): Promise<string | null> {
  return kvCommand<string | null>(["GET", key]);
}

export async function kvSet(key: string, value: string): Promise<void> {
  await kvCommand(["SET", key, value]);
}

export async function kvDel(key: string): Promise<void> {
  await kvCommand(["DEL", key]);
}

// ── User helpers ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  password?: string;
  role: "admin" | "user";
  created_at: string;
}

export async function listUsers(): Promise<User[]> {
  const idsRaw = await kvGet("users:index");
  if (!idsRaw) return [];
  const ids: number[] = JSON.parse(idsRaw);
  const users = await Promise.all(ids.map(async (id) => {
    const raw = await kvGet(`user:${id}`);
    return raw ? (JSON.parse(raw) as User) : null;
  }));
  return users.filter((u): u is User => u !== null);
}

export async function saveUser(user: User): Promise<void> {
  const idsRaw = await kvGet("users:index");
  const ids: number[] = idsRaw ? JSON.parse(idsRaw) : [];
  if (!ids.includes(user.id)) {
    ids.push(user.id);
    await kvSet("users:index", JSON.stringify(ids));
  }
  await kvSet(`user:${user.id}`, JSON.stringify(user));
  await kvSet(`user:by-username:${user.username.toLowerCase()}`, String(user.id));
}

export async function getUserById(id: number): Promise<User | null> {
  const raw = await kvGet(`user:${id}`);
  return raw ? JSON.parse(raw) : null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const id = await kvGet(`user:by-username:${username.toLowerCase()}`);
  if (!id) return null;
  return getUserById(parseInt(id, 10));
}

// ── License helpers ───────────────────────────────────────────────────────────

export interface License {
  id: number;
  license_key: string;
  user_id: number;
  game_id: string;
  game_name: string | null;
  status: "active" | "suspended" | "expired";
  expires_at: string | null;
  created_at: string;
}

export async function listLicenses(userId?: number): Promise<License[]> {
  const idsRaw = await kvGet("licenses:index");
  if (!idsRaw) return [];
  const ids: number[] = JSON.parse(idsRaw);
  const all = await Promise.all(ids.map(async (id) => {
    const raw = await kvGet(`license:${id}`);
    return raw ? (JSON.parse(raw) as License) : null;
  }));
  const filtered = all.filter((l): l is License => l !== null);
  if (userId) return filtered.filter((l) => l.user_id === userId);
  return filtered;
}

export async function saveLicense(license: License): Promise<void> {
  const idsRaw = await kvGet("licenses:index");
  const ids: number[] = idsRaw ? JSON.parse(idsRaw) : [];
  if (!ids.includes(license.id)) {
    ids.push(license.id);
    await kvSet("licenses:index", JSON.stringify(ids));
  }
  await kvSet(`license:${license.id}`, JSON.stringify(license));
  await kvSet(`license:by-key:${license.license_key}`, String(license.id));
}
