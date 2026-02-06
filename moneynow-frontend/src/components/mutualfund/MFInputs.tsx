"use client";

export default function MFInputs({
  scheme,
  setScheme,
}: {
  scheme: string;
  setScheme: (v: string) => void;
}) {
  return (
    <div className="bg-[#E6F2FE] p-6 rounded-lg">
      <label className="text-sm font-medium block mb-2">
        Mutual Fund Scheme
      </label>
      <input
        value={scheme}
        onChange={(e) => setScheme(e.target.value)}
        className="w-full border rounded p-2"
        placeholder="HDFC Balanced Advantage Fund - Growth Plan - Direct Plan"
      />
    </div>
  );
}
