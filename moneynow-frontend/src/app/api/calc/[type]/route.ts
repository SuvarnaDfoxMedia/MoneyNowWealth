import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export const runtime = "nodejs";

const BASE_URL = "https://mfapi.advisorkhoj.com";
const API_KEY = process.env.ADVISORKHOJ_API_KEY!;

const ENDPOINTS: Record<string, string> = {
  sip: "/calc/getSIPCalcResult",
  stepup: "/calc/getSIPCalcStepUpResult",
  lumpsum: "/calc/getLumpsumCalcResult",
  goal: "/calc/getGoalSettingCalcResult",
  retirement: "/calc/getCrorepatiResult",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const endpoint = ENDPOINTS[type];

    if (!endpoint) {
      return NextResponse.json({ status: 400, msg: "Invalid calculator type" });
    }

    const body = await req.json();

    const formData = new URLSearchParams({ key: API_KEY });
    Object.entries(body).forEach(([k, v]) =>
      formData.append(k, String(v))
    );

    const { data } = await axios.post(
      `${BASE_URL}${endpoint}`,
      formData.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("AdvisorKhoj API Error:", err?.message);
    return NextResponse.json({ status: 500, msg: "Calculation failed" });
  }
}
