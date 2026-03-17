// "use client";

// import React from "react";
// import Image from "next/image";
// import { LuDownload, LuChevronRight } from "react-icons/lu";

// interface HomeInvestTrackProps {
//   data: {
//     phoneImage: string;
//     title: string;
//     checkItems: string[];
//     scannerImg?: string;
//   };
// }

// export default function HomeInvestTrack({ data }: HomeInvestTrackProps) {
//   const {
//     phoneImage = "/images/fallback-phone.png",
//     checkItems = [],
//     scannerImg = "/images/scanner-img.png",
//   } = data || {};

//   return (
//     <section className="w-full bg-white relative font-poppins p-0 m-0">
//       <div className="max-w-7xl mx-auto px-6 md:px-10">

//         <div className="flex flex-col lg:flex-row items-start gap-0">

//           {/* LEFT CONTENT */}
//           <div className="w-full lg:w-[58%] flex flex-col items-start text-left">

//             <div className="mb-6 text-[#1A1A1A] leading-none flex items-center">
//               <LuDownload size={52} strokeWidth={2.5} />
//             </div>

//             <h2 className="text-[28px] sm:text-[32px] md:text-[40px] font-semibold mb-6 leading-[1.2] md:leading-[52px]">
//               Invest With Confidence, On <br /> Web And Mobile
//             </h2>

//             <ul className="space-y-4 mb-10 md:mb-14">
//               {(checkItems.length > 0
//                 ? checkItems
//                 : [
//                     "AMFI Registered Mutual Fund Distributor",
//                     "Long-Term, Goal-Focused Investing Approach",
//                     "Easy Access To Your Investment Anytime",
//                   ]
//               ).map((item, idx) => (
//                 <li
//                   key={idx}
//                   className="flex items-center gap-3 text-[15px] md:text-[18px]"
//                 >
//                   <div className="flex-shrink-0 w-[24px] h-[24px] md:w-[30px] md:h-[30px] relative">
//                     <Image
//                       src="/images/list-before-icon.png"
//                       alt="check"
//                       fill
//                       className="object-contain"
//                     />
//                   </div>
//                   {item}
//                 </li>
//               ))}
//             </ul>

//             {/* BLUE SCANNER BAR */}
//             <div className="relative w-full py-8 md:py-10 flex items-center text-white z-[1]
//               before:content-['']
//               before:absolute
//               before:top-0
//               before:bottom-0
//               before:right-0
//               before:left-[-2000px]
//               before:bg-[#043F79]
//               before:rounded-tr-[50px]
//               before:z-[-1]"
//             >
//               <div className="relative z-[1] w-full flex flex-col md:flex-row gap-8 md:gap-12">

//                 {/* ANDROID */}
//                 <div className="flex items-center gap-4">
//                   <p className="text-[15px] md:text-[17px] leading-[24px] md:leading-[26px]">
//                     Scan to download <br /> the Moneynow app <br />
//                     for <span className="font-bold">Android</span>
//                   </p>
//                   <LuChevronRight size={22} className="text-white" />
//                   <div className="bg-white p-1 shadow-lg">
//                     <Image
//                       src={scannerImg}
//                       alt="QR"
//                       width={80}
//                       height={80}
//                       className="object-contain"
//                     />
//                   </div>
//                 </div>

//                 {/* IOS */}
//                 <div className="flex items-center gap-4">
//                   <p className="text-[15px] md:text-[17px] leading-[24px] md:leading-[26px]">
//                     Scan to download <br /> the Moneynow app <br />
//                     for <span className="font-bold">iOS</span>
//                   </p>
//                   <LuChevronRight size={22} className="text-white" />
//                   <div className="bg-white p-1 shadow-lg">
//                     <Image
//                       src={scannerImg}
//                       alt="QR"
//                       width={80}
//                       height={80}
//                       className="object-contain"
//                     />
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>

//           {/* RIGHT CONTENT - PHONE IMAGE */}
//           <div className="w-full lg:w-[42%] flex justify-center lg:justify-end relative">

//             {/* MOBILE VERSION */}
//             <div className="block lg:hidden relative w-[85%] max-w-[340px] h-[420px] ">
//               <Image
//                 src={phoneImage}
//                 alt="Moneynow App View"
//                 fill
//                 className="object-contain"
//                 priority
//               />
//             </div>

//             {/* DESKTOP VERSION */}
//             <div className="hidden lg:block relative w-full aspect-[4/5] max-w-[565px] scale-110 origin-top">
//               <Image
//                 src={phoneImage}
//                 alt="Moneynow App View"
//                 fill
//                 className="object-contain object-top"
//                 priority
//               />
//             </div>

//           </div>

//         </div>
//       </div>
//     </section>
//   );
// }

// "use client";

// import React from "react";
// import Image from "next/image";
// import { LuDownload, LuChevronRight } from "react-icons/lu";

// interface HomeInvestTrackProps {
//   data: {
//     phoneImage: string;
//     title: string;
//     checkItems: string[];
//     scannerImg?: string;
//   };
// }

// export default function HomeInvestTrack({ data }: HomeInvestTrackProps) {
//   const {
//     phoneImage,
//     checkItems = [],
//     scannerImg = "/images/scanner-img.png",
//   } = data || {};

//   return (
//     <section className="w-full bg-white relative font-poppins p-0 m-0 overflow-hidden">
//       <div className="max-w-7xl mx-auto px-6 md:px-10">

//         {/* items-start: Pins everything (text and image) to the ceiling on both mobile and desktop */}
//         <div className="flex flex-col lg:flex-row items-start gap-0 p-0 m-0">

//           {/* LEFT CONTENT */}
//           <div className="w-full lg:w-[58%] flex flex-col items-start text-left p-0 m-0">

//             {/* leading-none: Removes font-level whitespace above the icon */}
//             <div className="mt-0 mb-6 text-[#1A1A1A] leading-none flex items-center">
//               <LuDownload size={52} strokeWidth={2.5} />
//             </div>

//             <h2 className="text-[27px] leading-[38px] md:text-[40px] font-semibold mb-[24px] md:leading-[52px] text-[#1A1A1A]">
//               Invest With Confidence, On <br className="hidden md:block" /> Web And Mobile
//             </h2>

//             <ul className="space-y-4 mb-14">
//               {(checkItems.length > 0 ? checkItems : [
//                 "AMFI Registered Mutual Fund Distributor",
//                 "Long-Term, Goal-Focused Investing Approach",
//                 "Easy Access To Your Investment Anytime",
//               ]).map((item, idx) => (
//                 <li key={idx} className="flex items-center gap-2 text-[16px] md:text-[18px] leading-[26px]">
//                   <div className="flex-shrink-0 w-[24px] h-[24px] md:w-[30px] md:h-[30px] relative">
//                     <Image
//                       src="/images/list-before-icon.png"
//                       alt="check"
//                       fill
//                       className="object-contain"
//                     />
//                   </div>
//                   <span className="flex-1">{item}</span>
//                 </li>
//               ))}
//             </ul>

//             {/* BLUE SCANNER BAR */}
//             <div className="
//                 relative
//                 w-full
//                 py-10
//                 flex items-center text-white
//                 z-[1]
//                 before:content-['']
//                 before:absolute
//                 before:top-0
//                 before:bottom-0
//                 before:right-0
//                 before:left-[-2000px]
//                 before:bg-[#043F79]
//                 before:rounded-tr-[50px]
//                 before:z-[-1]
//             ">
//               <div className="relative z-[1] w-full flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
//                 <div className="flex items-center gap-3">
//                   <p className="md:text-[17px] text-[16px] leading-[26px]">
//                     Scan to download <br /> the Moneynow app <br />
//                     for <span className="font-bold"> Android.</span>
//                   </p>
//                   <LuChevronRight size={24} strokeWidth={2} className="text-white" />
//                   <div className="bg-white p-1 shadow-lg">
//                     <Image src={scannerImg} alt="QR" width={90} height={90} className="object-contain" />
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3">
//                   <p className="md:text-[17px] text-[16px] leading-[26px]">
//                     Scan to download <br /> the Moneynow app <br />
//                     for <span className="font-bold"> IOS.</span>
//                   </p>
//                   <LuChevronRight size={24} strokeWidth={2} className="text-white" />
//                   <div className="bg-white p-1 shadow-lg">
//                     <Image src={scannerImg} alt="QR" width={90} height={90} className="object-contain" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* RIGHT CONTENT: PHONES */}
// <div className="w-full lg:w-[42%] flex flex-col items-start lg:items-end my-8 lg:my-0">              {phoneImage && (

// <div className="relative w-[90%] sm:w-[75%] lg:w-full aspect-[5/5] max-w-[565px] ">
//               <Image
//                   src={phoneImage}
//                   alt="Moneynow App View"
//                   fill
//                   className="object-contain object-top"
//                   priority
//                 />
//               </div>
//             )}
//           </div>

//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import React from "react";
import Image from "next/image";
import { LuDownload, LuChevronRight } from "react-icons/lu";

interface HomeInvestTrackProps {
  data: {
    phoneImage: string;
    title?: string;
    titleLine1?: string;
    titleLine2?: string;
    titleLine3?: string;
    checkItems?: string[];
    scannerImg?: string;
    appStoreImg?: string;
    playStoreImg?: string;
  };
}

export default function HomeInvestTrack({ data }: HomeInvestTrackProps) {
  const {
    phoneImage,
    checkItems = [],
    scannerImg = "/images/scanner-img.png",
  } = data || {};

  return (
    <section className="w-full bg-white relative font-poppins p-0 m-0 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* items-start: Pins everything (text and image) to the ceiling on both mobile and desktop */}
        <div className="flex flex-col lg:flex-row items-start gap-0 p-0 m-0">
          {/* LEFT CONTENT */}
          <div className="w-full lg:w-[58%] flex flex-col items-start text-left p-0 m-0">
            {/* leading-none: Removes font-level whitespace above the icon */}
            <div className="mt-0 mb-6 text-[#1A1A1A] leading-none flex items-center">
              <LuDownload size={52} strokeWidth={2.5} />
            </div>

            <h2 className="text-[27px] leading-[38px] md:text-[40px] font-semibold mb-[24px] md:leading-[52px] text-[#1A1A1A]">
              Invest With Confidence, On <br className="hidden md:block" /> Web
              And Mobile
            </h2>

            <ul className="space-y-4 mb-14">
              {(checkItems.length > 0
                ? checkItems
                : [
                    "AMFI Registered Mutual Fund Distributor",
                    "Long-Term, Goal-Focused Investing Approach",
                    "Easy Access To Your Investment Anytime",
                  ]
              ).map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 text-[16px] md:text-[18px] leading-[26px]"
                >
                  <div className="flex-shrink-0 w-[24px] h-[24px] md:w-[30px] md:h-[30px] relative">
                    <Image
                      src="/images/list-before-icon.png"
                      alt="check"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>

            {/* BLUE SCANNER BAR */}
            <div
              className="
                relative 
                w-full 
                py-10 
                flex items-center text-white
                z-[1]
                before:content-['']
                before:absolute
                before:top-0
                before:bottom-0
                before:right-0
                before:left-[-2000px] 
                before:bg-[#043F79]
                before:rounded-tr-[50px]
                before:z-[-1]
            "
            >
              <div className="relative z-[1] w-full flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
                <div className="flex items-center gap-3">
                  <p className="md:text-[17px] text-[16px] leading-[26px]">
                    Scan to download <br /> the Moneynow app <br />
                    for <span className="font-bold"> Android.</span>
                  </p>
                  <LuChevronRight
                    size={24}
                    strokeWidth={2}
                    className="text-white"
                  />
                  <div className="bg-white p-1 shadow-lg">
                    <Image
                      src={scannerImg}
                      alt="QR"
                      width={90}
                      height={90}
                      className="object-contain"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <p className="md:text-[17px] text-[16px] leading-[26px]">
                    Scan to download <br /> the Moneynow app <br />
                    for <span className="font-bold"> IOS.</span>
                  </p>
                  <LuChevronRight
                    size={24}
                    strokeWidth={2}
                    className="text-white"
                  />
                  <div className="bg-white p-1 shadow-lg">
                    <Image
                      src={scannerImg}
                      alt="QR"
                      width={90}
                      height={90}
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: PHONES */}
          <div className="w-full lg:w-[42%] flex flex-col items-start lg:items-end my-8 lg:my-0">
            {" "}
            {phoneImage && (
              <div className="relative w-[90%] sm:w-[75%] lg:w-full aspect-[5/5] max-w-[565px] ">
                <Image
                  src={phoneImage}
                  alt="Moneynow App View"
                  fill
                  className="object-contain object-top"
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
