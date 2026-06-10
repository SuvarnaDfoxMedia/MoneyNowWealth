import type { Request, Response } from "express";
import { financialAssessmentService } from "../services/financialAssessmentService";
import { syncLeadToGetResponse } from "../services/getresponseService";
import { sendError, sendSuccess } from "../utils/apiResponse";

/* ============================================
   Helper: Parse Request Body
============================================ */
const parseBody = (req: Request) => {
  const body: any = { ...req.body };

  body.age = body.age ? Number(body.age) : undefined;
  body.monthly_income = body.monthly_income
    ? Number(body.monthly_income)
    : 0;
  body.monthly_expenses = body.monthly_expenses
    ? Number(body.monthly_expenses)
    : 0;
  body.loans = body.loans ? Number(body.loans) : 0;
  body.investments = body.investments ? Number(body.investments) : 0;

  return body;
};

/* ============================================
   Validators
============================================ */
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string) => {
  return /^[6-9]\d{9}$/.test(phone);
};

const normalizeLeadName = (name: unknown) =>
  typeof name === "string" ? name.trim() : "";

const normalizeLeadEmail = (email: unknown) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const normalizeLeadPhone = (phone: unknown) =>
  typeof phone === "string" || typeof phone === "number"
    ? String(phone).trim()
    : "";

/* ============================================
   CONTROLLER FUNCTIONS
============================================ */

/* ---------------------------------------------------
   1. Submit Financial Assessment (MAIN API)
--------------------------------------------------- */
export const submitAssessment = async (req: Request, res: Response) => {
  try {
    const body = parseBody(req);
    const isMoneyLifeCheck =
      body.assessment_variant === "money_life_check" ||
      (Array.isArray(body.question_answers) && body.question_answers.length > 0);

    const {
      name,
      email,
      phone,
      monthly_income,
      monthly_expenses,
    } = body;

if (!name || !email || !phone) {
      return sendError(res, "Name, email and phone are required", 400);
    }

    if (!isValidEmail(email)) {
      return sendError(res, "Invalid email format", 400);
    }

    if (!isValidPhone(phone)) {
      return sendError(res, "Invalid phone number", 400);
    }

    if (!isMoneyLifeCheck && (!monthly_income || !monthly_expenses)) {
      return sendError(
        res,
        "Monthly income and expenses are required",
        400,
      );
    }

    if (!isMoneyLifeCheck && monthly_income <= 0) {
      return sendError(res, "Income must be greater than 0", 400);
    }

const assessment =
      await financialAssessmentService.createAssessment(body);

    try {
      await syncLeadToGetResponse({
        email: normalizeLeadEmail(assessment.email),
        name: normalizeLeadName(assessment.name),
        mobile: normalizeLeadPhone(assessment.phone),
        source: "financial_assessment",
      });
    } catch (syncError: any) {
      console.error("Financial assessment GetResponse sync failed:", syncError.message);
    }

const pdfResult =
      await financialAssessmentService.generatePDF(
        assessment._id.toString(),
      );

const pdfObj = pdfResult.toObject() as any;

    if (assessment.assessment_variant === "money_life_check") {
      return sendSuccess(
        res,
        "Assessment completed successfully",
        {
          id: assessment._id,
          score: assessment.score,
          category: assessment.category,
          summary: assessment.summary_text,
          pillar_results: assessment.pillar_report || [],
          chart_data: assessment.chart_data || {},
          pdf_url: pdfObj.pdf_url,
          next_step: "Talk to someone about this",
        },
        201,
      );
    }

return sendSuccess(
      res,
      "Assessment completed successfully",
      {
        id: assessment._id,
        score: assessment.score,
        category: assessment.category,

        report: {
          wealth_creation: assessment.wealth_creation,
          wealth_protection: assessment.wealth_protection,
          wealth_restructuring: assessment.wealth_restructuring,
          wealth_distribution: assessment.wealth_distribution,
        },

        chart_data: assessment.chart_data,

        pdf_url: pdfObj.pdf_url,

        next_step: "Book Discovery Call",
      },
      201,
    );
  } catch (error: any) {
    console.error("Submit assessment error:", error);

    return sendError(
      res,
      error.message || "Failed to submit assessment",
      400,
    );
  }
};

/* ---------------------------------------------------
   2. Get All Assessments (Admin)
--------------------------------------------------- */
export const getAssessments = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      includeDeleted = "false",
      sortField = "created_at",
      sortOrder = "desc",
    } = req.query;

    const result = await financialAssessmentService.getAll({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      includeDeleted: includeDeleted === "true",
      sortField: String(sortField),
      sortOrder: sortOrder as "asc" | "desc",
    });

    return sendSuccess(res, "Assessments fetched successfully", result, 200);
  } catch (error: any) {
    console.error("Get assessments error:", error);

    return sendError(
      res,
      error.message || "Failed to fetch assessments",
      500,
    );
  }
};

/* ---------------------------------------------------
   3. Get Single Assessment
--------------------------------------------------- */
export const getAssessmentById = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const assessment = await financialAssessmentService.getById(id);

    if (!assessment) {
      return sendError(res, "Assessment not found", 404);
    }

    return sendSuccess(
      res,
      "Assessment fetched successfully",
      assessment,
      200,
    );
  } catch (error: any) {
    console.error("Get assessment error:", error);

    return sendError(
      res,
      error.message || "Failed to fetch assessment",
      500,
    );
  }
};

/* ---------------------------------------------------
   4. Delete (Soft Delete)
--------------------------------------------------- */
export const deleteAssessment = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const assessment = await financialAssessmentService.softDelete(id);

    return sendSuccess(
      res,
      "Assessment deleted successfully",
      assessment,
      200,
    );
  } catch (error: any) {
    console.error("Delete assessment error:", error);

    return sendError(
      res,
      error.message || "Failed to delete assessment",
      400,
    );
  }
};

/* ---------------------------------------------------
   5. Restore Assessment
--------------------------------------------------- */
export const restoreAssessment = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const assessment = await financialAssessmentService.restore(id);

    return sendSuccess(
      res,
      "Assessment restored successfully",
      assessment,
      200,
    );
  } catch (error: any) {
    console.error("Restore assessment error:", error);

    return sendError(
      res,
      error.message || "Failed to restore assessment",
      400,
    );
  }
};

/* ---------------------------------------------------
   6. Toggle Contacted Status (CRM Use)
--------------------------------------------------- */
export const toggleContactedStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const { is_contacted } = req.body;

    let isContactedBool: boolean;

    if (typeof is_contacted === "boolean") {
      isContactedBool = is_contacted;
    } else if (typeof is_contacted === "number") {
      isContactedBool = is_contacted === 1;
    } else if (typeof is_contacted === "string") {
      isContactedBool =
        is_contacted.toLowerCase() === "true" ||
        is_contacted === "1";
    } else {
      return sendError(
        res,
        "is_contacted must be true/false or 1/0",
        400,
      );
    }

    const assessment = await financialAssessmentService.update(id, {
      is_contacted: isContactedBool,
    });

    if (!assessment) {
      return sendError(res, "Assessment not found", 404);
    }

    return sendSuccess(
      res,
      isContactedBool
        ? "Marked as contacted"
        : "Marked as not contacted",
      assessment,
      200,
    );
  } catch (error: any) {
    console.error("Toggle contacted error:", error);

    return sendError(
      res,
      error.message || "Failed to update status",
      500,
    );
  }
};
