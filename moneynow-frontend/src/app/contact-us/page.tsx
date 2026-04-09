import React from "react";
import ContactForm from "@/components/Contact-Us/ContactForm";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata("/contact-us", {
    title: "Contact Us | MoneyNow Wealth",
    description:
      "Get in touch with MoneyNow Wealth for support, partnership discussions, or general enquiries.",
  });
}

function page() {
  return (
    <div>
      <ContactForm />
    </div>
  );
}

export default page;
