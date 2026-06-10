import axios from "axios";

interface VerifyRecaptchaOptions {
  token: string;
  expectedAction: string;
  minScore?: number;
  remoteIp?: string;
}

interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const getSecretKey = () => process.env.RECAPTCHA_SECRET_KEY?.trim() || "";

const parseMinScore = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
};

export const recaptchaService = {
  async verify({
    token,
    expectedAction,
    minScore = parseMinScore(process.env.RECAPTCHA_MIN_SCORE, 0.7),
    remoteIp,
  }: VerifyRecaptchaOptions) {
    const secret = getSecretKey();

    if (!secret) {
      throw new Error("Missing RECAPTCHA_SECRET_KEY");
    }

    if (!token?.trim()) {
      return {
        ok: false,
        statusCode: 400,
        message: "Captcha verification failed. Please try again.",
      };
    }

    const params = new URLSearchParams({
      secret,
      response: token.trim(),
    });

    if (remoteIp) {
      params.append("remoteip", remoteIp);
    }

    const { data } = await axios.post<RecaptchaVerifyResponse>(
      RECAPTCHA_VERIFY_URL,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    if (!data.success) {
      return {
        ok: false,
        statusCode: 400,
        message: "Captcha verification failed. Please try again.",
        details: data,
      };
    }

    if (data.action !== expectedAction) {
      return {
        ok: false,
        statusCode: 400,
        message: "Captcha action mismatch. Please refresh and try again.",
        details: data,
      };
    }

    const score = typeof data.score === "number" ? data.score : 0;
    if (score < minScore) {
      return {
        ok: false,
        statusCode: 403,
        message: "Captcha score too low. Please try again.",
        details: data,
      };
    }

    return {
      ok: true,
      statusCode: 200,
      message: "Captcha verified successfully",
      score,
      details: data,
    };
  },
};
