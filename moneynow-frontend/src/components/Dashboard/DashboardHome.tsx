"use client";

import Image from "next/image";
import LatestRecommendationBlogs from "./LatestRecommendationBlogs";
import LatestNewsletter from "./LatestNewsletter";
import { useSubscription } from "@/hooks/useSubscription";
import { useFetchProfile } from "@/hooks/useProfile";

const DashboardHome = () => {
  const {
    latestSubscription,
    currentSubscription,
    loading: subscriptionLoading,
  } = useSubscription();
  const { profile, loading: profileLoading } = useFetchProfile();

  const loading = subscriptionLoading || profileLoading;
  const subscriptionCard = currentSubscription || latestSubscription;

  const getDisplayName = () => {
    if (!profile) return "User";

    if (profile.firstname || profile.lastname) {
      return `${profile.firstname || ""} ${profile.lastname || ""}`.trim();
    }

    if (profile.email) {
      return profile.email.split("@")[0];
    }

    return "User";
  };

  return (
    <div className="bg-gray-50 min-h-screen pr-6">
      <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <span className="relative w-6 h-6">
          <Image
            src="/images/dashboard-before-icon.png"
            alt="Dashboard Icon"
            fill
            className="object-contain"
            priority
          />
        </span>
        {profileLoading ? "Loading..." : `Welcome, ${getDisplayName()}`}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-start w-full">
        <div className="lg:col-span-8">
          <LatestRecommendationBlogs
            title="Latest Recommendation Blogs"
            subtitle="Curated ideas from our latest research and insights."
          />
        </div>

        {!loading && subscriptionCard && (
          <div className="lg:col-span-4">
            <div className="w-full bg-white rounded-lg p-6 shadow flex flex-col items-center text-center sticky top-4">
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
                {subscriptionCard.planName.toUpperCase()} PLAN
              </h3>

              <div className="flex flex-col text-left text-sm w-full">
                <p className="mb-2">
                  <span className="font-semibold">Amount:</span>{" "}
                  <span className="font-normal">
                    {"\u20B9"}{Number(subscriptionCard.amount || 0).toFixed(2)}
                  </span>
                </p>

                <p className="mb-2">
                  <span className="font-semibold">Purchase Date:</span>{" "}
                  <span className="font-normal">
                    {new Date(subscriptionCard.paymentDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </span>
                </p>

                <p className="mb-5">
                  <span className="font-semibold">Expiry Date:</span>{" "}
                  <span className="font-normal">
                    {new Date(subscriptionCard.endDate).toLocaleDateString(
                      "en-GB",
                    )}
                  </span>
                </p>
              </div>

              <button
                className={`mt-5 py-2 rounded-lg font-semibold w-20 text-sm tracking-wide ${
                  new Date(subscriptionCard.endDate) > new Date()
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-400 text-white"
                }`}
              >
                {new Date(subscriptionCard.endDate) > new Date()
                  ? "ACTIVE"
                  : "EXPIRED"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <LatestNewsletter />

        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow">
          <div className="text-center mb-5">
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              All-in-One Money App
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Manage investments, track growth, and make smart financial
              moves all from your phone.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-blue-600 font-bold text-lg mb-1">Invest</div>
              <div className="text-xs text-gray-600">SIPs & Stocks</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-green-600 font-bold text-lg mb-1">Track</div>
              <div className="text-xs text-gray-600">Portfolio Growth</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-purple-600 font-bold text-lg mb-1">
                Manage
              </div>
              <div className="text-xs text-gray-600">KYC & Accounts</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <div className="text-orange-600 font-bold text-lg mb-1">
                Learn
              </div>
              <div className="text-xs text-gray-600">Financial Insights</div>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-3 text-center">
              Available on both platforms
            </p>
            <div className="flex gap-3">
              <a href="#" className="flex-1">
                <Image
                  src="/images/dash-google-img.png"
                  alt="Google Play"
                  width={135}
                  height={40}
                  className="w-full h-auto"
                />
              </a>
              <a href="#" className="flex-1">
                <Image
                  src="/images/dash-apple-img.png"
                  alt="App Store"
                  width={135}
                  height={40}
                  className="w-full h-auto"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
