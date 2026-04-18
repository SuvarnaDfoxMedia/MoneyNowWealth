import React from "react";
import ContactForm from "@/components/Contact-Us/ContactForm";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { buildPageMetadata, resolveSeoEntry } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildPageMetadata("/contact-us", {
    title: "Contact Us | MoneyNow Wealth",
    description:
      "Get in touch with MoneyNow Wealth for support, partnership discussions, or general enquiries.",
  });
}

async function page() {
  const seo = await resolveSeoEntry("/contact-us");

  return (
    <div>
      <SeoJsonLd schema={seo?.page_schema} />
      <ContactForm />
    </div>
  );
}

export default page;
