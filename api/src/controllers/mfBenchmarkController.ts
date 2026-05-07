import type { Request, Response } from "express";
import * as mfBenchmarkService from "../services/mfBenchmarkService";
import { sendError, sendSuccess } from "../utils/apiResponse";

const hasValidBody = (body: unknown) =>
  !!body && typeof body === "object" && !Array.isArray(body);

export const getBenchmarks = async (req: Request, res: Response) => {
  try {
    const response = await mfBenchmarkService.getBenchmarks(req.query);
    const data = response?.data ?? response;
    const extra =
      response && typeof response === "object"
        ? Object.fromEntries(
            Object.entries(response).filter(
              ([key]) => !["success", "message", "data"].includes(key),
            ),
          )
        : {};
    return sendSuccess(res, "Benchmarks fetched successfully", data, 200, extra);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch benchmarks", 500);
  }
};

export const getBenchmarkById = async (req: Request, res: Response) => {
  try {
    const data = await mfBenchmarkService.getBenchmarkById(req.params.id);
    return sendSuccess(res, "Benchmark fetched successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 500;
    return sendError(res, error.message || "Failed to fetch benchmark", code);
  }
};

export const addBenchmark = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) return sendError(res, "Request body is required", 400);
    const data = await mfBenchmarkService.createBenchmark(req.body);
    return sendSuccess(res, "Benchmark created successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to create benchmark", 400);
  }
};

export const updateBenchmark = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) return sendError(res, "Request body is required", 400);
    const data = await mfBenchmarkService.updateBenchmark(req.params.id, req.body);
    return sendSuccess(res, "Benchmark updated successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to update benchmark", code);
  }
};

export const deleteBenchmark = async (req: Request, res: Response) => {
  try {
    const data = await mfBenchmarkService.deleteBenchmark(req.params.id);
    return sendSuccess(res, "Benchmark deleted successfully", data);
  } catch (error: any) {
    const code = String(error.message || "").includes("not found") ? 404 : 400;
    return sendError(res, error.message || "Failed to delete benchmark", code);
  }
};

export const addBenchmarkReturn = async (req: Request, res: Response) => {
  try {
    if (!hasValidBody(req.body)) return sendError(res, "Request body is required", 400);
    const data = await mfBenchmarkService.createBenchmarkReturn(req.body);
    return sendSuccess(res, "Benchmark return saved successfully", data, 201);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to save benchmark return", 400);
  }
};

export const getBenchmarkReturns = async (req: Request, res: Response) => {
  try {
    const data = await mfBenchmarkService.getBenchmarkReturns(req.params.benchmarkId);
    return sendSuccess(res, "Benchmark returns fetched successfully", data);
  } catch (error: any) {
    return sendError(res, error.message || "Failed to fetch benchmark returns", 500);
  }
};
