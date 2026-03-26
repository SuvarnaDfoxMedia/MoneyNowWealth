import FinancialAssessment, {
  IFinancialAssessment,
} from "../models/financialAssessmentModel";
import fs from "fs";
import path from "path";

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

const buildPdfBuffer = (lines: string[]) => {
  const sanitizedLines = lines.map((line) => escapePdfText(line));

  const contentStream = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    "16 TL",
    ...sanitizedLines.map((line, index) =>
      index === 0 ? `(${line}) Tj` : `T* (${line}) Tj`,
    ),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
    `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream\nendobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

/* ============================================
   Interfaces
============================================ */
interface GetAssessmentParams {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

/* ============================================
   Service
============================================ */
export const financialAssessmentService = {
  /* ============================================
     1. CREATE ASSESSMENT (MAIN LOGIC)
  ============================================ */
  createAssessment: async (
    data: Partial<IFinancialAssessment>,
  ): Promise<IFinancialAssessment> => {
    if (!data.email || !data.phone) {
      throw new Error("Email and phone are required");
    }

    /* ===============================
       CALCULATIONS
    =============================== */
    const income = data.monthly_income || 0;
    const expenses = data.monthly_expenses || 0;
    const loans = data.loans || 0;
    const investments = data.investments || 0;

    const savings = income - expenses;
    const savings_ratio = income ? (savings / income) * 100 : 0;
    const loan_ratio = income ? (loans / income) * 100 : 0;

    /* ===============================
       SCORING LOGIC
    =============================== */
    let score = 0;

    // Savings score (40)
    if (savings_ratio >= 30) score += 40;
    else if (savings_ratio >= 20) score += 30;
    else if (savings_ratio >= 10) score += 20;
    else score += 10;

    // Investment score (20)
    if (investments >= income * 6) score += 20;
    else if (investments >= income * 3) score += 15;
    else score += 10;

    // Loan score (20)
    if (loan_ratio < 20) score += 20;
    else if (loan_ratio < 40) score += 10;
    else score += 5;

    // Protection score (20)
    score += 10;

    /* ===============================
       CATEGORY
    =============================== */
    let category: IFinancialAssessment["category"];

    if (score < 40) category = "Needs Attention";
    else if (score < 60) category = "Average";
    else if (score < 80) category = "Good";
    else category = "Excellent";

    /* ===============================
       REPORT GENERATION
    =============================== */
    const report = {
      wealth_creation:
        savings_ratio < 20
          ? "Increase your savings and start SIP investments."
          : "You are doing well. Increase SIP for faster wealth creation.",

      wealth_protection:
        "Ensure you have adequate life and health insurance.",

      wealth_restructuring:
        loans > income * 6
          ? "Your debt is high. Focus on reducing loans."
          : "Your debt levels are under control.",

      wealth_distribution:
        "Start planning retirement and long-term wealth transfer.",
    };

    /* ===============================
       CHART DATA
    =============================== */
    const chart_data = {
      savings_score: savings_ratio,
      investment_score: investments ? 70 : 40,
      protection_score: 50,
      distribution_score: 40,
    };

    /* ===============================
       SAVE DATA
    =============================== */
    const assessment = new FinancialAssessment({
      ...data,
      savings,
      savings_ratio,
      loan_ratio,
      score,
      category,
      ...report,
      chart_data,
      pdf_generated: false,
    });

    await assessment.save();

    return assessment;
  },

  /* ============================================
     2. UPDATE (USED IN CONTROLLER)
  ============================================ */
  update: async (
    id: string,
    updateData: Partial<IFinancialAssessment>,
  ) => {
    return FinancialAssessment.findByIdAndUpdate(id, updateData, {
      new: true,
    });
  },

  /* ============================================
     3. GET ALL
  ============================================ */
  getAll: async ({
    page = 1,
    limit = 10,
    search = "",
    includeDeleted = false,
    sortField = "created_at",
    sortOrder = "desc",
  }: GetAssessmentParams): Promise<
    PaginationResult<IFinancialAssessment>
  > => {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (!includeDeleted) filter.is_deleted = false;

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

    const [data, total] = await Promise.all([
      FinancialAssessment.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      FinancialAssessment.countDocuments(filter),
    ]);

    return {
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  /* ============================================
     4. GET BY ID
  ============================================ */
  getById: async (id: string) => {
    return FinancialAssessment.findOne({
      _id: id,
      is_deleted: false,
    }).lean();
  },

  /* ============================================
     5. GENERATE PDF
  ============================================ */
  generatePDF: async (id: string) => {
    const assessment = await FinancialAssessment.findById(id);
    if (!assessment) throw new Error("Assessment not found");

    const fileName = `report-${Date.now()}.pdf`;
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "financial-reports",
    );
    const filePath = path.join(
      uploadDir,
      fileName,
    );

    const pdfBuffer = buildPdfBuffer([
      "Financial Assessment Report",
      `Name: ${assessment.name || ""}`,
      `Email: ${assessment.email || ""}`,
      `Phone: ${assessment.phone || ""}`,
      `Score: ${assessment.score}`,
      `Category: ${assessment.category}`,
      `Savings: ${assessment.savings ?? 0}`,
      `Savings Ratio: ${assessment.savings_ratio ?? 0}%`,
      `Loan Ratio: ${assessment.loan_ratio ?? 0}%`,
      "",
      "Recommendations",
      `Wealth Creation: ${assessment.wealth_creation || ""}`,
      `Wealth Protection: ${assessment.wealth_protection || ""}`,
      `Wealth Restructuring: ${assessment.wealth_restructuring || ""}`,
      `Wealth Distribution: ${assessment.wealth_distribution || ""}`,
    ]);

    fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(filePath, pdfBuffer);

    assessment.pdf_file = fileName;
    assessment.pdf_generated = true;
    assessment.updated_at = new Date();

    await assessment.save();

    return assessment;
  },

  /* ============================================
     6. SOFT DELETE
  ============================================ */
  softDelete: async (id: string) => {
    const assessment = await FinancialAssessment.findById(id);
    if (!assessment) throw new Error("Not found");

    assessment.is_deleted = true;
    assessment.deleted_at = new Date();
    assessment.updated_at = new Date();

    return assessment.save();
  },

  /* ============================================
     7. RESTORE
  ============================================ */
  restore: async (id: string) => {
    const assessment = await FinancialAssessment.findById(id);
    if (!assessment) throw new Error("Not found");

    assessment.is_deleted = false;
    assessment.deleted_at = undefined;
    assessment.updated_at = new Date();

    return assessment.save();
  },

  /* ============================================
     8. GET FILE PATH
  ============================================ */
  getFilePath: async (id: string): Promise<string | null> => {
    const assessment = await FinancialAssessment.findById(id);
    if (!assessment || !assessment.pdf_file) return null;

    return path.join(
      process.cwd(),
      "uploads",
      "financial-reports",
      assessment.pdf_file,
    );
  },
};
