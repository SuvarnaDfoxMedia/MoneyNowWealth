// "use client";

// import { useParams } from "next/navigation";
// import { useFetchCMS } from "@/hooks/useFetchCMS";

// import FAQPage from "@/components/cms/FAQPage";
// import PrivacyPolicyPage from "@/components/cms/PrivacyPolicyPage";
// import TermsPage from "@/components/cms/TermsPage";
// import DefaultPage from "@/components/cms/DefaultPage";
// import GeneralDisclaimerPage from "@/components/cms/GeneralDisclaimerPage";
// import ComingSoon from "@/components/ComminSoon";

// export default function CMSPage() {
//   const params = useParams();
//   const slug = params?.slug as string; // This is "privacy-policy" from the URL

//   const { page, loading, error } = useFetchCMS(slug);

//   if (loading) return <p className="text-center py-10">Loading...</p>;
//   if (error) return <p className="text-center py-10 text-red-600">{error}</p>;
//   if (!page) return <p className="text-center py-10">Page not found</p>;

//   // SWITCH BASED ON THE URL SLUG
//   switch (slug) {
//     case "faq":
//       return <FAQPage data={page} />;
//     case "privacy-policy":
//       return <PrivacyPolicyPage data={page} />;
//     case "terms":
//     case "terms-of-use":
//       return <TermsPage data={page} />;
//     case "disclaimer":
//     case "general-disclaimer":
//       return <GeneralDisclaimerPage data={page} />;
//     default:
//       return <ComingSoon />;
//   }
// }

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

  // 1. Check for static pages FIRST
  if (slug === "about-us") {
    return <AboutUsPage />;
  }

  if (slug === "partner-with-us") {
    return <PartnerWithUs />;
  }

  // 2. Handle loading/error for dynamic CMS pages
  if (loading) return <p className="text-center py-10">Loading...</p>;
  if (error) return <p className="text-center py-10 text-red-600">{error}</p>;
  if (!page) return <p className="text-center py-10">Page not found</p>;

  // 3. Switch for Dynamic CMS content
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
      return <DefaultPage data={page} />;
  }
}
