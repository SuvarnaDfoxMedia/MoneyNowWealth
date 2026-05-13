import { ReactNode } from "react";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export default function DashboardCard({ children, className = "", hover = false }: DashboardCardProps) {
  return (
    <div
      className={`rounded-3xl border border-[#E7ECF5] bg-white shadow-[0_2px_8px_rgba(15,34,74,0.04)] ${
        hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
