"use client";

import { useParams } from "next/navigation";
import { useFetchCMS } from "@/hooks/useFetchCMS";

import FAQPage from "@/components/cms/FAQPage";
import PrivacyPolicyPage from "@/components/cms/PrivacyPolicyPage";
import TermsPage from "@/components/cms/TermsPage";
import DefaultPage from "@/components/cms/DefaultPage";
import GeneralDisclaimerPage from "@/components/cms/GeneralDisclaimerPage";
import AboutUsPage from "@/components/cms/AboutUsPage";
import PartnerWithUs from "@/components/cms/PartnerWithUs";

export default function CMSPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { page, loading, error } = useFetchCMS(slug);

  // 1. Static check
  if (slug === "about-us") return <AboutUsPage />;
  if (slug === "partner-with-us") return <PartnerWithUs />;

  // 2. Loading state
  if (loading) return <p className="text-center py-10">Loading...</p>;

  // 3. THE REDIRECT LOGIC
  // If there's an error OR no page was found, show the DefaultPage
  if (error || !page) {
    return <DefaultPage />;
  }

  // 4. If we have a page, show the specific component
  switch (slug) {
    case "faq":
      return <FAQPage data={page} />;
    case "privacy-policy":
      return <PrivacyPolicyPage data={page} />;
    case "terms":
    case "terms-of-use":
      return <TermsPage data={page} />;
    case "general-disclaimer":
    case "disclaimer":
      return <GeneralDisclaimerPage data={page} />;
    default:
      return <DefaultPage />;
  }
}
