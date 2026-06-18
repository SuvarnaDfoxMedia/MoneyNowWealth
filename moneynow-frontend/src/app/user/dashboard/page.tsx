import DashboardAnnouncementBanner from "@/components/Dashboard/DashboardAnnouncementBanner";
import DashboardInsightsGrid from "@/components/Dashboard/DashboardInsightsGrid";
import DashboardPremiumUpgradeSection from "@/components/Dashboard/DashboardPremiumUpgradeSection";
import DashboardQuickActions from "@/components/Dashboard/DashboardQuickActions";
import DashboardWelcomeSection from "@/components/Dashboard/DashboardWelcomeSection";
import RecommendedForYou from "@/components/Dashboard/RecommendedForYou";
import TopPerformingCategories from "@/components/Dashboard/TopPerformingCategories";
import NewsletterBanner from "@/components/Dashboard/NewsletterBanner";

export default function Page() {
  return (
    <>
      <DashboardAnnouncementBanner />
      <DashboardWelcomeSection />
      <NewsletterBanner />
      <RecommendedForYou />
      <TopPerformingCategories />
      <DashboardInsightsGrid />
      <DashboardPremiumUpgradeSection />
      <DashboardQuickActions />
    </>
  );
}
