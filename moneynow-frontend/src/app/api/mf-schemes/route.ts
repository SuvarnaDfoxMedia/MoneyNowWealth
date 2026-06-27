import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.ADVISORKHOJ_API_KEY;
const BASE_URL = "https://mfapi.advisorkhoj.com";

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "all" or "scheme"
  const scheme = searchParams.get("scheme");

  let url = "";
  if (type === "all") {
    url = `${BASE_URL}/getAllMutualFundSchemesRegAndDir?key=${API_KEY}`;
  } else if (type === "scheme" && scheme) {
    url = `${BASE_URL}/getSchemeInfoLatest?key=${API_KEY}&scheme=${encodeURIComponent(scheme)}`;
  } else {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const res = await fetch(url, { next: { revalidate: 300 } });
  const data = await res.json();
  return NextResponse.json(data);
}
