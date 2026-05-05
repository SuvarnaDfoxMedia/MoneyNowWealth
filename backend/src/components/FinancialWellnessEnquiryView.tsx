import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../hooks/useCommonCrud";

interface QuestionAnswerItem {
  id: string;
  pillar: string;
  question: string;
  answer: string;
  score: number;
}

interface FinancialAssessmentDetail {
  _id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  category: string;
  callback_requested?: boolean;
  created_at?: string;
  question_answers?: QuestionAnswerItem[];
}

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString("en-GB");
};

export default function FinancialWellnessEnquiryView() {
  const { id, role } = useParams<{ id: string; role?: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<FinancialAssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const { getOne } = useCommonCrud<FinancialAssessmentDetail>({
    module: "financial-assessments",
    role: role || "admin",
  });

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        const res: any = await getOne(id);
        const data = (res?.data || res) as FinancialAssessmentDetail;
        if (!data?._id) {
          toast.error("Financial wellness enquiry not found");
          return;
        }
        setRecord(data);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load enquiry");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [getOne, id]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading enquiry details...</div>;
  }

  if (!record) {
    return <div className="p-6 text-gray-500">No enquiry details found.</div>;
  }

  const responseItems = Array.isArray(record.question_answers)
    ? record.question_answers
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiArrowLeft /> Back
        </button>
      </div>

      <h2 className="text-xl font-medium text-gray-800">
        Financial Wellness Enquiry Details
      </h2>

      <div className="mt-4 grid gap-4 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2">
        <p>
          <span className="font-semibold">Name:</span> {record.name || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Date:</span>{" "}
          {formatDate(record.created_at)}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {record.email || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Phone:</span> {record.phone || "N/A"}
        </p>
        <p>
          <span className="font-semibold">Stored Score:</span> {record.score}
          /100
        </p>
        <p>
          <span className="font-semibold">Category:</span> {record.category}
        </p>
        <p>
          <span className="font-semibold">Callback Requested:</span>{" "}
          {record.callback_requested ? "Yes" : "No"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={record.phone ? `tel:${record.phone}` : "#"}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <FiPhone /> Call user
        </a>
        <a
          href={record.email ? `mailto:${record.email}` : "#"}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <FiMail /> Email user
        </a>
      </div>

      <div className="mt-5 rounded-xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Selected Responses (Score Basis)
        </h3>
        {responseItems.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No question responses captured for this record.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {responseItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">
                  {index + 1}. {item.question}
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  <span className="font-medium">Answer:</span> {item.answer || "N/A"}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Score:</span> {item.score}/3
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
