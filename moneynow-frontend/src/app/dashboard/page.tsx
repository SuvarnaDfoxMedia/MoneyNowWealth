import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardAnnouncementBanner from "@/components/Dashboard/DashboardAnnouncementBanner";
import DashboardInsightsGrid from "@/components/Dashboard/DashboardInsightsGrid";
import DashboardPremiumUpgradeSection from "@/components/Dashboard/DashboardPremiumUpgradeSection";
import DashboardQuickActions from "@/components/Dashboard/DashboardQuickActions";
import DashboardWelcomeSection from "@/components/Dashboard/DashboardWelcomeSection";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardAnnouncementBanner />
      <DashboardWelcomeSection />
      <DashboardInsightsGrid />
      <DashboardPremiumUpgradeSection />
      <DashboardQuickActions />
    </DashboardLayout>
  );
}
