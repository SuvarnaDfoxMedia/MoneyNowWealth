export type SidebarMenuItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIconName;
  active?: boolean;
};

export type OnboardingCardItem = {
  id: string;
  title: string;
  description: string;
  cta: string;
  icon: LucideIconName;
  iconBg: string;
};

export type InsightCardItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIconName;
  iconBg: string;
  iconColor: string;
};

export type QuickActionItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIconName;
  iconBg: string;
  iconColor: string;
};

export type LucideIconName =
  | "LayoutGrid"
  | "Calculator"
  | "ScrollText"
  | "BriefcaseBusiness"
  | "UserRound"
  | "Wrench"
  | "ListFilter"
  | "GraduationCap"
  | "Compass"
  | "Lightbulb"
  | "Newspaper"
  | "ChartNoAxesColumn"
  | "TrendingUp"
  | "Hammer"
  | "Calendar"
  | "MessageCircle"
  | "CircleHelp"
  | "Plus";

export const sidebarMenuItems: SidebarMenuItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/user/dashboard", icon: "LayoutGrid", active: true },
  { id: "calculators", label: "Calculators", href: "/user/dashboard/calculators/advanced-sip", icon: "Calculator" },
  { id: "newsletter", label: "Newsletter", href: "/user/dashboard/newsletter", icon: "ScrollText" },
  { id: "subscription", label: "Subscription", href: "/user/dashboard/subscription", icon: "BriefcaseBusiness" },
  { id: "toolkit", label: "Wealth Toolkit", href: "/wealth-toolkit", icon: "Wrench" },
  { id: "learn", label: "Learn", href: "/blog-listing", icon: "GraduationCap" },
  { id: "insights", label: "Insights", href: "/blog-listing", icon: "Lightbulb" },
  // { id: "news", label: "News & Blogs", href: "/blog-listing", icon: "Newspaper" },
];

export const onboardingCards: OnboardingCardItem[] = [
  {
    id: "learn",
    title: "Learn about yourself",
    description: "Help us understand your financial goals and preferences.",
    cta: "Start Now",
    icon: "UserRound",
    iconBg: "bg-[#1762BA]",
  },
  {
    id: "explore",
    title: "Explore our tools",
    description: "Use calculators, research reports and more to plan better.",
    cta: "Explore Tools",
    icon: "Wrench",
    iconBg: "bg-[#16B87C]",
  },
  {
    id: "decisions",
    title: "Make confident decisions",
    description: "Get insights and build your investment strategy with confidence.",
    cta: "Learn How",
    icon: "Compass",
    iconBg: "bg-[#1762BA]",
  },
];

export const insightCards: InsightCardItem[] = [
  {
    id: "insights",
    title: "Latest Insights",
    description: "How rate cuts could reshape your fixed income portfolio",
    icon: "Lightbulb",
    iconBg: "bg-[#F0E9FE]",
    iconColor: "text-[#8A58F6]",
  },
  {
    id: "calc",
    title: "Calculators",
    description: "Plan smarter with built-for-fintech calculators",
    icon: "Calculator",
    iconBg: "bg-[#E6F8EE]",
    iconColor: "text-[#16B87C]",
  },
  {
    id: "mf",
    title: "MF Research",
    description: "Curated mutual fund research from top analysts",
    icon: "ChartNoAxesColumn",
    iconBg: "bg-[#E8EEFF]",
    iconColor: "text-[#4E77F3]",
  },
  {
    id: "toolkit",
    title: "Wealth Toolkit",
    description: "Everything you need to track and grow your wealth",
    icon: "Hammer",
    iconBg: "bg-[#FFF1E4]",
    iconColor: "text-[#F58A2D]",
  },
];

export const quickActions: QuickActionItem[] = [
  {
    id: "call",
    title: "Book a Call",
    description: "Talk to a wealth advisor",
    icon: "Calendar",
    iconBg: "bg-[#F0E9FE]",
    iconColor: "text-[#8A58F6]",
  },
  {
    id: "chat",
    title: "Chat with Us",
    description: "Live support, 9am-6pm",
    icon: "MessageCircle",
    iconBg: "bg-[#E6F8EE]",
    iconColor: "text-[#16B87C]",
  },
  {
    id: "help",
    title: "Visit Help Center",
    description: "Guides, FAQs, articles",
    icon: "CircleHelp",
    iconBg: "bg-[#E8EEFF]",
    iconColor: "text-[#3C67EB]",
  },
  {
    id: "widget",
    title: "Add new widget",
    description: "Customize your dashboard",
    icon: "Plus",
    iconBg: "bg-[#FFF1E4]",
    iconColor: "text-[#F58A2D]",
  },
];
