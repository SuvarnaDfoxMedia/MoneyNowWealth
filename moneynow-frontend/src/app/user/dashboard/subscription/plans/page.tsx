"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/app/api/axios";
import { toast } from "react-hot-toast";
import { Check, Loader2 } from "lucide-react";

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/subscription-plan");
      setPlans(data?.data?.plans || data?.data || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load subscription plans.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (planId: string) => {
    try {
      setPurchasingPlanId(planId);
      // Stubbing Razporpay: We pass a mock payment reference
      const { data } = await API.post(
        "/api/subscription-payment/purchase",
        {
          plan_id: planId,
          payment_reference: `mock_payment_${Date.now()}`,
          payment_method: "manual"
        },
        { withCredentials: true }
      );

      toast.success("Successfully upgraded to Premium!");
      router.push("/user/dashboard/subscription");
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to complete purchase."
      );
    } finally {
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0A4A87]" />
      </div>
    );
  }

  // Ensure we find at least one free and one premium plan (assuming basic structure)
  const freePlan = plans.find((p) => p.price === 0 || p.name?.toLowerCase().includes("free"));
  const premiumPlans = plans.filter((p) => p.price > 0 || p.name?.toLowerCase().includes("premium") || p.name?.toLowerCase().includes("edge"));

  return (
    <div className="mx-auto max-w-5xl py-10 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose the right plan for you
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Upgrade to MoneyNow EDGE and get access to exclusive analyst-led insights, premium research, and advanced tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan Card */}
        {freePlan && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm flex flex-col h-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{freePlan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹0</span>
              <span className="text-gray-500"> / forever</span>
            </div>
            
            <p className="text-gray-600 mb-6 flex-grow">{freePlan.description || "Basic access to free articles and tools."}</p>
            
            <ul className="space-y-4 mb-8">
              {["Basic Market News", "Standard Calculators", "Limited Articles"].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              disabled
              className="w-full rounded-xl bg-gray-100 py-3 px-4 font-semibold text-gray-500 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>
        )}

        {/* Premium Plan Card */}
        {premiumPlans.map((premiumPlan) => (
          <div key={premiumPlan._id} className="relative rounded-2xl border-2 border-[#0A4A87] bg-white p-8 shadow-xl flex flex-col h-full transform transition-transform hover:-translate-y-1">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#0A4A87] px-4 py-1 text-sm font-semibold text-white">
              Most Popular
            </div>

            <h3 className="text-xl font-semibold text-[#0A4A87] mb-2">{premiumPlan.name}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹{premiumPlan.price}</span>
              <span className="text-gray-500"> / {premiumPlan.duration?.unit || "month"}</span>
            </div>
            
            <p className="text-gray-600 mb-6 flex-grow">{premiumPlan.description || "Make sharper investment decisions with curated research."}</p>
            
            <ul className="space-y-4 mb-8">
              {(premiumPlan.features && premiumPlan.features.length > 0 ? premiumPlan.features : [
                "Premium Research Reports",
                "Advanced Investment Calculators",
                "Analyst-led Premium Newsletters",
                "Exclusive Premium Blogs"
              ]).map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0E9F61] text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-gray-900 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handlePurchase(premiumPlan._id)}
              disabled={purchasingPlanId === premiumPlan._id}
              className="w-full flex items-center justify-center rounded-xl bg-[#0A4A87] py-3 px-4 font-semibold text-white transition hover:bg-[#083966] disabled:opacity-70"
            >
              {purchasingPlanId === premiumPlan._id ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upgrade Now"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
