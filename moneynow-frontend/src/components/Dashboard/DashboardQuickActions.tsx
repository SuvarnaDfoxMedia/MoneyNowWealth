"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import DashboardCard from "./DashboardCard";
import DashboardIcon from "./DashboardIcon";
import { quickActions } from "@/lib/dashboard-data";

export default function DashboardQuickActions() {
  const baseActions = quickActions.filter((action) => action.id !== "widget");
  const widgetAction = quickActions.find((action) => action.id === "widget");
  const [extraWidgets, setExtraWidgets] = useState(0);

  const handleAddWidget = () => {
    setExtraWidgets((prev) => prev + 1);
  };

  const dynamicWidgets = Array.from({ length: extraWidgets }).map((_, idx) => ({
    id: `widget-${idx + 1}`,
    title: `Custom Widget ${idx + 1}`,
    description: "Personalized module for your dashboard",
    icon: "Plus" as const,
    iconBg: "bg-[#FFF1E4]",
    iconColor: "text-[#F58A2D]",
  }));

  const actionsToRender = widgetAction
    ? [...baseActions, widgetAction, ...dynamicWidgets]
    : [...baseActions, ...dynamicWidgets];

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {actionsToRender.map((action) => (
        <DashboardCard key={action.id} hover className="rounded-xl px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <div className={`grid h-11 w-12 place-items-center rounded-md ${action.iconBg}`}>
                <DashboardIcon name={action.icon} className={`h-4 w-5 ${action.iconColor}`} />
              </div>
              <div>
                <h4 className="text-[16px] font-semibold leading-[1.2] text-[#040C20]">{action.title}</h4>
                <p className="mt-2 text-[14px]  text-[#6E7EA5]">{action.description}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label={action.id === "widget" ? "Add widget" : `Open ${action.title}`}
              onClick={action.id === "widget" ? handleAddWidget : undefined}
              className="rounded-lg p-1 transition-colors hover:bg-[#F3F6FC]"
            >
              <ArrowRight className="h-5 w-5 text-[#081433]" />
            </button>
          </div>
        </DashboardCard>
      ))}
    </section>
  );
}
