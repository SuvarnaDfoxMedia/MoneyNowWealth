"use client";

import JourneyBanner from "@/components/journeys/JourneyBanner";

interface AssessmentMetric {
  label: string;
  value: string;
}

interface AssessmentBannerProps {
  title: string;
  subtitle: string;
  metrics: AssessmentMetric[];
}

export default function AssessmentBanner(props: AssessmentBannerProps) {
  return <JourneyBanner {...props} imageAlt="Financial wellness banner" />;
}
