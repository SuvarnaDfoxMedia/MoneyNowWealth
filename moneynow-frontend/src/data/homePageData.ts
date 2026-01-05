
export const chooseJourneyTitle = "Choose Your Journey";
export const chooseJourneySubtitle =
  "Whether you’re just starting out or fine-tuning your mutual fund investments, choose the path that fits your life. We guide every step.";

export const chooseJourneyCards = [
  {
    imageSrc: "/images/choose-card-1.png",
    title: "I Want to Do Goal Planning",
    description:
      "Plan for your dream home, education, or retirement — we'll guide you step-by-step.",
    linkText: "EXPLORE NOW",
    linkHref: "#",
  },
  {
    imageSrc: "/images/choose-card-2.png",
    title: "I Want to Start a SIP",
    description:
      "Starting small is powerful. Discover SIP plans that fit your budget and dreams.",
    linkText: "Start NOW",
    linkHref: "#",
  },
  {
    imageSrc: "/images/choose-card-3.png",
    title: "Your ₹1 Crore Journey",
    description:
      "See handpicked model portfolios tailored for real-life goals and investor profiles.",
    linkText: "EXPLORE NOW",
    linkHref: "#",
  },
  {
    imageSrc: "/images/choose-card-4.png",
    title: "I Have Surplus to Invest",
    description: "Have a lump sum or bonus? Let us help you allocate it smartly.",
    linkText: "See Options",
    linkHref: "#",
  },
  {
    imageSrc: "/images/choose-card-5.png",
    title: "I Want to Understand My Risk Profile",
    description:
      "Help me discover what type of investor I am and what suits me best.",
    linkText: "Take Risk Quiz",
    linkHref: "#",
  },
  {
    imageSrc: "/images/choose-card-6.png",
    title: "I Want Guidance",
    description:
      "Unsure where to start? Let us help you with a guided plan based on your needs.",
    linkText: "Get Help",
    linkHref: "#",
  },
];

// =============================
// Home Portfolio Section
// =============================
export const homePortfolioTitle =
  "Explore Our Curated Model Portfolios";
export const homePortfolioSubtitle =
  "Mullam varius turpis et commodo pharetra est eros bibendum eli nec luctus magnafelis";

export const homePortfolioCards = [
  { imageSrc: "/images/portfolio-1.png", title: "Balanced Family Plan" },
  { imageSrc: "/images/portfolio-2.png", title: "Growth Starter Plan" },
  { imageSrc: "/images/portfolio-3.png", title: "Stable Returns Plan" },
  { imageSrc: "/images/portfolio-4.png", title: "Retirement Ready Plan" },
  { imageSrc: "/images/portfolio-5.png", title: "Tax Saver Plan" },
  { imageSrc: "/images/portfolio-6.png", title: "Starter SIP Plan" },
];

// =============================
// Why MoneyNow Section  (NEW)
// =============================
export const whyMoneyNowTitle = "Why MoneyNow Works";
export const whyMoneyNowSubtitle =
  "Mullam varius turpis et commodo pharetra est eros bibendum el nec luctus magnafelis";

export const whyMoneyNowCards = [
  {
    iconSrc: "/images/why-money-now-icon-1.png",
    title: "Advisors Behind the tech",
  },
  {
    iconSrc: "/images/why-money-now-icon-2.png",
    title: "14 Investor Profiles",
  },
  {
    iconSrc: "/images/why-money-now-icon-3.png",
    title: "Curated Portfolios, Not Clutter",
  },
];

// =============================
// Home Invest Track Section (Dynamic)
// =============================
export const homeInvestTrackData = {
  phoneImage: "/images/mobile-app.png", 
  titleLine1: "Invest. Track. Manage.",
  titleLine2: "From KYC to SIPs.",
  titleLine3: "All from the MoneyNow App.",
  appStoreImg: "/images/apple_icon.png",
  playStoreImg: "/images/play_icon.png",
};


// /src/data/homeCalculatorsData.ts

export const homeCalculatorsData = {
  title: "See What's Possible with Your Money",
  subtitle:
    "Mullam varius turpis et commodo pharetra est eros bibendum elit nec luctus magnafelis",

  tabs: [
    "SIP Growth",
    "Step-Up SIP",
    "Lumpsum",
    "Goal Planner",
    "Retirement Planner",
  ],

  investmentTypes: [
    { id: "investmentAmount", label: "I know investment amount", checked: true },
    { id: "goalAmount", label: "I know my goal amount" },
  ],

  sliders: [
    {
      label: "Monthly Investment",
      min: 0,
      max: 50000,
      value: 10000,
      display: "₹10,000",
    },
    {
      label: "Investment Period",
      min: 1,
      max: 30,
      value: 25,
      display: "25 Years",
    },
    {
      label: "Expected Rate of Return (p.a.)",
      min: 1,
      max: 30,
      value: 12,
      display: "12%",
    },
  ],

  futureValue: "₹85.11 Lacs",

  ctaCard: {
    title: "Top 10% of Investors",
    description: "consistently generate more than 15% return",
    button: "I WANT TO BE IN TOP 10%",
  },

  breakdown: {
    invested: "₹15 Lacs",
    returns: "₹70.11 Lacs",
  },

  footer:
    "Most investors are only ₹5,000/month away from a ₹50 lakh future",
};


export const homeBlogData = {
  title: "From Our Insights Desk",
  subtitle: "Stay informed with curated insights and smart investing stories.",
  cards: [
    {
      imageSrc: "/images/blog-img-1.png",
      category: "Mutual Funds",
      title: "Duis aute irure dolor in velit onerepreh enderit in voluptate more esse",
    },
    {
      imageSrc: "/images/blog-img-2.png",
      category: "Mutual Funds",
      title: "Duis aute irure dolor in velit onerepreh enderit in voluptate more esse",
    },
    {
      imageSrc: "/images/blog-img-3.png",
      category: "Mutual Funds",
      title: "Duis aute irure dolor in velit onerepreh enderit in voluptate more esse",
    },
  ],
};


// =============================
// Stay Connected Section (Dynamic)
// =============================
export const stayConnectedData = {
  title: "Stay Connected with Financial Wisdom",
  subtitle: "Join the MoneyNow Wealth Investor Circle",
  description:
    "Gain early access to market insights, exclusive tools, and strategies designed to help you make smarter financial decisions and grow your wealth.",

  features: [
    {
      imageSrc: "/images/stay-connect-icon-1.png",
      text: "Get guidance on the right investment plans",
    },
    {
      imageSrc: "/images/stay-connect-icon-2.png",
      text: "Plan for a secure future",
    },
    {
      imageSrc: "/images/stay-connect-icon-3.png",
      text: "Wealth insights, directly in your inbox",
    },
    {
      imageSrc: "/images/stay-connect-icon-4.png",
      text: "Premium tools & calculators",
    },
  ],
};
