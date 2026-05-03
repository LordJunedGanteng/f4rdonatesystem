export interface AdminUser {
  id: number;
  username: string;
  role: "admin" | "user";
  license_key?: string;
  game_id?: string;
  status?: "active" | "suspended" | "expired";
  created_at: string;
}

export interface GameEntry {
  game_id: string;
  game_name: string;
  secret_key: string;
  created_at: string;
}

export const getWebhookUrls = (gameId: string) => ({
  saweria:    `https://f4rmultidonate.vercel.app/api/webhook/${gameId}/saweria`,
  socialbuzz: `https://f4rmultidonate.vercel.app/api/webhook/${gameId}/socialbuzz`,
  trakteer:   `https://f4rmultidonate.vercel.app/api/webhook/${gameId}/trakteer`,
});

export interface Donation {
  id?:          number;
  username:     string;
  amount:       number;
  message:      string;
  platform:     string;
  universe_id:  string;
  created_at?:  string;
}

export interface LeaderboardEntry {
  username: string;
  amount: number;
}

export interface StatsResponse {
  totalAmount: number;
  totalDonations: number;
  donations: Donation[];
}

export const PLATFORM_LABEL: Record<string, string> = {
  saweria: "Saweria",
  socialbuzz: "Socialbuzz",
  trakteer: "Trakteer",
};

export const formatRp = (val: number) => 
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

/**
 * Base api call that handles authentication and error management
 */
export async function apiCall<T>(
  path: string, 
  options: RequestInit = {}
): Promise<T> {
  let url: string;
  
  if (path.startsWith("http")) {
    url = path;
  } else {
    const envBase = process.env.NEXT_PUBLIC_API_URL;
    const windowBase = typeof window !== "undefined" ? window.location.origin : "";
    const base = envBase || windowBase || "http://localhost:3000";
    
    // Clean up base and path - ABSOLUTELY NO EXTRA QUOTES OR SPACES
    const cleanBase = base.trim().replace(/['"]+/g, "").replace(/\/+$/, "");
    const cleanPath = path.trim().replace(/['"]+/g, "");
    const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
    
    url = cleanBase + finalPath;
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Call failed:", url, error);
    throw error;
  }
}

export const api = apiCall;
