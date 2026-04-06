"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { API } from "@/app/api/axios";

interface PremiumUpgradeCardProps {
  onUpgraded?: () => void;
  variant?: "default" | "compact";
}

export default function PremiumUpgradeCard({
  onUpgraded,
  variant = "default",
}: PremiumUpgradeCardProps) {
  const [loading, setLoading] = useState(false);

  const isCompact = variant === "compact";

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const { data } = await API.post(
        "/api/subscriptions/upgrade-premium-trial",
        {},
        { withCredentials: true },
      );

      const subscription = data?.subscription || data?.data?.subscription;
      const endDate = subscription?.end_date
        ? new Date(subscription.end_date).toLocaleDateString("en-GB")
        : null;

      toast.success(
        endDate
          ? `Premium activated until ${endDate}`
          : "Premium trial activated successfully",
      );
      onUpgraded?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to activate premium trial",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[#D8E6F5] bg-[linear-gradient(135deg,#043F79_0%,#0A5AA8_55%,#EAF3FF_100%)] text-white shadow-sm ${
        isCompact ? "p-5" : "p-6"
      }`}
    >
      <div className="max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#BFD8F3]">
          Premium Access
        </p>
        <h3 className={`mt-3 font-semibold ${isCompact ? "text-xl" : "text-2xl"}`}>
          Unlock deeper insights with a free Premium trial
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#E6F0FA]">
          Get premium blogs, advanced market insights, and exclusive research-led
          features. Activate your complimentary 7-day Premium access instantly.
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
            onClick={handleUpgrade}
            disabled={loading}
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#043F79] transition hover:bg-[#F3F8FF] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Activating..." : "Upgrade to Premium"}
          </button>
          <p className="text-xs text-[#D6E7F8]">
            No card required for testing.
            {/* PRODUCTION OPTIONS: 1 month / 1 year */}
          </p>
        </div>
      </div>
    </div>
  );
}
