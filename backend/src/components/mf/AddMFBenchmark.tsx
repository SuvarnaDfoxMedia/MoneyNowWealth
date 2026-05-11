import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useCommonCrud } from "../../hooks/useCommonCrud";
import { useScrollToFirstError } from "../../hooks/useScrollToFirstError";
import {
  MFFormActions,
  MFFormContainer,
  MFFormHeader,
  mfCheckboxClass,
  mfInputClass,
} from "./MFFormShared";
import {
  getApiMessage,
  isDuplicateEntryMessage,
  toDuplicateFieldMessage,
} from "./mfValidation";
import { axiosApi } from "../../api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

const defaultAnnualYears = () => {
  const years: string[] = [];
  const current = new Date().getFullYear();
  for (let year = current; year >= 2017; year -= 1) years.push(String(year));
  return years;
};

export default function AddMFBenchmark() {
  const { id, role = "admin" } = useParams();
  const navigate = useNavigate();
  const { getOne, createRecord, updateRecord } = useCommonCrud({
    role,
    module: "mf/benchmarks",
    listKey: "data",
  });
  const { formRef, scrollToFirstError } = useScrollToFirstError();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    is_active: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [annualYears, setAnnualYears] = useState<string[]>(defaultAnnualYears());
  const [returnsForm, setReturnsForm] = useState({
    date: null as Date | null,
    benchmark_trailing_1w: "",
    benchmark_trailing_1m: "",
    benchmark_trailing_3m: "",
    benchmark_trailing_6m: "",
    benchmark_trailing_1y: "",
    benchmark_trailing_3y: "",
    benchmark_trailing_5y: "",
    benchmark_trailing_10y: "",
    since_launch: "",
    bench_YTD: "",
    annual: Object.fromEntries(defaultAnnualYears().map((year) => [year, ""])) as Record<string, string>,
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res: any = await getOne(id);
      const d = res?.data || {};
      setForm({
        name: d.name || "",
        is_active: d.is_active ?? 1,
      });
      const benchmarkId = d._id || id;
      if (benchmarkId) {
        const returnsRes: any = await axiosApi.get(`/${role}/mf/benchmark-returns/${benchmarkId}`);
        const latest = Array.isArray(returnsRes?.data) ? returnsRes.data[0] : null;
        if (latest) {
          const incomingYears = Object.keys(latest?.annual?.yearly_returns || latest?.annual || {}).filter((year) => /^\d{4}$/.test(year));
          const mergedYears = [...new Set([...incomingYears, ...defaultAnnualYears()])].sort((a, b) => Number(b) - Number(a));
          setAnnualYears(mergedYears);
          setReturnsForm({
            date: latest.date ? new Date(latest.date) : null,
            benchmark_trailing_1w: (latest?.trailing?.["1w"] ?? latest.return_1w)?.toString?.() || "",
            benchmark_trailing_1m: (latest?.trailing?.["1m"] ?? latest.return_1m)?.toString?.() || "",
            benchmark_trailing_3m: (latest?.trailing?.["3m"] ?? latest.return_3m)?.toString?.() || "",
            benchmark_trailing_6m: (latest?.trailing?.["6m"] ?? latest.return_6m)?.toString?.() || "",
            benchmark_trailing_1y: (latest?.trailing?.["1y"] ?? latest.return_1y)?.toString?.() || "",
            benchmark_trailing_3y: (latest?.trailing?.["3y"] ?? latest.return_3y)?.toString?.() || "",
            benchmark_trailing_5y: (latest?.trailing?.["5y"] ?? latest.return_5y)?.toString?.() || "",
            benchmark_trailing_10y: (latest?.trailing?.["10y"] ?? latest.return_10y)?.toString?.() || "",
            since_launch: (latest?.trailing?.since_launch ?? latest?.return_since_inception)?.toString?.() || "",
            bench_YTD: (latest?.annual?.ytd ?? latest?.return_ytd)?.toString?.() || "",
            annual: Object.fromEntries(
              mergedYears.map((year) => [year, latest?.annual?.yearly_returns?.[year]?.toString?.() || latest?.annual?.[year]?.toString?.() || ""]),
            ) as Record<string, string>,
          });
        }
      }
    })();
  }, [getOne, id]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Benchmark name is required";
    if (form.name.trim().length > 200)
      next.name = "Benchmark name must be under 200 characters";
    setErrors(next);
    if (Object.keys(next).length > 0) scrollToFirstError(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        is_active: form.is_active,
      };
      const response: any = id ? await updateRecord(id, payload) : await createRecord(payload);
      const benchmarkId = response?.data?._id || id;
      const hasReturnValues = [
        returnsForm.benchmark_trailing_1w,
        returnsForm.benchmark_trailing_1m,
        returnsForm.benchmark_trailing_3m,
        returnsForm.benchmark_trailing_6m,
        returnsForm.benchmark_trailing_1y,
        returnsForm.benchmark_trailing_3y,
        returnsForm.benchmark_trailing_5y,
        returnsForm.benchmark_trailing_10y,
        returnsForm.since_launch,
        returnsForm.bench_YTD,
        ...annualYears.map((year) => returnsForm.annual[year]),
      ].some((value) => String(value || "").trim() !== "");
      if (benchmarkId && returnsForm.date && hasReturnValues) {
        await axiosApi.create(`/${role}/mf/benchmark-returns/create`, {
          benchmark_id: benchmarkId,
          date: `${returnsForm.date.getFullYear()}-${String(returnsForm.date.getMonth() + 1).padStart(2, "0")}-${String(returnsForm.date.getDate()).padStart(2, "0")}`,
          trailing: {
            "1w": returnsForm.benchmark_trailing_1w === "" ? null : Number(returnsForm.benchmark_trailing_1w),
            "1m": returnsForm.benchmark_trailing_1m === "" ? null : Number(returnsForm.benchmark_trailing_1m),
            "3m": returnsForm.benchmark_trailing_3m === "" ? null : Number(returnsForm.benchmark_trailing_3m),
            "6m": returnsForm.benchmark_trailing_6m === "" ? null : Number(returnsForm.benchmark_trailing_6m),
            "1y": returnsForm.benchmark_trailing_1y === "" ? null : Number(returnsForm.benchmark_trailing_1y),
            "3y": returnsForm.benchmark_trailing_3y === "" ? null : Number(returnsForm.benchmark_trailing_3y),
            "5y": returnsForm.benchmark_trailing_5y === "" ? null : Number(returnsForm.benchmark_trailing_5y),
            "10y": returnsForm.benchmark_trailing_10y === "" ? null : Number(returnsForm.benchmark_trailing_10y),
            since_launch: returnsForm.since_launch === "" ? null : Number(returnsForm.since_launch),
          },
          annual: {
            ytd: returnsForm.bench_YTD === "" ? null : Number(returnsForm.bench_YTD),
            yearly_returns: Object.fromEntries(
              annualYears.map((year) => [year, returnsForm.annual[year] === "" ? null : Number(returnsForm.annual[year])]),
            ),
          },
        });
      }
      navigate(`/${role}/benchmark/master`);
    } catch (error: any) {
      const next: Record<string, string> = {};
      const message = getApiMessage(error);
      if (isDuplicateEntryMessage(message)) {
        next.name = toDuplicateFieldMessage(message, "Benchmark name");
      }
      if (Object.keys(next).length > 0) {
        setErrors(next);
        scrollToFirstError(next);
      } else {
        toast.error(message || "Failed to save benchmark");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <MFFormContainer>
      <MFFormHeader
        title={`${id ? "Edit" : "Add"} Benchmark`}
        onBack={() => navigate(`/${role}/benchmark/master`)}
      />
      <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="block mb-2 text-gray-700 font-medium">Name</label>
            <input
              className={`${mfInputClass} ${errors.name ? "!border-red-500 focus:!border-red-500" : ""}`}
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
            {errors.name ? (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            ) : null}
          </div>
        </div>
        <label className="flex items-center gap-3 text-gray-700 font-medium">
          <input
            className={mfCheckboxClass}
            type="checkbox"
            checked={form.is_active === 1}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                is_active: event.target.checked ? 1 : 0,
              }))
            }
          />
          Active
        </label>
        <div className="rounded-lg border border-gray-200 p-4">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Benchmark Returns</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative">
              <DatePicker
                selected={returnsForm.date}
                onChange={(date) => setReturnsForm((prev) => ({ ...prev, date: date as Date | null }))}
                dateFormat="dd/MM/yyyy"
                className={`${mfInputClass} pr-10`}
                placeholderText="dd/mm/yyyy"
              />
              <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            {[
              "benchmark_trailing_1w","benchmark_trailing_1m","benchmark_trailing_3m","benchmark_trailing_6m",
              "benchmark_trailing_1y","benchmark_trailing_3y","benchmark_trailing_5y","benchmark_trailing_10y","since_launch","bench_YTD",
            ].map((key) => (
              <input
                key={key}
                className={mfInputClass}
                placeholder={key.replace("return_", "").toUpperCase().replace("_", " ")}
                value={(returnsForm as any)[key]}
                onChange={(event) =>
                  setReturnsForm((prev) => ({ ...prev, [key]: event.target.value }))
                }
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {annualYears.map((year) => (
              <input
                key={year}
                className={mfInputClass}
                placeholder={`Annual ${year}`}
                value={returnsForm.annual[year]}
                onChange={(event) =>
                  setReturnsForm((prev) => ({
                    ...prev,
                    annual: { ...prev.annual, [year]: event.target.value },
                  }))
                }
              />
            ))}
          </div>
        </div>
        <MFFormActions
          onReset={() =>
            setForm({
              name: "",
              is_active: 1,
            })
          }
          isSubmitting={saving}
          submitLabel={id ? "Update" : "Save"}
        />
      </form>
    </MFFormContainer>
  );
}
