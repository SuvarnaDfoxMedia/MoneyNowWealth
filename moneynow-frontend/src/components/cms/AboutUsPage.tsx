// "use client";

// import React from "react";
// import Image from "next/image";
// import { ArrowRight } from "lucide-react";
// import TeamSection from "./AboutTeamSection";
// import AboutHowWeHelpYou from "./AboutHowWeHelpYou";

// const AboutUsPage: React.FC = () => {
//   const bgImage = "/images/about-bg.png";

//   return (
//     <div className="font-poppins mb-16">
//       <div
//         className="relative w-full py-10 text-center bg-cover bg-center bg-no-repeat"
//         style={{
//           backgroundImage: `url(${bgImage})`,
//         }}
//       >
//         <div className="relative z-10 container mx-auto px-4">
//           <h1 className="text-[30px] md:text-[42px] font-semibold text-white capitalize tracking-tight leading-[1.2]">
//             About Us
//           </h1>

//           <div className="flex justify-center items-center gap-2 text-white mt-4 font-medium text-sm md:text-base leading-[28px] capitalize">
//             <span>Home</span>
//             <ArrowRight size={18} className="text-white" strokeWidth={2.5} />
//             <span>About Us</span>
//           </div>
//         </div>
//       </div>

//       <section className="w-full py-[60px] mb-[60px] bg-[#F8F8F8]">
//         <div className="container mx-auto px-4">
//           <div className="text-center mb-12">
//             <p className="text-[30px] md:text-[48px] font-bold text-[#000000] leading-tight">
//               The Trust Of <span className="text-[#043F79]">23 Years.</span>
//               <br />
//               The Technology Of <span className="text-[#043F79]">Today.</span>
//             </p>
//           </div>

//           {/* Blue Bar */}
//           <div className="bg-[#043F79] rounded-xl py-6 md:px-4 px-4 shadow-md">
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
//               {/* Item 1 */}
//               <div className="flex items-center gap-4 text-white lg:col-span-3 lg:max-w-[92%]">
//                 <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
//                   <Image
//                     src="/images/mf-top-icon-1.png"
//                     alt="AMFI"
//                     width={28}
//                     height={28}
//                   />
//                 </div>
//                 <p className="text-[16px] leading-[26px]">
//                   AMFI Registered Mutual
//                   <br className="hidden sm:block" /> Fund Distributor
//                 </p>
//               </div>

//               {/* Item 2 */}
//               <div className="flex items-center gap-3 text-white lg:col-span-2 lg:relative lg:pl-6">
//                 <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
//                 <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
//                   <Image
//                     src="/images/mf-top-icon-2.png"
//                     alt="ARN"
//                     width={28}
//                     height={28}
//                   />
//                 </div>
//                 <p className="text-[16px] leading-[26px]">ARN: XXXXXX</p>
//               </div>

//               {/* Item 3 */}
//               <div className="flex items-center gap-4 text-white lg:col-span-3 lg:max-w-[92%] lg:relative lg:pl-6">
//                 <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
//                 <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
//                   <Image
//                     src="/images/mf-top-icon-3.png"
//                     alt="Families"
//                     width={28}
//                     height={28}
//                   />
//                 </div>
//                 <p className="text-[16px] leading-[26px]">
//                   Trusted by 1,000+
//                   <br className="hidden sm:block" /> families since 2003
//                 </p>
//               </div>

//               {/* Item 4 */}
//               <div className="flex items-center gap-4 text-white lg:col-span-2 lg:relative lg:pl-6">
//                 <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
//                 <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
//                   <Image
//                     src="/images/mf-top-icon-4.png"
//                     alt="Fund Houses"
//                     width={28}
//                     height={28}
//                   />
//                 </div>
//                 <p className="text-[16px] leading-[26px]">
//                   30+ Fund
//                   <br className="hidden sm:block" /> Houses
//                 </p>
//               </div>

//               {/* Item 5 */}
//               <div className="flex items-center gap-4 text-white lg:col-span-2 lg:relative lg:pl-6">
//                 <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
//                 <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
//                   <Image
//                     src="/images/mf-top-icon-5.png"
//                     alt="BSE Member"
//                     width={28}
//                     height={28}
//                   />
//                 </div>
//                 <p className="text-[16px] leading-[26px]">
//                   BSE StAR MF
//                   <br className="hidden sm:block" /> Member
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="w-full mb-[60px]">
//         <div className="max-w-7xl mx-auto ">
//           <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
//             {/* LEFT */}
//             <div>
//               <h2 className="text-[28px] sm:text-[36px] md:text-[45px] font-semibold leading-tight">
//                 Built On{" "}
//                 <span className="text-[#0B3B6E] font-bold">Relationships.</span>
//                 <br />
//                 Focused On Your{" "}
//                 <span className="text-[#0B3B6E] font-bold">Goals.</span>
//               </h2>

//               <p className="mt-5 text-[15px] md:text-[16px] leading-[26px] md:leading-[28px] text-[#000]">
//                 Moneynow didn’t start in a startup office. It began in 2003,
//                 when our founding team started working with families under the
//                 Surabhi Financial Services name — quietly, consistently, without
//                 noise. Over two decades later, more than 1,000 families continue
//                 their investing journey with us.
//               </p>

//               <p className="mt-5 text-[15px] md:text-[16px] leading-[26px] md:leading-[28px] text-[#000]">
//                 Moneynow is the digital expression of that experience — built as
//                 a modern platform where your investments are organised, your
//                 progress is easy to follow, and you are never left to figure
//                 things out alone.
//               </p>

//               <div className="mt-6 p-4 sm:p-5 md:p-6 rounded-[6px] bg-[#043F79]/10">
//                 <p className="text-[#043F79] font-medium text-[16px] md:text-[18px] leading-[26px] md:leading-[30px]">
//                   This is not a do-it-yourself investing app.
//                   <br />
//                   This is a human-supported investment journey.
//                 </p>
//               </div>
//             </div>

//             {/* RIGHT */}
//             <div className="relative w-full h-[260px] sm:h-[320px] md:h-[400px] lg:h-[444px]">
//               <Image
//                 src="/images/about-second-sec-img.png"
//                 alt="Family Investment"
//                 fill
//                 className="object-contain"
//               />
//             </div>
//           </div>
//         </div>
//       </section>

//       <section className="w-full bg-[#F8F8F8] py-[60px]">
//         <div className="max-w-7xl mx-auto">
//           {/* Title */}
//           <h2 className="text-center text-[28px] md:text-[45px] font-semibold text-black mb-12">
//             Founder’s Note
//           </h2>

//           {/* Content Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
//             {/* LEFT IMAGE (5 columns) */}
//             <div className="relative w-full h-[550px] rounded-[14px] overflow-hidden md:col-span-5">
//               <Image
//                 src="/images/founder-note-img.png"
//                 alt="Founder"
//                 fill
//                 className="object-cover"
//               />
//             </div>

//             {/* RIGHT CONTENT (7 columns) */}
//             <div className="bg-white rounded-xl shadow-md p-6 md:p-8 relative md:col-span-7">
//               {/* Quote Icon */}
//               <div className="mb-4">
//                 <Image
//                   src="/images/quote.png"
//                   alt="Quote Icon"
//                   width={30}
//                   height={30}
//                   className="object-contain"
//                 />
//               </div>

//               {/* Paragraphs */}
//               <p className="text-[16px] leading-[30px] mb-4">
//                 When I began working with families in the early 2000s, most
//                 conversations around money were one-sided. I realised that money
//                 was rarely just about numbers — it was about people, their
//                 aspirations, their responsibilities, and the uncertainties they
//                 carried. Instead of offering one-sided solutions, I chose to
//                 listen — to understand each family’s journey and to stay
//                 alongside them through every phase of life.
//               </p>

//               <p className="text-[16px] leading-[30px] mb-4">
//                 Over the years, it has been deeply fulfilling to see clients
//                 move from their first salaries to their children’s education and
//                 eventually to a more secure and comfortable retirement — knowing
//                 that their progress is the result of their own discipline, while
//                 we simply helped them stay organised and consistent with their
//                 goals.
//               </p>

//               <p className="text-[16px] leading-[30px] mb-4">
//                 More than two decades later, that same belief continues to shape
//                 everything we do at Moneynow — building relationships with care,
//                 staying consistent through changing times, and helping people
//                 move forward with clarity and confidence.
//               </p>

//               {/* Divider */}
//               <div className="border-t border-[#E4E4E4] pt-4 ">
//                 <p className="text-[#043F79] font-semibold text-[18px] mb-1">
//                   Anagha Raut
//                 </p>
//                 <p className="font-medium text-[16px]">Founder & Director</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       <TeamSection />
//       <AboutHowWeHelpYou />
//     </div>
//   );
// };

// export default AboutUsPage;

"use client";

import React from "react";
import Image from "next/image";
import TeamSection from "./AboutTeamSection";
import AboutHowWeHelpYou from "./AboutHowWeHelpYou";
import Link from "next/link";

const AboutUsPage: React.FC = () => {
  return (
    <>
      <div className="font-poppins mb-16">
        <div
          className="relative w-full py-10 text-center bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/about-bg.png')",
          }}
        >
          {/* Content Layer */}
          <div className="relative z-10 container mx-auto px-4">
            {/* Title */}
            <h1 className="text-[30px] md:text-[42px] font-semibold text-white capitalize tracking-tight leading-[1.2]">
              About Us
            </h1>

            {/* Breadcrumb */}
            <div className="flex justify-center items-center gap-2 text-white mt-4 font-medium text-sm md:text-base leading-[28px] capitalize">
              <Link href="/" className="hover:underline">
                Home
              </Link>{" "}
              <span className="text-white">→</span>
              <span>About Us</span>
            </div>
          </div>
        </div>

        <section className="w-full py-[60px] mb-[60px] bg-[#F8F8F8]">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-[30px] md:text-[48px] font-bold text-[#000000] leading-tight">
                The Trust Of <span className="text-[#043F79]">23 Years.</span>
                <br />
                The Technology Of <span className="text-[#043F79]">Today.</span>
              </p>
            </div>

            {/* Blue Bar */}
            <div className="bg-[#043F79] rounded-xl py-6 md:px-4 px-4 shadow-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
                {/* Item 1 */}
                <div className="flex items-center gap-4 text-white lg:col-span-3 lg:max-w-[92%]">
                  <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/images/mf-top-icon-1.png"
                      alt="AMFI"
                      width={28}
                      height={28}
                    />
                  </div>
                  <p className="text-[16px] leading-[26px]">
                    AMFI Registered Mutual
                    <br className="hidden sm:block" /> Fund Distributor
                  </p>
                </div>

                {/* Item 2 */}
                <div className="flex items-center gap-3 text-white lg:col-span-2 lg:relative lg:pl-6">
                  <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
                  <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/images/mf-top-icon-2.png"
                      alt="ARN"
                      width={28}
                      height={28}
                    />
                  </div>
                  <p className="text-[16px] leading-[26px]">ARN: XXXXXX</p>
                </div>

                {/* Item 3 */}
                <div className="flex items-center gap-4 text-white lg:col-span-3 lg:max-w-[92%] lg:relative lg:pl-6">
                  <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
                  <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/images/mf-top-icon-3.png"
                      alt="Families"
                      width={28}
                      height={28}
                    />
                  </div>
                  <p className="text-[16px] leading-[26px]">
                    Trusted by 1,000+
                    <br className="hidden sm:block" /> families since 2003
                  </p>
                </div>

                {/* Item 4 */}
                <div className="flex items-center gap-4 text-white lg:col-span-2 lg:relative lg:pl-6">
                  <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
                  <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/images/mf-top-icon-4.png"
                      alt="Fund Houses"
                      width={28}
                      height={28}
                    />
                  </div>
                  <p className="text-[16px] leading-[26px]">
                    30+ Fund
                    <br className="hidden sm:block" /> Houses
                  </p>
                </div>

                {/* Item 5 */}
                <div className="flex items-center gap-4 text-white lg:col-span-2 lg:relative lg:pl-6">
                  <span className="hidden lg:block absolute left-0 top-1/2 h-[28px] w-px -translate-y-1/2 bg-[#ffffff]" />
                  <div className="bg-white p-2 rounded-[6px] w-[54px] h-[54px] flex items-center justify-center">
                    <Image
                      src="/images/mf-top-icon-5.png"
                      alt="BSE Member"
                      width={28}
                      height={28}
                    />
                  </div>
                  <p className="text-[16px] leading-[26px]">
                    BSE StAR MF
                    <br className="hidden sm:block" /> Member
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full mb-[60px]">
          <div className="max-w-7xl mx-auto ">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              {/* LEFT */}
              <div>
                <h2 className="text-[28px] sm:text-[36px] md:text-[45px] font-semibold leading-tight">
                  Built On{" "}
                  <span className="text-[#0B3B6E] font-bold">
                    Relationships.
                  </span>
                  <br />
                  Focused On Your{" "}
                  <span className="text-[#0B3B6E] font-bold">Goals.</span>
                </h2>

                <p className="mt-5 text-[15px] md:text-[16px] leading-[26px] md:leading-[28px] text-[#000]">
                  Moneynow didn't start in a startup office. It began in 2003,
                  when our founding team started working with families under the
                  Surabhi Financial Services name — quietly, consistently,
                  without noise. Over two decades later, more than 1,000
                  families continue their investing journey with us.
                </p>

                <p className="mt-5 text-[15px] md:text-[16px] leading-[26px] md:leading-[28px] text-[#000]">
                  Moneynow is the digital expression of that experience — built
                  as a modern platform where your investments are organised,
                  your progress is easy to follow, and you are never left to
                  figure things out alone.
                </p>

                <div className="mt-6 p-4 sm:p-5 md:p-6 rounded-[6px] bg-[#043F79]/10">
                  <p className="text-[#043F79] font-medium text-[16px] md:text-[18px] leading-[26px] md:leading-[30px]">
                    This is not a do-it-yourself investing app.
                    <br />
                    This is a human-supported investment journey.
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="relative w-full h-[260px] sm:h-[320px] md:h-[400px] lg:h-[444px]">
                <Image
                  src="/images/about-second-sec-img.png"
                  alt="Family Investment"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="w-full bg-[#F8F8F8] py-[60px]">
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <h2 className="text-center text-[28px] md:text-[45px] font-semibold text-black mb-12">
              Founder's Note
            </h2>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              {/* LEFT IMAGE (5 columns) */}
              <div className="relative w-full h-[550px] rounded-[14px] overflow-hidden md:col-span-5">
                <Image
                  src="/images/founder-note-img.png"
                  alt="Founder"
                  fill
                  className="object-cover"
                />
              </div>

              {/* RIGHT CONTENT (7 columns) */}
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8 relative md:col-span-7">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Image
                    src="/images/quote.png"
                    alt="Quote Icon"
                    width={30}
                    height={30}
                    className="object-contain"
                  />
                </div>

                {/* Paragraphs */}
                <p className="text-[16px] leading-[30px] mb-4">
                  When I began working with families in the early 2000s, most
                  conversations around money were one-sided. I realised that
                  money was rarely just about numbers — it was about people,
                  their aspirations, their responsibilities, and the
                  uncertainties they carried. Instead of offering one-sided
                  solutions, I chose to listen — to understand each family's
                  journey and to stay alongside them through every phase of
                  life.
                </p>

                <p className="text-[16px] leading-[30px] mb-4">
                  Over the years, it has been deeply fulfilling to see clients
                  move from their first salaries to their children's education
                  and eventually to a more secure and comfortable retirement —
                  knowing that their progress is the result of their own
                  discipline, while we simply helped them stay organised and
                  consistent with their goals.
                </p>

                <p className="text-[16px] leading-[30px] mb-4">
                  More than two decades later, that same belief continues to
                  shape everything we do at Moneynow — building relationships
                  with care, staying consistent through changing times, and
                  helping people move forward with clarity and confidence.
                </p>

                {/* Divider */}
                <div className="border-t border-[#E4E4E4] pt-4 ">
                  <p className="text-[#043F79] font-semibold text-[18px] mb-1">
                    Anagha Raut
                  </p>
                  <p className="font-medium text-[16px]">Founder & Director</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TeamSection />
        <AboutHowWeHelpYou />
      </div>
    </>
  );
};

export default AboutUsPage;
