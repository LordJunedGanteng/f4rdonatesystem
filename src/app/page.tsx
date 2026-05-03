"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api, formatRp, PLATFORM_LABEL,
  type Donation, type LeaderboardEntry, type StatsResponse,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AuthGate from "@/components/AuthGate";

export default function DashboardPage() {
  return (
    <AuthGate>
      <DashboardContent />
    </AuthGate>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<{
    license_key?: string;
    game_id?: string;
    status?: string;
  } | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [recent, setRecent] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stats" | "integration">("stats");

  const loadData = useCallback(async () => {
    if (!user?.username) return;
    try {
      // 1. Get User License Info from the USER-specific endpoint
      const res = await api("/api/user/license", { method: "GET" });
      const found = res as any;
      
      if (found && found.license_key) {
        setUserData({
          license_key: found.license_key,
          game_id: found.game_id || "default",
          status: found.status
        });
        
        // 2. Get Stats using license key
        const s = await api(`/api/donations/stats?key=${found.license_key}`);
        setStats(s as StatsResponse);
        // 3. Get Recent Donations
        const r = await api(`/api/donations/recent?key=${found.license_key}&limit=10`);
        setRecent((r as any).donations ?? []);
      } else {
        setUserData({ status: "No License Found" });
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setUserData({ status: "Error loading license" });
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  const webhookUrls = userData?.game_id ? {
    saweria:    `https://f4rmultidonate.vercel.app/api/webhook/${userData.game_id}/saweria`,
    socialbuzz: `https://f4rmultidonate.vercel.app/api/webhook/${userData.game_id}/socialbuzz`,
    trakteer:   `https://f4rmultidonate.vercel.app/api/webhook/${userData.game_id}/trakteer`,
  } : null;

  const robloxConfig = userData?.license_key ? 
    `-- STRIX F4R CONFIGURATION\nreturn {\n    LicenseKey = "${userData.license_key}",\n    Version = "2.0.0"\n}` : "";

  return (
    <main className="flex-1 md:ml-64 min-h-screen bg-surface pt-16 md:pt-0">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-8 md:py-10">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-primary text-[24px]">dashboard</span>
              </div>
              <h2 className="font-headline text-[32px] font-bold text-on-surface">Welcome back, {user?.username}</h2>
            </div>
            <p className="text-on-surface-variant">Manage your donations and game integration in one place.</p>
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/30">
            <button 
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "stats" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab("integration")}
              className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "integration" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Integration
            </button>
          </div>
        </header>

        {activeTab === "stats" ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: "payments", label: "Total Revenue", value: `Rp ${formatRp(stats?.totalAmount || 0)}`, color: "text-secondary" },
                { icon: "volunteer_activism", label: "Total Donations", value: String(stats?.totalDonations || 0), color: "text-primary" },
                { icon: "license", label: "License Status", value: userData?.status?.toUpperCase() || "ACTIVE", color: "text-secondary" },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-surface-container/40 border border-outline-variant/20 p-6 rounded-2xl backdrop-blur-sm">
                  <h3 className="font-headline text-[10px] font-bold uppercase tracking-widest text-outline mb-3">{kpi.label}</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-headline text-3xl font-bold text-on-surface">{kpi.value}</p>
                    <span className={`material-symbols-outlined text-[32px] opacity-20 ${kpi.color}`}>{kpi.icon}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Table */}
            <section className="bg-surface-container/40 border border-outline-variant/20 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-outline-variant/20">
                <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">Recent Donations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-[10px] font-bold uppercase tracking-widest text-outline">
                    <tr>
                      <th className="p-4">Donor</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Platform</th>
                      <th className="p-4">Message</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center animate-pulse">Loading data...</td></tr>
                    ) : recent.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-outline">No donations recorded yet.</td></tr>
                    ) : (
                      recent.map((d, i) => (
                        <tr key={i} className="border-b border-outline-variant/10 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-on-surface">{d.username}</td>
                          <td className="p-4 text-secondary font-mono">Rp {formatRp(d.amount)}</td>
                          <td className="p-4"><span className="bg-surface-container-highest px-2 py-1 rounded text-[10px]">{PLATFORM_LABEL[d.platform] || d.platform}</span></td>
                          <td className="p-4 text-outline italic">"{d.message || "No message"}"</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Left: License & Webhooks */}
            <div className="space-y-6">
              <div className="bg-surface-container/60 border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">vpn_key</span>
                  License Information
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase ml-1">License Key</label>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center group">
                      <code className="text-primary font-mono font-bold tracking-widest">{userData?.license_key || "Generating..."}</code>
                      <button 
                        onClick={() => userData?.license_key && navigator.clipboard.writeText(userData.license_key)}
                        className="text-primary hover:scale-110 transition-transform p-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-outline uppercase ml-1">Universe ID (Game ID)</label>
                    <div className="bg-surface-container-highest/50 border border-outline-variant/20 rounded-xl p-4">
                      <code className="text-on-surface font-mono">{userData?.game_id || "Not Linked"}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container/60 border border-outline-variant/20 rounded-2xl p-6 backdrop-blur-md">
                <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">webhook</span>
                  Webhook Endpoints
                </h3>
                <div className="space-y-3">
                  {webhookUrls && Object.entries(webhookUrls).map(([name, url]) => (
                    <div key={name} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-[9px] font-bold uppercase text-primary">{name}</span>
                      <div className="flex items-center justify-between gap-3 overflow-hidden">
                        <code className="text-[10px] text-outline truncate flex-1">{url}</code>
                        <button onClick={() => navigator.clipboard.writeText(url)} className="text-primary hover:text-secondary transition-colors">
                          <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Roblox Config */}
            <div className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-2xl p-6 backdrop-blur-md flex flex-col">
              <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">settings_remote</span>
                Roblox Script Config
              </h3>
              <div className="flex-1 bg-[#1e1e1e] rounded-xl border border-white/5 p-5 relative font-mono text-[12px] leading-relaxed shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  <span className="text-[10px] text-white/30 ml-2">Config.luau</span>
                </div>
                <pre className="text-[#9cdcfe] overflow-auto max-h-[300px] custom-scrollbar">
                  {robloxConfig}
                </pre>
                <button 
                  onClick={() => navigator.clipboard.writeText(robloxConfig)}
                  className="absolute bottom-4 right-4 bg-primary text-on-primary p-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-4 italic text-center">
                * Copy dan paste script di atas ke dalam ModuleScript STRIX di game Roblox Anda.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
