"use client";

import { useState, useEffect } from "react";
import { apiCall, type AdminUser } from "@/lib/api";
import AuthGate from "@/components/AuthGate";

export default function AdminPage() {
  return (
    <AuthGate adminOnly>
      <AdminContent />
    </AuthGate>
  );
}

function AdminContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [genUsername, setGenUsername] = useState("");
  const [genPassword, setGenPassword] = useState("");
  const [genGameId, setGenGameId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    username: string;
    license_key: string;
    game_id: string;
  } | null>(null);

  const loadUsers = async () => {
    try {
      const res = await apiCall<{ users: AdminUser[] }>("/api/admin/users", { method: "GET" });
      setUsers(res.users ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const generateLicense = async () => {
    if (!genUsername || !genPassword) return;
    setGenerating(true);
    const targetGameId = genGameId || "default";
    try {
      const res = await apiCall<{ ok: boolean; user_id: number; username: string; license_key: string }>(
        "/api/admin/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: genUsername,
            password: genPassword,
            game_id: targetGameId,
            game_name: genGameId || undefined,
          }),
        }
      );
      setGeneratedData({
        username: res.username,
        license_key: res.license_key,
        game_id: targetGameId,
      });
      setGenUsername("");
      setGenPassword("");
      setGenGameId("");
      loadUsers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setGenerating(false);
    }
  };

  const deleteUser = async (id: number) => {
    try {
      await apiCall(`/api/admin/users/${id}`, { method: "DELETE" });
      loadUsers();
    } catch { /* silent */ }
  };

  const getRobloxConfig = (key: string) => {
    return `-- STRIX F4R CONFIGURATION\nreturn {\n    LicenseKey = "${key}",\n    Version = "2.0.0"\n}`;
  };

  const webhookUrls = generatedData ? {
    saweria:    `https://f4rmultidonate.vercel.app/api/webhook/${generatedData.game_id}/saweria`,
    socialbuzz: `https://f4rmultidonate.vercel.app/api/webhook/${generatedData.game_id}/socialbuzz`,
    trakteer:   `https://f4rmultidonate.vercel.app/api/webhook/${generatedData.game_id}/trakteer`,
  } : null;

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline text-[40px] font-bold leading-[1.1] tracking-tight text-primary">Global Monitoring</h2>
            <p className="text-lg text-on-surface-variant mt-2">Platform-wide overview of donation activity and user metrics.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-surface-container-high border border-outline-variant rounded px-4 py-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">circle</span>
              <span className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface">Bridge Status: Optimal</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: "public", label: "Total Users", value: String(users.length), trend: "Active", color: "text-secondary" },
            { icon: "group", label: "Active Licenses", value: String(users.filter(u => u.license_key).length), trend: "Licensed", color: "text-secondary" },
            { icon: "swap_horiz", label: "Avg. Bridge Time", value: "1.4s", trend: "Stable", color: "text-on-surface-variant" },
            { icon: "error", label: "System Status", value: "OK", trend: "All systems go", color: "text-secondary" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-surface-container/50 border-t border-white/10 p-6 rounded-lg backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-[64px]">{kpi.icon}</span>
              </div>
              <h3 className="font-headline text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{kpi.label}</h3>
              <p className="font-headline text-2xl font-semibold text-on-surface font-mono">{kpi.value}</p>
              <div className={`mt-4 flex items-center gap-1 ${kpi.color}`}>
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
                <span className="font-headline text-xs font-semibold">{kpi.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <section className="lg:col-span-1 bg-surface-container/40 border border-outline-variant/30 rounded-xl p-6 backdrop-blur-md h-fit">
            <h3 className="font-headline text-xl font-semibold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person_add</span>
              Register New User
            </h3>
            <div className="flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Username</label>
                <input
                  placeholder="e.g. lordjuned"
                  value={genUsername}
                  onChange={(e) => setGenUsername(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Password</label>
                <input
                  placeholder="••••••••"
                  type="password"
                  value={genPassword}
                  onChange={(e) => setGenPassword(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline ml-1">Game ID (UniverseID)</label>
                <input
                  placeholder="e.g. 12345678"
                  value={genGameId}
                  onChange={(e) => setGenGameId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2.5 px-4 text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              <button
                onClick={generateLicense}
                disabled={generating || !genUsername || !genPassword}
                className="mt-2 bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-lg hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">key</span>
                {generating ? "Generating..." : "Generate License"}
              </button>
            </div>
          </section>

          <section className="lg:col-span-2 space-y-6">
            {!generatedData ? (
              <div className="h-full border-2 border-dashed border-outline-variant/30 rounded-xl flex flex-col items-center justify-center p-12 text-center">
                <span className="material-symbols-outlined text-outline-variant text-[64px] mb-4">info</span>
                <p className="text-on-surface-variant font-headline">Generate a license to see account details, webhooks, and Roblox configuration.</p>
              </div>
            ) : (
              <div className="bg-surface-container/60 border border-secondary/30 rounded-xl overflow-hidden backdrop-blur-md">
                <div className="bg-secondary/10 px-6 py-3 border-b border-secondary/20 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-secondary font-headline text-xs font-bold uppercase tracking-widest">
                    <span className="material-symbols-outlined text-sm filled">check_circle</span>
                    User & License Created Successfully
                  </div>
                  <button onClick={() => setGeneratedData(null)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">account_circle</span>
                        Account Info
                      </h4>
                      <div className="bg-surface-container-highest/50 rounded-lg p-3 space-y-2 border border-outline-variant/20">
                        <div className="flex justify-between text-xs">
                          <span className="text-on-surface-variant">Username:</span>
                          <span className="text-on-surface font-mono font-bold">{generatedData.username}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-on-surface-variant">Universe ID:</span>
                          <span className="text-on-surface font-mono">{generatedData.game_id}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">vpn_key</span>
                        Informasi License
                      </h4>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 relative group">
                        <code className="text-primary code-font text-sm break-all font-bold tracking-wider">{generatedData.license_key}</code>
                        <button 
                          onClick={() => navigator.clipboard.writeText(generatedData.license_key)}
                          className="absolute right-2 top-2 text-primary hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">webhook</span>
                        Informasi Webhook
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(webhookUrls || {}).map(([name, url]) => (
                          <div key={name} className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/10 flex flex-col gap-1">
                            <span className="text-[9px] font-bold uppercase text-on-surface-variant">{name}</span>
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                              <code className="text-[10px] text-outline truncate flex-1">{url}</code>
                              <button onClick={() => navigator.clipboard.writeText(url)} className="text-primary hover:text-secondary">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-surface mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">settings_remote</span>
                      Config Roblox (STRIX)
                    </h4>
                    <div className="flex-1 bg-surface-container-highest rounded-xl p-4 border border-outline-variant/30 relative flex flex-col">
                      <div className="flex items-center gap-2 mb-3 border-b border-outline-variant/20 pb-2">
                        <div className="w-2 h-2 rounded-full bg-error/40" />
                        <div className="w-2 h-2 rounded-full bg-warning/40" />
                        <div className="w-2 h-2 rounded-full bg-secondary/40" />
                        <span className="text-[10px] text-on-surface-variant font-mono ml-1">Config.luau</span>
                      </div>
                      <pre className="text-[11px] text-primary-fixed leading-relaxed font-mono whitespace-pre-wrap overflow-auto">
                        {getRobloxConfig(generatedData.license_key)}
                      </pre>
                      <button 
                        onClick={() => navigator.clipboard.writeText(getRobloxConfig(generatedData.license_key))}
                        className="absolute bottom-4 right-4 bg-primary text-on-primary p-2 rounded-lg shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-4 italic">
                      * Paste code di atas ke ModuleScript config STRIX dalam game Roblox Anda.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="bg-surface-container/40 border border-outline-variant/30 rounded-xl flex flex-col backdrop-blur-md overflow-hidden">
          <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-high/50">
            <h3 className="font-headline text-lg font-semibold text-on-surface">User Management</h3>
            <span className="font-headline text-xs font-semibold text-on-surface-variant">{users.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-headline text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 font-normal">User</th>
                  <th className="p-4 font-normal">Role</th>
                  <th className="p-4 font-normal">License Key</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-outline-variant/10">
                      <td colSpan={5} className="p-4"><div className="h-4 rounded bg-surface-container animate-pulse" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-on-surface-variant">No users yet</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4 text-on-surface font-medium">{u.username}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-headline font-semibold uppercase tracking-wider ${
                          u.role === "admin"
                            ? "bg-primary/20 text-primary border border-primary/30"
                            : "bg-surface-variant text-on-surface-variant border border-outline-variant"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {u.license_key ? (
                          <code className="font-mono text-primary bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20">
                            {u.license_key.slice(0, 16)}...
                          </code>
                        ) : (
                          <span className="text-outline text-xs">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-headline font-semibold ${
                          u.status === "active" ? "text-secondary" : "text-outline"
                        }`}>
                          {u.status ?? "—"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== "admin" && (
                          <button
                            onClick={() => deleteUser(u.id)}
                            className="text-on-surface-variant hover:text-error transition-colors mx-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
