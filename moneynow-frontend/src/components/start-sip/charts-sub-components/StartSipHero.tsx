"use client";

interface HeroMetric {
  label: string;
  value: string;
}

interface StartSipHeroProps {
  title: string;
  subtitle: string;
  metrics: HeroMetric[];
}

export default function StartSipHero({
  title,
  subtitle,
  metrics,
}: StartSipHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#062E57_0%,#0A4A86_55%,#0F766E_100%)] text-white">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,white,transparent_35%),radial-gradient(circle_at_bottom_right,#f59e0b,transparent_30%)]" />
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200 mb-4">
              MoneyNow Calculator Experience
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight font-poppins">
              {title}
            </h1>
            <p className="mt-6 text-base md:text-lg text-slate-100 max-w-2xl">
              {subtitle}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl border border-white/15 p-6 md:p-8 shadow-2xl">
            <p className="text-cyan-200 text-sm font-semibold mb-4">
              Quick result summary
            </p>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl bg-white/10 border border-white/10 p-4"
                >
                  <p className="text-sm text-slate-200">{metric.label}</p>
                  <p className="mt-2 text-xl font-bold break-words">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
