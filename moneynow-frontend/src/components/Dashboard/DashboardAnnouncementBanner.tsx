"use client";

import { useSubscription } from "@/hooks/useSubscription";

export default function DashboardAnnouncementBanner() {
  const { currentSubscription, latestSubscription } = useSubscription();
  const isPremiumActive = currentSubscription?.isPremium === true && currentSubscription?.isActive === true;
  
  const isExpiredPremium = 
    !isPremiumActive && 
    latestSubscription?.planName?.toLowerCase().includes("premium") === true;

  if (isPremiumActive) {
    return null;
  }

  const title = isExpiredPremium 
    ? "Your MoneyNow EDGE plan has expired" 
    : "Unlock advanced insights & premium tools";
    
  const subtitle = isExpiredPremium
    ? "Renew now to regain access to advanced calculators, insights and newsletters."
    : "Try MoneyNow EDGE free for 1 year and take smarter investment decisions.";
    
  const buttonText = isExpiredPremium ? "Renew For EDGE" : "Upgrade For Free";

  return (
    <section className="rounded-xl border border-[#D9E2F2] bg-[#F7FAFF] px-6 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-[#0B1D46]">{title}</h2>
          <p className="mt-1 text-[14px] text-[#617199]">{subtitle}</p>
        </div>
        <button className="h-10 rounded-md bg-[#0A4A87] px-6 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#083B6C]">
          {buttonText}
        </button>
      </div>
    </section>
  );
}
