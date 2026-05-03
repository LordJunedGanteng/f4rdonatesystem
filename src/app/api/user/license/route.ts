import { NextRequest, NextResponse } from "next/server";
import { 
  getUserByUsername, 
  listLicenses, 
} from "@/lib/kv";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Pro-fix for simple base64 tokens in Next.js production
    let username = "";
    try {
      // Handle potential padding issues and base64 formats
      const cleanToken = token.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(Buffer.from(cleanToken, 'base64').toString());
      username = decoded.username;
    } catch (e) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!username) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allLicenses = await listLicenses();
    const userLicense = allLicenses.find(l => l.user_id === user.id);

    return NextResponse.json({
      username: user.username,
      license_key: userLicense?.license_key || null,
      game_id: userLicense?.game_id || null,
      status: userLicense?.status || "active",
      created_at: userLicense?.created_at || null
    });

  } catch (err: any) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
