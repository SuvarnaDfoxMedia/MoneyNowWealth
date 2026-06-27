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
  leadSource?: string;
  assessmentVariant?: string;
}

interface PaginationResult<T> {
  data: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

type JourneyQuestionAnswer = {
  id: string;
  pillar: string;
  question: string;
  answer: string;
  score: number;
};

const JOURNEY_PILLAR_COPY = {
  habits: {
    title: "Habits & cash flow",
    needsAttention:
      "Your current money routine may need more stability. Building a simple saving habit and giving yourself more breathing room each month could make a meaningful difference.",
    couldBeStrengthened:
      "You appear to have some consistency already, but there is still room to make your monthly money flow more intentional and less reactive.",
    onTrack:
      "Your answers suggest a reasonably steady approach to spending and saving, which is a strong base for long-term financial decisions.",
  },
  protection: {
    title: "Protection & emergencies",
    needsAttention:
      "Your financial safety net may not be strong enough yet. Emergency reserves and insurance cover may need closer attention so that unexpected events do not disrupt your plans.",
    couldBeStrengthened:
      "You have likely taken a few protective steps already, but your financial backup plan could still be made more dependable.",
    onTrack:
      "You seem to have put several protection basics in place, which can help you stay calmer and more consistent with your long-term plans.",
  },
  investing: {
    title: "Investing behaviour",
    needsAttention:
      "You may still be at an early stage of investing or your current investments may not yet be organized around long-term outcomes.",
    couldBeStrengthened:
      "You have started investing, but there may still be room to make the approach more consistent and more clearly tied to your goals.",
    onTrack:
      "Your investing behaviour appears reasonably structured already, which gives you a stronger base for future wealth-building decisions.",
  },
  goals: {
    title: "Goals & clarity",
    needsAttention:
      "Your answers suggest that some of your future goals may still be unclear or not yet translated into a practical financial roadmap.",
    couldBeStrengthened:
      "You seem to have some direction, but your goals may benefit from clearer prioritisation, amounts, and timelines.",
    onTrack:
      "You appear to have fairly clear goals and a useful sense of direction, which can make financial planning much easier to sustain.",
  },
  debt: {
    title: "Debt & obligations",
    needsAttention:
      "Your current debt or EMI commitments may be creating visible pressure on your monthly flexibility and savings capacity.",
    couldBeStrengthened:
      "Your debt looks manageable in parts, but there may still be opportunities to reduce strain and improve financial flexibility.",
    onTrack:
      "Your debt obligations appear to be under reasonable control, which gives you more room to focus on future goals.",
  },
} as const;

const getJourneyStatus = (score: number) => {
  if (score <= 1) return "Needs attention";
  if (score === 2) return "Could be strengthened";
  return "On a reasonable track";
};

const buildJourneySummary = (category: string) => {
  if (category === "Needs attention") {
    return "Your current snapshot suggests there are a few important areas that may need attention first. A guided conversation can help you decide what to prioritise now and what can follow later.";
  }

  if (category === "Could be strengthened") {
    return "Your current snapshot suggests that you already have some healthy foundations in place, with a few areas that could be made stronger through better structure and clearer prioritisation.";
  }

  return "Your current snapshot suggests that several important parts of your money life are on a reasonable track today. The next step is usually to maintain that consistency and refine your longer-term planning.";
};

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
    if (
      data.assessment_variant === "money_life_check" ||
      (Array.isArray(data.question_answers) && data.question_answers.length > 0) ||
      (Array.isArray(data.pillar_report) && data.pillar_report.length > 0)
    ) {
      const answers = (data.question_answers || []) as JourneyQuestionAnswer[];
      const hasAnswers = answers.length > 0;
      const hasPillarReport =
        Array.isArray(data.pillar_report) && data.pillar_report.length > 0;

      if (!hasAnswers && !hasPillarReport) {
        throw new Error("Question answers or pillar report are required");
      }

      let pillarReport = (data.pillar_report || []) as NonNullable<
        IFinancialAssessment["pillar_report"]
      >;
      let overallStatus = data.category as IFinancialAssessment["category"];
      let overallScore = Number(data.score || 0);
      let chartData = (data.chart_data || {}) as Record<string, number>;
      let summaryText = data.summary_text || "";

      if (hasAnswers) {
        const grouped = answers.reduce<Record<string, JourneyQuestionAnswer[]>>(
          (accumulator, answer) => {
            const key = answer.pillar || "other";
            if (!accumulator[key]) accumulator[key] = [];
            accumulator[key].push(answer);
            return accumulator;
          },
          {},
        );

        pillarReport = Object.entries(JOURNEY_PILLAR_COPY).map(([key, config]) => {
          const scores = (grouped[key] || []).map((item) => Number(item.score) || 0);
          const average = scores.length
            ? Math.round(
                scores.reduce((sum, value) => sum + value, 0) / scores.length,
              )
            : 0;

          const status = getJourneyStatus(average);
          const copy =
            status === "Needs attention"
              ? config.needsAttention
              : status === "Could be strengthened"
                ? config.couldBeStrengthened
                : config.onTrack;

          return {
            key,
            title: config.title,
            status,
            score: average,
            copy,
          };
        });

        const averageScore = pillarReport.length
          ? pillarReport.reduce((sum, item) => sum + item.score, 0) /
            pillarReport.length
          : 0;
        overallScore = Math.max(
          0,
          Math.min(100, Math.round((averageScore / 3) * 100)),
        );
        overallStatus =
          overallScore <= 39
            ? "Needs attention"
            : overallScore <= 69
              ? "Could be strengthened"
              : "On a reasonable track";

        chartData = pillarReport.reduce<Record<string, number>>(
          (accumulator, item) => {
            accumulator[`${item.key}_score`] = Math.round((item.score / 3) * 100);
            return accumulator;
          },
          {},
        );
        summaryText = buildJourneySummary(overallStatus);
      }

      const assessment = new FinancialAssessment({
        ...data,
        assessment_variant: "money_life_check",
        category: overallStatus,
        score: overallScore,
        summary_text: summaryText,
        question_answers: answers,
        pillar_report: pillarReport,
        chart_data: chartData,
        wealth_creation: "",
        wealth_protection: "",
        wealth_restructuring: "",
        wealth_distribution: "",
        lead_source: data.lead_source || "financial_wellness",
        pdf_generated: false,
      });

      await assessment.save();

      return assessment;
    }

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
      assessment_variant: "legacy_financial_wellness",
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
    leadSource = "",
    assessmentVariant = "",
  }: GetAssessmentParams): Promise<
    PaginationResult<IFinancialAssessment>
  > => {
    const finalLimit = Math.min(Math.max(Number(limit) || 10, 1), 200);
    const skip = (page - 1) * finalLimit;

    const filter: Record<string, any> = {};
    if (!includeDeleted) filter.is_deleted = false;
    if (leadSource.trim()) {
      const escaped = leadSource.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.lead_source = { $regex: `^${escaped}$`, $options: "i" };
    }
    if (assessmentVariant.trim()) {
      filter.assessment_variant = assessmentVariant.trim();
    }

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
        .limit(finalLimit)
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

    const pdfLines =
      assessment.assessment_variant === "money_life_check"
        ? [
            "Money Life Snapshot Report",
            `Name: ${assessment.name || ""}`,
            `Email: ${assessment.email || ""}`,
            `Phone: ${assessment.phone || ""}`,
            `Overall Score: ${assessment.score}`,
            `Current Status: ${assessment.category}`,
            "",
            `Summary: ${assessment.summary_text || ""}`,
            "",
            "Pillar Summary",
            ...((assessment.pillar_report || []).flatMap((pillar) => [
              `${pillar.title}: ${pillar.status} (${pillar.score}/3)`,
              `${pillar.copy}`,
              "",
            ]) as string[]),
          ]
        : [
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
          ];

    const pdfBuffer = buildPdfBuffer(pdfLines);

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
