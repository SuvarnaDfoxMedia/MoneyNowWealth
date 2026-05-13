import {
  Calculator,
  BriefcaseBusiness,
  Calendar,
  ChartNoAxesColumn,
  CircleHelp,
  Compass,
  GraduationCap,
  Hammer,
  LayoutGrid,
  ListFilter,
  Lightbulb,
  MessageCircle,
  Newspaper,
  Plus,
  ScrollText,
  TrendingUp,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { LucideIconName } from "@/lib/dashboard-data";

const ICON_MAP: Record<LucideIconName, LucideIcon> = {
  LayoutGrid,
  Calculator,
  ScrollText,
  BriefcaseBusiness,
  UserRound,
  Wrench,
  ListFilter,
  GraduationCap,
  Compass,
  Lightbulb,
  Newspaper,
  ChartNoAxesColumn,
  TrendingUp,
  Hammer,
  Calendar,
  MessageCircle,
  CircleHelp,
  Plus,
};

export default function DashboardIcon({ name, className }: { name: LucideIconName; className?: string }) {
  const Icon = ICON_MAP[name];
  return <Icon className={className} />;
}
