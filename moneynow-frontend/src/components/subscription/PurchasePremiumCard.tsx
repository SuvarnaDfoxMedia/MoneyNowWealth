"use client";

import { useRouter } from "next/navigation";

interface PurchasePremiumCardProps {
  variant?: "default" | "compact";
}

export default function PurchasePremiumCard({
  variant = "default",
}: PurchasePremiumCardProps) {
  const router = useRouter();
  
  const isCompact = variant === "compact";

  const handlePurchase = () => {
    // Navigate to the plans page
    router.push("/user/dashboard/subscription");
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#D8E6F5] bg-[linear-gradient(135deg,#043F79_0%,#0A5AA8_55%,#EAF3FF_100%)] text-white shadow-sm ${
        isCompact ? "p-5" : "p-6"
      } h-full`}
    >
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BFD8F3]">
          Premium Access
        </p>
        <h3
          className={`mt-3 font-semibold ${isCompact ? "text-xl" : "text-2xl"}`}
        >
          Unlock deeper insights with a free Premium trial
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#E6F0FA]">
          Get premium blogs, advanced market insights, and exclusive
          research-led features. Activate your complimentary 7-day Premium
          access instantly.
        </p>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white/12 p-3 backdrop-blur-sm">
            Premium blogs
          </div>
          <div className="rounded-xl bg-white/12 p-3 backdrop-blur-sm">
            Advanced insights
          </div>
          <div className="rounded-xl bg-white/12 p-3 backdrop-blur-sm">
            Exclusive features
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handlePurchase}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#043F79] transition hover:bg-[#F3F8FF]"
          >
            Upgrade to Premium
          </button>
          <p className="text-xs text-[#D6E7F8]">
            No credit card is required.
          </p>
        </div>
      </div>
    </div>
  );
}
