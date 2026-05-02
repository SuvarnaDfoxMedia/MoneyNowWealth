// Chatbot integration is temporarily disabled for lead review; keep controller code commented instead of deleting it.
// import type { NextFunction, Request, Response } from "express";
// import { sendError, sendSuccess } from "../../utils/apiResponse.js";
//
// type GeminiStatus = {
//   valid: boolean;
//   error: string | null;
// };
//
// type ChatHistoryItem = {
//   role?: string;
//   content?: string;
//   text?: string;
//   parts?: Array<{ text?: string }>;
// };
//
// const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
//
// const normalizeHistory = (history: unknown): Array<{
//   role: "user" | "model";
//   parts: Array<{ text: string }>;
// }> => {
//   if (!Array.isArray(history)) {
//     return [];
//   }
//
//   return history
//     .map((item: ChatHistoryItem) => {
//       const text =
//         typeof item?.content === "string"
//           ? item.content
//           : typeof item?.text === "string"
//             ? item.text
//             : Array.isArray(item?.parts)
//               ? item.parts
//                   .map((part) => (typeof part?.text === "string" ? part.text : ""))
//                   .join("\n")
//               : "";
//
//       const role: "user" | "model" =
//         item?.role === "model" ? "model" : "user";
//
//       return {
//         role,
//         parts: [{ text: text.trim() }],
//       };
//     })
//     .filter((item) => item.parts[0].text);
// };
//
// export const getGeminiApiKeyStatus = (): GeminiStatus => {
//   const apiKey = process.env.GEMINI_API_KEY?.trim();
//
//   if (!apiKey) {
//     return {
//       valid: false,
//       error: "GEMINI_API_KEY is not configured",
//     };
//   }
//
//   return {
//     valid: true,
//     error: null,
//   };
// };
//
// export const sendChatMessage = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const { message, history, systemInstruction, generationConfig } = req.body ?? {};
//     const trimmedMessage =
//       typeof message === "string" ? message.trim() : "";
//
//     if (!trimmedMessage) {
//       return sendError(res, "Message is required", 400);
//     }
//
//     const apiKeyStatus = getGeminiApiKeyStatus();
//     if (!apiKeyStatus.valid) {
//       return sendError(res, apiKeyStatus.error || "Gemini is not configured", 500);
//     }
//
//     const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
//     const contents = [
//       ...normalizeHistory(history),
//       { role: "user" as const, parts: [{ text: trimmedMessage }] },
//     ];
//
//     const payload: Record<string, unknown> = { contents };
//
//     if (typeof systemInstruction === "string" && systemInstruction.trim()) {
//       payload.systemInstruction = {
//         parts: [{ text: systemInstruction.trim() }],
//       };
//     }
//
//     if (
//       generationConfig &&
//       typeof generationConfig === "object" &&
//       !Array.isArray(generationConfig)
//     ) {
//       payload.generationConfig = generationConfig;
//     }
//
//     const geminiResponse = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       },
//     );
//
//     const responseData = await geminiResponse.json();
//
//     if (!geminiResponse.ok) {
//       const geminiMessage =
//         responseData?.error?.message || "Gemini request failed";
//
//       return sendError(res, geminiMessage, geminiResponse.status || 502, {
//         provider: "gemini",
//       });
//     }
//
//     const reply = responseData?.candidates?.[0]?.content?.parts
//       ?.map((part: { text?: string }) => part?.text || "")
//       .join("")
//       .trim();
//
//     if (!reply) {
//       return sendError(res, "Gemini returned an empty response", 502, {
//         provider: "gemini",
//       });
//     }
//
//     return sendSuccess(
//       res,
//       "Chat response generated successfully",
//       {
//         reply,
//         model,
//       },
//       200,
//       {
//         reply,
//         model,
//       },
//     );
//   } catch (error) {
//     return next(error);
//   }
// };
