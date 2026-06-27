import React from "react";

const steps = [
  {
    step: "Step 1:",
    title: "Share your interest",
    description: "Submit your basic details through the form.",
  },
  {
    step: "Step 2:",
    title: "Discussion & fit",
    description:
      "We connect with you to understand your practice and requirements.",
  },
  {
    step: "Step 3:",
    title: "Onboarding & documentation",
    description:
      "Complete the necessary onboarding and compliance documentation.",
  },
  {
    step: "Step 4:",
    title: "Start using the platform",
    description: "Begin using the platform with your clients.",
  },
];

function HowPartnershipWork() {
  return (
    <section className="font-poppins py-[60px] bg-[#F8F8F8]">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-center text-[28px] md:text-[40px] font-semibold leading-tight">
          How The Partnership Works
        </h2>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {steps.map(({ step, title, description }) => (
            <div
              key={step}
              className="group rounded-[14px]  bg-white px-6 py-5 text-[#111111] shadow-md transition duration-300  hover:bg-[#043F79] hover:text-white md:min-h-[146px] md:px-6 md:py-5"
            >
              <div
                className="inline-flex rounded-[6px] bg-[#043F79]/12 px-4 py-3 text-[14px] md:text-[16px] font-medium leading-none text-[#164D86] transition duration-300 group-hover:bg-[rgba(255,255,255,0.12)] group-hover:text-white"
              >
                {step}
              </div>

              <h3
                className="mt-3 text-[18px] md:text-[20px] font-semibold  text-[#043F79] transition duration-300 group-hover:text-[#ffffff]"
              >
                {title}
              </h3>

              <p
                className="mt-3 text-[15px] md:text-[16px] leading-[24px] md:leading-[28px]  transition duration-300 group-hover:text-white"
              >
                {description}
              </p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-15 max-w-7xl text-center text-[15px] md:text-[16px] leading-[24px] md:leading-[28px]">
          All partnerships are operated strictly within the SEBI Mutual Fund
          Regulations and AMFI guidelines applicable to mutual fund
          distributors and their empanelled sub-distributors / authorised
          partners. Each partner is expected to maintain a valid ARN and follow
          the AMFI Code of Conduct at all times.
        </p>
      </div>
    </section>
  );
}

export default HowPartnershipWork;
