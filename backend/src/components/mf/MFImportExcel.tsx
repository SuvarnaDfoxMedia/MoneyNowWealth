import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosApi } from "../../api/axios";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";

export default function MFImportExcel() {
  const { role = "admin" } = useParams();
  const navigate = useNavigate();
  const [filePath, setFilePath] = useState("D:\\Dfox-Media\\projects\\MoneyNowDoc\\Moneynow_Mutual_Fund_Database_1.0.xlsx");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await axiosApi.post(`/${role}/mf/import/excel`, { filePath, dryRun });
      setResult(res);
    } catch (err: any) {
      setResult({ success: false, message: err?.response?.data?.message || err?.message || "Import failed" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFilePath("D:\\Dfox-Media\\projects\\MoneyNowDoc\\Moneynow_Mutual_Fund_Database_1.0.xlsx");
    setDryRun(true);
    setResult(null);
  };

  return (
    <MFFormContainer>
      <MFFormHeader
        title="Import MF Excel"
        onBack={() => navigate(`/${role}/mf/main-categories`)}
      />
      <form onSubmit={onSubmit} className="space-y-8">
        <div>
          <label className="block mb-2 text-gray-700 font-medium">Excel File Path</label>
          <input
          className={mfInputClass}
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="Excel absolute file path"
          required
        />
        </div>
        <label className="flex items-center gap-3 text-gray-700 font-medium">
          <input className={mfCheckboxClass} type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry Run
        </label>
        <MFFormActions
          onReset={resetForm}
          isSubmitting={loading}
          submitLabel="Run Import"
        />
      </form>

      {result && (
        <div className="mt-6 p-4 rounded border bg-gray-50">
          <p className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message || "Result"}</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap break-all">{JSON.stringify(result?.data || result, null, 2)}</pre>
        </div>
      )}
    </MFFormContainer>
  );
}
