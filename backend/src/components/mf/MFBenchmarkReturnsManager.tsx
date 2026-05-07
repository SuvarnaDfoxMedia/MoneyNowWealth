import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosApi } from "../../api/axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

type BenchmarkOption = { _id: string; name: string; category?: string };
type ReturnRow = {
  _id: string;
  date: string;
  return_1d?: number | null;
  return_1w?: number | null;
  return_1m?: number | null;
  return_3m?: number | null;
  return_6m?: number | null;
  return_ytd?: number | null;
  return_1y?: number | null;
  return_3y?: number | null;
  return_5y?: number | null;
  return_10y?: number | null;
  annual?: Record<string, number | null>;
  return_since_inception?: number | null;
};

const ANNUAL_YEARS = [
  "2025",
  "2024",
  "2023",
  "2022",
  "2021",
  "2020",
  "2019",
  "2018",
  "2017",
] as const;

export default function MFBenchmarkReturnsManager() {
  const { role = "admin" } = useParams();
  const [benchmarks, setBenchmarks] = useState<BenchmarkOption[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    return_1d: "",
    return_1w: "",
    return_1m: "",
    return_3m: "",
    return_6m: "",
    return_ytd: "",
    return_1y: "",
    return_3y: "",
    return_5y: "",
    return_10y: "",
    return_since_inception: "",
    annual: Object.fromEntries(
      ANNUAL_YEARS.map((year) => [year, ""]),
    ) as Record<string, string>,
  });
  const selectedDate = form.date ? new Date(form.date) : null;

  useEffect(() => {
    (async () => {
      const response: any = await axiosApi.get(`/${role}/mf/benchmarks`, {
        page: 1,
        limit: 5000,
        sortBy: "name",
        sortOrder: "asc",
      });
      const items = Array.isArray(response?.data) ? response.data : [];
      setBenchmarks(items);
      if (items.length > 0) setSelectedBenchmark(items[0]._id);
    })();
  }, [role]);

  useEffect(() => {
    if (!selectedBenchmark) return;
    (async () => {
      const response: any = await axiosApi.get(
        `/${role}/mf/benchmark-returns/${selectedBenchmark}`,
      );
      setRows(Array.isArray(response?.data) ? response.data : []);
    })();
  }, [role, selectedBenchmark, saving]);

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBenchmark) return toast.error("Select a benchmark");
    if (!form.date) return toast.error("Date is required");
    setSaving(true);
    try {
      await axiosApi.create(`/${role}/mf/benchmark-returns/create`, {
        benchmark_id: selectedBenchmark,
        date: form.date,
        return_1y: form.return_1y === "" ? null : Number(form.return_1y),
        return_3y: form.return_3y === "" ? null : Number(form.return_3y),
        return_5y: form.return_5y === "" ? null : Number(form.return_5y),
        return_1d: form.return_1d === "" ? null : Number(form.return_1d),
        return_1w: form.return_1w === "" ? null : Number(form.return_1w),
        return_1m: form.return_1m === "" ? null : Number(form.return_1m),
        return_3m: form.return_3m === "" ? null : Number(form.return_3m),
        return_6m: form.return_6m === "" ? null : Number(form.return_6m),
        return_ytd: form.return_ytd === "" ? null : Number(form.return_ytd),
        return_10y: form.return_10y === "" ? null : Number(form.return_10y),
        return_since_inception:
          form.return_since_inception === ""
            ? null
            : Number(form.return_since_inception),
        annual: Object.fromEntries(
          ANNUAL_YEARS.map((year) => [
            year,
            form.annual[year] === "" ? null : Number(form.annual[year]),
          ]),
        ),
      });
      setForm({
        date: "",
        return_1d: "",
        return_1w: "",
        return_1m: "",
        return_3m: "",
        return_6m: "",
        return_ytd: "",
        return_1y: "",
        return_3y: "",
        return_5y: "",
        return_10y: "",
        return_since_inception: "",
        annual: Object.fromEntries(
          ANNUAL_YEARS.map((year) => [year, ""]),
        ) as Record<string, string>,
      });
      toast.success("Benchmark return saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to save benchmark return",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-5 rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-800">
          Benchmark Returns
        </h1>
      </div>

      <form
        onSubmit={onSave}
        className="mb-6 rounded-lg bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <select
            className="h-11 rounded-md border border-gray-300 px-3"
            value={selectedBenchmark}
            onChange={(event) => setSelectedBenchmark(event.target.value)}
          >
            {benchmarks.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={(date) =>
                setForm((prev) => ({
                  ...prev,
                  date: date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
                    : "",
                }))
              }
              dateFormat="dd/MM/yyyy"
              className="h-11 w-full rounded-md border border-gray-300 px-3 pr-10"
              placeholderText="dd/mm/yyyy"
            />
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
          <input
            placeholder="1D"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_1d}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_1d: event.target.value }))
            }
          />
          <input
            placeholder="1W"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_1w}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_1w: event.target.value }))
            }
          />
          <input
            placeholder="1M"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_1m}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_1m: event.target.value }))
            }
          />
          <input
            placeholder="3M"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_3m}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_3m: event.target.value }))
            }
          />
          <input
            placeholder="6M"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_6m}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_6m: event.target.value }))
            }
          />
          <input
            placeholder="YTD"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_ytd}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_ytd: event.target.value }))
            }
          />
          <input
            placeholder="1Y"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_1y}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_1y: event.target.value }))
            }
          />
          <input
            placeholder="3Y"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_3y}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_3y: event.target.value }))
            }
          />
          <input
            placeholder="5Y"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_5y}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_5y: event.target.value }))
            }
          />
          <input
            placeholder="10Y"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_10y}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, return_10y: event.target.value }))
            }
          />
          <input
            placeholder="Since inception"
            className="h-11 rounded-md border border-gray-300 px-3"
            value={form.return_since_inception}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                return_since_inception: event.target.value,
              }))
            }
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {ANNUAL_YEARS.map((year) => (
            <input
              key={year}
              placeholder={`Annual ${year}`}
              className="h-11 rounded-md border border-gray-300 px-3"
              value={form.annual[year]}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  annual: { ...prev.annual, [year]: event.target.value },
                }))
              }
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-md bg-[#043f79] px-4 py-2 text-white"
        >
          {saving ? "Saving..." : "Save Return"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="min-w-full">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-sm">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">1D</th>
              <th className="px-4 py-3">1W</th>
              <th className="px-4 py-3">1M</th>
              <th className="px-4 py-3">3M</th>
              <th className="px-4 py-3">6M</th>
              <th className="px-4 py-3">YTD</th>
              <th className="px-4 py-3">1Y</th>
              <th className="px-4 py-3">3Y</th>
              <th className="px-4 py-3">5Y</th>
              <th className="px-4 py-3">10Y</th>
              <th className="px-4 py-3">Since Inception</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-b text-sm">
                <td className="px-4 py-3">
                  {new Date(row.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3">{row.return_1d ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1w ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_3m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_6m ?? "-"}</td>
                <td className="px-4 py-3">{row.return_ytd ?? "-"}</td>
                <td className="px-4 py-3">{row.return_1y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_3y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_5y ?? "-"}</td>
                <td className="px-4 py-3">{row.return_10y ?? "-"}</td>
                <td className="px-4 py-3">
                  {row.return_since_inception ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
