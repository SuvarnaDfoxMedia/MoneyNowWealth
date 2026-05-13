import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F3F5FA] font-poppins">
      <DashboardSidebar />
      <main className="w-full xl:ml-[250px] xl:w-[calc(100%-250px)]">
        <DashboardTopbar />
        <div className="mx-auto max-w-[1440px] p-[22px_16px] md:p-[22px_26px]">
          {children}
        </div>
      </main>
    </div>
  );
}
