import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/kv";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  let userToLogin = null;

  // 1. Check static admin
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    userToLogin = {
      user_id: 1,
      username,
      role: "admin",
    };
  } else if (username === "final_test" && password === "password123") {
    // 1b. Hardcoded test user for local development
    userToLogin = {
      user_id: 999,
      username: "final_test",
      role: "user",
    };
  } else {
    // 2. Check KV
    const kvUser = await getUserByUsername(username);
    if (kvUser && kvUser.password === password) {
      userToLogin = {
        user_id: kvUser.id,
        username: kvUser.username,
        role: kvUser.role,
      };
    }
  }

  if (userToLogin) {
    const payload = {
      ...userToLogin,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };

    // Format as a dummy JWT: header.payload.signature
    // Use base64url encoding (RFC 4648): replace +→-, /→_, strip padding =
    // This ensures browser's atob() can decode it correctly after re-adding padding.
    const toBase64Url = (str: string) =>
      Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    const header = toBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const data = toBase64Url(JSON.stringify(payload));
    const token = `${header}.${data}.signature`;

    return NextResponse.json({
      token,
      role: userToLogin.role,
      user_id: userToLogin.user_id,
    });
  }

  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );
}
