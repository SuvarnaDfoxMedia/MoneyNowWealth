"use client";

import { useSubscription } from "@/hooks/useSubscription";
import { ArrowRight, CheckCircle2, Check } from "lucide-react";
import DashboardPlanUsageCard from "./DashboardPlanUsageCard";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { API } from "@/app/api/axios";
import { useRouter } from "next/navigation";


export default function DashboardPremiumUpgradeSection() {
  const {
    latestSubscription,
    currentSubscription,
    loading: subscriptionLoading,
    refresh,
  } = useSubscription();

  const loading = subscriptionLoading;
  const subscriptionCard = currentSubscription || latestSubscription;
  const isSubscriptionActive = currentSubscription?.isActive === true;
  const isPremiumActive = currentSubscription?.isPremium === true && isSubscriptionActive;

  const isExpiredPremium = 
    !isPremiumActive && 
    (currentSubscription?.promotionalTrialUsed === true || 
     currentSubscription?.canGetPremiumTrial === false);

  const renderActiveSummary = () => (
    <div className="w-full bg-white rounded-lg p-6 shadow flex flex-col items-center text-center h-full justify-center">
      <div className="mb-4 w-24 h-24 relative">
        <Image
          src="/images/subscribe-right-icon.png"
          alt="Premium Plan"
          fill
          className="object-contain"
          priority
        />
      </div>

      <h3 className="font-semibold text-lg mb-4">
        {subscriptionCard?.planName?.toUpperCase() || "PREMIUM"} PLAN
      </h3>

      <div className="flex flex-col text-left text-sm w-full max-w-xs">
        <p className="mb-2 flex justify-between">
          <span className="font-semibold">Amount:</span>{" "}
          <span className="font-normal">
            {"\u20B9"}{Number(subscriptionCard?.amount || 0).toFixed(2)}
          </span>
        </p>

        <p className="mb-2 flex justify-between">
          <span className="font-semibold">Purchase Date:</span>{" "}
          <span className="font-normal">
            {subscriptionCard?.paymentDate ? new Date(subscriptionCard.paymentDate).toLocaleDateString("en-GB") : "-"}
          </span>
        </p>

        <p className="mb-2 flex justify-between">
          <span className="font-semibold">Expiry Date:</span>{" "}
          <span className="font-normal">
            {subscriptionCard?.endDate ? new Date(subscriptionCard.endDate).toLocaleDateString("en-GB") : "-"}
          </span>
        </p>

        <p className="mb-5 flex justify-between">
          <span className="font-semibold">Days Left:</span>{" "}
          <span className="font-normal">
            {currentSubscription?.daysRemaining || 0}
          </span>
        </p>
      </div>

      <button
        className={`mt-2 py-2 rounded-lg font-semibold w-24 text-sm tracking-wide ${
          isSubscriptionActive
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-400 text-white"
        }`}
      >
        {isSubscriptionActive ? "ACTIVE" : "EXPIRED"}
      </button>
    </div>
  );

  const [loadingAction, setLoadingAction] = useState(false);
  const router = useRouter();

  const handleTrialUpgrade = async () => {
    try {
      setLoadingAction(true);
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
      refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to activate premium trial",
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePurchaseRedirect = () => {
    router.push("/user/dashboard/subscription");
  };

  const isPurchaseState = currentSubscription?.promotionalTrialUsed || currentSubscription?.canGetPremiumTrial === false;

  const renderBlueBanner = () => (
    <div className="relative overflow-hidden rounded-xl bg-[#0A4A87] p-7 text-white h-full">
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,#ffffff30_1px,transparent_1px),linear-gradient(to_bottom,#ffffff30_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="relative">
        <span className="inline-flex rounded-full bg-[#0F5CA9] px-4 py-1 text-[12px] font-semibold">
          MoneyNow EDGE
        </span>

        <h3 className="mt-5 text-[26px] font-semibold leading-[1.2]">
          Unlock premium features with MoneyNow EDGE
        </h3>

        <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#DCE9FF]">
          Make sharper investment decisions with curated research,
          advanced calculators, and analyst-led newsletters.
        </p>

        {/* Feature Points */}
        <ul className="mt-6 grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-8">
          {[
            "Premium Research",
            "Advanced Calculators",
            "Premium Newsletter",
            "Premium Blogs",
          ].map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-[15px] text-white"
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#29bb77] bg-[#0E9F61] shadow-[0_0_0_2px_rgba(54,212,138,0.15)]">
                <Check className="h-[10px] w-[10px] stroke-[3] text-white" />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <button 
          onClick={isPurchaseState ? handlePurchaseRedirect : handleTrialUpgrade}
          disabled={loadingAction}
          className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-[14px] font-semibold text-[#0A4A87] transition-all duration-300 hover:bg-[#EDF4FF] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loadingAction 
            ? "Processing..." 
            : isExpiredPremium 
              ? "Renew MoneyNow EDGE" 
              : "Upgrade to MoneyNow EDGE"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  let leftContent = null;

  if (loading) {
    leftContent = <div className="animate-pulse bg-gray-200 rounded-xl h-full w-full min-h-[300px]"></div>;
  } else if (subscriptionCard && isPremiumActive) {
    leftContent = renderActiveSummary();
  } else {
    leftContent = renderBlueBanner();
  }

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
      {leftContent}
      <DashboardPlanUsageCard />
    </section>
  );
}
