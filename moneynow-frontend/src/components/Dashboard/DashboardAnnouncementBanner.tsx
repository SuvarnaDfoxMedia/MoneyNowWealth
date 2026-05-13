export default function DashboardAnnouncementBanner() {
  return (
    <section className="rounded-2xl border border-[#D9E2F2] bg-[#F7FAFF] px-6 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-[#0B1D46]">Unlock advanced insights & premium tools</h2>
          <p className="mt-1 text-[14px] text-[#617199]">Try MoneyNow EDGE free for 1 year and take smarter investment decisions.</p>
        </div>
        <button className="h-10 rounded-xl bg-[#0A4A87] px-6 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#083B6C]">
          Upgrade For Free
        </button>
      </div>
    </section>
  );
}
