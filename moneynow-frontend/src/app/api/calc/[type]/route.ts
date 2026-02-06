import { NextResponse } from "next/server";
import axios from "axios";

const BASE_URL = process.env.ADVISORKHOJ_BASE_URL;
const API_KEY = process.env.ADVISORKHOJ_API_KEY;

const ENDPOINT_MAP: Record<string, string> = {
  lumpsum: "/calc/getLumpsumCalcResult",
  sip: "/calc/getSIPCalcResult",
  goal: "/calc/getGoalSettingCalcResult",
  stepup: "/calc/getSIPCalcStepUpResult",
  targetSip: "/calc/getTargetAmountSIPCalcResult",
  targetLumpsum: "/calc/getLumpsumTargetCalcResult",
  crorepati: "/calc/getCrorepatiResult",
  retirement: "/calc/getCrorepatiResult",
  carLoan: "/calc/getEMICalcResult",
  homeLoan: "/calc/getEMICalcResult",
  swp: "/baroda/getSwpCalResult",
  personalLoan: "/calc/getEMICalcResult",
  educationLoan: "/calc/getEMICalcResult",
  futureValue: "/calc/getFutureValueCalcResult",
  compounding: "/calc/getCompoundingResult",
  childrenEducation: "/calc/getEducationPlannerResult",
  spendingLess: "/calc/getSpendingLessCalcResult",
};

function toQueryString(obj: Record<string, any>) {
  return Object.entries(obj)
    .map(
      ([key, val]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(val ?? "")}`,
    )
    .join("&");
}

export async function POST(
  req: Request,
  context: { params: { type: string } },
) {
  try {
    // Await the params destructuring
    const type = context.params.type;

    if (!BASE_URL || !API_KEY) {
      return NextResponse.json(
        { message: "Missing API config" },
        { status: 500 },
      );
    }

    const endpoint = ENDPOINT_MAP[type];
    if (!endpoint) {
      return NextResponse.json(
        { message: "Invalid calculator type" },
        { status: 400 },
      );
    }

    const payload = await req.json();
    const finalPayload = { key: API_KEY, ...payload };

    const query = toQueryString(finalPayload);
    const url = `${BASE_URL}${endpoint}?${query}`;

    const { data } = await axios.post(url, null, {
      headers: { "Content-Type": "application/json" },
    });

    return NextResponse.json(data);
  } catch (err: any) {
    console.error(
      "AdvisorKhoj API error:",
      err?.response?.data || err?.message,
    );
    return NextResponse.json(
      {
        message: "Calculation failed",
        error: err?.response?.data || err?.message,
      },
      { status: 500 },
    );
  }
}
