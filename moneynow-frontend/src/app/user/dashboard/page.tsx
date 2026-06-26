import DashboardAnnouncementBanner from "@/components/Dashboard/DashboardAnnouncementBanner";
import DashboardInsightsGrid from "@/components/Dashboard/DashboardInsightsGrid";
import DashboardPremiumUpgradeSection from "@/components/Dashboard/DashboardPremiumUpgradeSection";
import DashboardQuickActions from "@/components/Dashboard/DashboardQuickActions";
import DashboardWelcomeSection from "@/components/Dashboard/DashboardWelcomeSection";

export default function Page() {
  return (
    <>
      <DashboardAnnouncementBanner />
      <DashboardWelcomeSection />
      <DashboardInsightsGrid />
      <DashboardPremiumUpgradeSection />
      <DashboardQuickActions />
    </>
  );
}
