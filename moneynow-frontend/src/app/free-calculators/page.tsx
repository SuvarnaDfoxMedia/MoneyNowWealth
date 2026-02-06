// import FreeCalculators from "@/components/Dashboard/FreeCalculators";
// import React from "react";

// const page = () => {
//   return (
//     <div>
//       <FreeCalculators />
//     </div>
//   );
// };

// export default page;

import FreeCalculators from "@/components/Dashboard/FreeCalculators";
import React from "react";

export const metadata = {
  title: "Free Calculators | MoneyNow",
  description:
    "Use our free financial calculators for SIP, Lumpsum, Retirement Planning, Loan EMI, and more.",
};

const FreeCalculatorsPage = () => {
  return (
    <div className="min-h-screen bg-[#ffffff]">
      <FreeCalculators />
    </div>
  );
};

export default FreeCalculatorsPage;
