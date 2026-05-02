// "use client";

// import Link from "next/link";
// import { ArrowRight } from "lucide-react";

// const TOOL_LINKS = [
//   {
//     title: "Plan another goal",
//     copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
//     href: "/free-calculators",
//     cta: "Open goal calculator",
//     icon: "target",
//   },
//   {
//     title: "See what a lumpsum could do",
//     copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
//     href: "/free-calculators",
//     cta: "Open lumpsum calculator",
//     icon: "chart",
//   },
//   {
//     title: "Understand inflation on your goals",
//     copy: "See how inflation changes the real value of your future goals and why starting early matters.",
//     href: "/free-calculators",
//     cta: "Open inflation calculator",
//     icon: "trend",
//   },
// ] as const;

// function ToolGlyph({ icon }: { icon: (typeof TOOL_LINKS)[number]["icon"] }) {
//   if (icon === "target") {
//     return (
//       <svg
//         viewBox="0 0 24 24"
//         className="h-8 w-8"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <circle cx="12" cy="12" r="7" />
//         <circle cx="12" cy="12" r="3" />
//         <path d="M12 2v3M21 12h-3M12 19v3M6 12H3M17 7l3-3" />
//       </svg>
//     );
//   }

//   if (icon === "chart") {
//     return (
//       <svg
//         viewBox="0 0 24 24"
//         className="h-8 w-8"
//         fill="none"
//         stroke="currentColor"
//         strokeWidth="2"
//       >
//         <path d="M4 19V5M4 19h16" />
//         <path d="M8 15l3-3 3 2 5-6" />
//       </svg>
//     );
//   }

//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="h-8 w-8"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2"
//     >
//       <path d="M4 19h16M6 16l4-4 3 2 5-6" />
//       <path d="M17 8h3v3" />
//     </svg>
//   );
// }

// export default function MoreToolsToExplore() {
//   return (
// <section className="bg-gradient-to-b from-[#F8F8F8] to-[#ffffff] py-14 mt-[40px]">
//         <div className="mx-auto max-w-7xl px-4 md:px-6">
//         <div className="mx-auto max-w-full text-center">
//           <h2 className="text-[40px] font-semibold tracking-[-0.03em]">
//             More Tools To Explore
//           </h2>
//           <p className="mt-4 text-[18px] leading-8">
//             Use these simple tools to look at your money from a few different
//             angles
//           </p>
//         </div>

//         <div className="mt-14 grid gap-6 lg:grid-cols-3">
//           {TOOL_LINKS.map((card) => (
//             <div
//               key={card.title}
//               className="rounded-[14px] border border-[#E6E6E6] bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
//             >
//               <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[8px] bg-[#E8EEF6] text-[#0E4A89]">
//                 <ToolGlyph icon={card.icon} />
//               </div>
//               <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">
//                 {card.title}
//               </h3>
//               <p className="mt-4 text-[16px] leading-[28px]">
//                 {card.copy}
//               </p>
//               <Link
//                 href={card.href}
//                 className="mt-7 inline-flex items-center gap-3 rounded-[6px] bg-[#043F79] px-5 py-3 text-[16px] font-medium text-white transition hover:bg-[#0A3C6F]"
//               >
//                 {card.cta}
//                 <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#ffffff]" />
//               </Link>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const TOOL_LINKS = [
  {
    title: "Plan another goal",
    copy: "Estimate how much SIP you may need for a different goal amount, time frame, or return assumption.",
    href: "/free-calculators",
    cta: "Open goal calculator",
    icon: "target",
  },
  {
    title: "See what a lumpsum could do",
    copy: "Check how a one-time investment today could grow alongside your SIPs over the years.",
    href: "/free-calculators",
    cta: "Open lumpsum calculator",
    icon: "chart",
  },
  {
    title: "Understand inflation on your goals",
    copy: "See how inflation changes the real value of your future goals and why starting early matters.",
    href: "/free-calculators",
    cta: "Open inflation calculator",
    icon: "trend",
  },
] as const;

function ToolGlyph({ icon }: { icon: (typeof TOOL_LINKS)[number]["icon"] }) {
  if (icon === "target") {
    return (
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="50"
          height="50"
          rx="6"
          fill="#043F79"
          fillOpacity="0.12"
        />
        <path
          d="M36.274 14.0827L39.626 14.7527C39.806 14.7887 39.954 14.9207 40.006 15.0987C40.0323 15.1851 40.0346 15.2771 40.0128 15.3648C39.9909 15.4525 39.9457 15.5326 39.882 15.5967L37.136 18.3447C36.807 18.6719 36.362 18.8559 35.898 18.8567H33.62L27.9 24.5787C28.0091 24.9907 28.0292 25.4213 27.9589 25.8417C27.8885 26.2621 27.7294 26.6627 27.4921 27.0168C27.2549 27.3709 26.9448 27.6704 26.5827 27.8952C26.2206 28.1201 25.8148 28.2653 25.3922 28.321C24.9696 28.3767 24.54 28.3417 24.132 28.2184C23.7239 28.0951 23.3469 27.8862 23.0259 27.6057C22.705 27.3253 22.4474 26.9796 22.2705 26.5918C22.0936 26.204 22.0014 25.7829 22 25.3567C21.9999 24.8963 22.1057 24.4421 22.3093 24.0293C22.5129 23.6164 22.8088 23.2559 23.1741 22.9757C23.5394 22.6955 23.9642 22.5031 24.4157 22.4135C24.8673 22.3238 25.3334 22.3393 25.778 22.4587L31.5 16.7347V14.4607C31.5 13.9967 31.684 13.5507 32.012 13.2227L34.76 10.4747C34.8241 10.4109 34.9042 10.3658 34.9919 10.3439C35.0796 10.3221 35.1715 10.3244 35.258 10.3507C35.436 10.4027 35.568 10.5507 35.604 10.7307L36.274 14.0827Z"
          fill="#043F79"
        />
        <path
          d="M13.0014 25.356C13.0034 27.072 13.3734 28.7675 14.0865 30.3282C14.7995 31.889 15.839 33.2787 17.1348 34.4035C18.4306 35.5284 19.9526 36.3623 21.598 36.849C23.2435 37.3356 24.9742 37.4637 26.6734 37.2246C28.3726 36.9855 30.0007 36.3848 31.448 35.463C32.8953 34.5411 34.128 33.3196 35.0631 31.8809C35.9982 30.4421 36.6138 28.8195 36.8685 27.1226C37.1231 25.4257 37.0109 23.6939 36.5394 22.044C36.4732 21.8513 36.4469 21.6471 36.4621 21.4438C36.4773 21.2406 36.5338 21.0426 36.628 20.8619C36.7222 20.6811 36.8522 20.5215 37.0101 20.3926C37.168 20.2637 37.3504 20.1683 37.5463 20.1122C37.7423 20.0561 37.9476 20.0404 38.1497 20.0662C38.3519 20.0919 38.5467 20.1586 38.7223 20.262C38.8979 20.3655 39.0506 20.5036 39.1712 20.668C39.2917 20.8323 39.3775 21.0195 39.4234 21.218C40.3364 24.4131 40.163 27.8209 38.9303 30.9067C37.6975 33.9926 35.4753 36.5819 32.6122 38.2685C29.7491 39.955 26.407 40.6434 23.1105 40.2256C19.8139 39.8079 16.7492 38.3075 14.3974 35.96C12.048 33.6088 10.5461 30.5438 10.1274 27.2465C9.70862 23.9491 10.3968 20.6061 12.0838 17.7422C13.7708 14.8783 16.3612 12.6558 19.4481 11.4235C22.5351 10.1913 25.9439 10.0191 29.1394 10.934C29.5198 11.0453 29.8408 11.3026 30.0322 11.6497C30.2235 11.9969 30.2697 12.4057 30.1605 12.7868C30.0514 13.1679 29.7958 13.4903 29.4497 13.6835C29.1036 13.8767 28.695 13.9251 28.3134 13.818C26.5265 13.3049 24.6449 13.214 22.8169 13.5524C20.9889 13.8909 19.2645 14.6494 17.7797 15.7682C16.295 16.887 15.0905 18.3354 14.2613 19.9993C13.432 21.6632 13.0007 23.497 13.0014 25.356Z"
          fill="#043F79"
        />
        <path
          d="M19.001 25.3569C19.0011 26.4501 19.2997 27.5225 19.8645 28.4584C20.4293 29.3944 21.239 30.1584 22.2061 30.668C23.1732 31.1776 24.2611 31.4135 25.3525 31.3502C26.4438 31.2869 27.4972 30.9269 28.399 30.3089C29.3005 29.6894 30.0156 28.8352 30.4668 27.8386C30.918 26.8421 31.0882 25.7412 30.959 24.6549C30.924 24.3913 30.9599 24.1232 31.0631 23.8781C31.1662 23.633 31.3328 23.4198 31.5457 23.2605C31.7586 23.1012 32.0101 23.0015 32.2743 22.9717C32.5385 22.9419 32.8059 22.983 33.049 23.0909C33.2919 23.1974 33.5023 23.3664 33.6587 23.5807C33.815 23.7951 33.9117 24.047 33.939 24.3109C34.1563 26.1671 33.7903 28.0449 32.892 29.6837C31.9936 31.3225 30.6074 32.641 28.9256 33.4562C27.2439 34.2713 25.3501 34.5428 23.5071 34.2328C21.6642 33.9228 19.9634 33.0467 18.6409 31.7262C17.3184 30.4057 16.4398 28.7063 16.127 26.8638C15.8142 25.0213 16.0827 23.1271 16.8953 21.4441C17.7079 19.7611 19.0243 18.3729 20.6617 17.472C22.2992 16.5712 24.1764 16.2024 26.033 16.4169C26.2317 16.4353 26.4249 16.4933 26.601 16.5873C26.7771 16.6814 26.9326 16.8096 27.0585 16.9646C27.1844 17.1195 27.2781 17.298 27.3341 17.4897C27.3901 17.6813 27.4073 17.8822 27.3847 18.0805C27.3621 18.2789 27.3001 18.4707 27.2023 18.6448C27.1046 18.8189 26.9731 18.9717 26.8155 19.0943C26.658 19.2169 26.4775 19.3068 26.2848 19.3588C26.092 19.4108 25.8908 19.4237 25.693 19.3969C24.8523 19.2993 24.0004 19.3806 23.1934 19.6356C22.3864 19.8906 21.6425 20.3134 21.0105 20.8763C20.3784 21.4391 19.8727 22.1294 19.5263 22.9016C19.18 23.6738 19.001 24.5106 19.001 25.3569Z"
          fill="#043F79"
        />
      </svg>
    );
  }

  if (icon === "chart") {
    return (
      <svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="50"
          height="50"
          rx="6"
          fill="#043F79"
          fillOpacity="0.12"
        />
        <path
          d="M11.3507 29.1755C11.2361 29.2862 11.1447 29.4186 11.0818 29.565C11.0189 29.7114 10.9858 29.8689 10.9844 30.0282C10.983 30.1876 11.0134 30.3456 11.0737 30.4931C11.1341 30.6405 11.2232 30.7745 11.3358 30.8872C11.4485 30.9999 11.5825 31.089 11.73 31.1493C11.8775 31.2096 12.0355 31.24 12.1948 31.2386C12.3541 31.2372 12.5116 31.2041 12.658 31.1412C12.8044 31.0783 12.9368 30.9869 13.0475 30.8723L11.3507 29.1755ZM33.9779 21.2555C34.0908 21.1444 34.1806 21.012 34.2421 20.866C34.3036 20.7201 34.3356 20.5633 34.3362 20.4049C34.3368 20.2465 34.3061 20.0896 34.2458 19.9431C34.1854 19.7966 34.0967 19.6636 33.9847 19.5516C33.8726 19.4396 33.7395 19.3509 33.5931 19.2906C33.4466 19.2302 33.2896 19.1995 33.1312 19.2002C32.9728 19.2009 32.8161 19.2329 32.6701 19.2944C32.5241 19.3559 32.3918 19.4458 32.2807 19.5587L33.9779 21.2555ZM13.0475 30.8723L19.6943 24.2255L17.9975 22.5287L11.3503 29.1755L13.0475 30.8723ZM20.2599 24.2255L23.6543 27.6199L25.3511 25.9227L21.9571 22.5287L20.2599 24.2255ZM27.6139 27.6199L33.9779 21.2559L32.2807 19.5587L25.9167 25.9227L27.6139 27.6199ZM23.6543 27.6199C23.9143 27.8799 24.2226 28.0862 24.5623 28.2269C24.9021 28.3677 25.2662 28.4401 25.6339 28.4401C26.0016 28.4401 26.3658 28.3677 26.7055 28.2269C27.0452 28.0862 27.3539 27.8799 27.6139 27.6199L25.9167 25.9227C25.8796 25.9599 25.8359 25.9894 25.7873 26.0095C25.7387 26.0297 25.6867 26.04 25.6341 26.04C25.5816 26.04 25.5295 26.0297 25.4809 26.0095C25.4324 25.9894 25.3883 25.9599 25.3511 25.9227L23.6543 27.6199ZM19.6943 24.2255C19.7693 24.1505 19.8711 24.1084 19.9771 24.1084C20.0832 24.1084 20.1849 24.1505 20.2599 24.2255L21.9571 22.5287C21.6971 22.2687 21.3884 22.0624 21.0487 21.9217C20.709 21.7809 20.3448 21.7085 19.9771 21.7085C19.6094 21.7085 19.2453 21.7809 18.9055 21.9217C18.5658 22.0624 18.2575 22.2687 17.9975 22.5287L19.6943 24.2255Z"
          fill="#043F79"
        />
        <path
          d="M35.3221 22.6011L30.9341 18.2127C30.4909 17.7699 30.8045 17.0127 31.4309 17.0127H35.3221C35.6404 17.0127 35.9456 17.1391 36.1706 17.3642C36.3957 17.5892 36.5221 17.8944 36.5221 18.2127V22.1039C36.5221 22.7303 35.7649 23.0439 35.3221 22.6011Z"
          fill="#043F79"
          stroke="#043F79"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.1992 14.1562V35.7563C12.1992 35.9684 12.2835 36.1719 12.4335 36.3219C12.5836 36.472 12.787 36.5563 12.9992 36.5563H37.7992"
          stroke="#043F79"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="50" height="50" rx="6" fill="#043F79" fillOpacity="0.12" />
      <path
        d="M36.9989 26.6902C36.6453 26.6902 36.3062 26.5497 36.0561 26.2997C35.8061 26.0496 35.6656 25.7105 35.6656 25.3568V21.9035L27.2789 30.3035C27.155 30.4285 27.0075 30.5277 26.845 30.5954C26.6826 30.6631 26.5083 30.6979 26.3323 30.6979C26.1563 30.6979 25.982 30.6631 25.8195 30.5954C25.657 30.5277 25.5096 30.4285 25.3856 30.3035L20.9989 25.9035L13.9456 32.9702C13.6945 33.2213 13.354 33.3623 12.9989 33.3623C12.6439 33.3623 12.3033 33.2213 12.0523 32.9702C11.8012 32.7191 11.6602 32.3786 11.6602 32.0235C11.6602 31.6684 11.8012 31.3279 12.0523 31.0768L20.0523 23.0768C20.1762 22.9519 20.3237 22.8527 20.4862 22.785C20.6487 22.7173 20.8229 22.6825 20.9989 22.6825C21.175 22.6825 21.3492 22.7173 21.5117 22.785C21.6742 22.8527 21.8217 22.9519 21.9456 23.0768L26.3323 27.4768L33.7856 20.0235H30.3323C29.9787 20.0235 29.6395 19.883 29.3895 19.633C29.1394 19.3829 28.9989 19.0438 28.9989 18.6902C28.9989 18.3366 29.1394 17.9974 29.3895 17.7474C29.6395 17.4973 29.9787 17.3568 30.3323 17.3568H36.9989C37.1732 17.359 37.3453 17.3952 37.5056 17.4635C37.8314 17.5988 38.0903 17.8577 38.2256 18.1835C38.2939 18.3438 38.3302 18.5159 38.3323 18.6902V25.3568C38.3323 25.7105 38.1918 26.0496 37.9418 26.2997C37.6917 26.5497 37.3526 26.6902 36.9989 26.6902Z"
        fill="#043F79"
      />
    </svg>
  );
}

export default function MoreToolsToExplore() {
  return (
    <section className="bg-gradient-to-b from-[#F8F8F8] to-[#ffffff] py-14 mt-[40px]">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-full text-center">
          <h2 className="text-[40px] font-semibold tracking-[-0.03em]">
            More Tools To Explore
          </h2>
          <p className="mt-4 text-[18px] leading-8">
            Use these simple tools to look at your money from a few different
            angles
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TOOL_LINKS.map((card) => (
            <div
              key={card.title}
              className="rounded-[14px] border border-[#E6E6E6] bg-white p-6 shadow-[0_4px_12px_rgba(15,23,42,0.04)]"
            >
              {/* ✅ Removed extra wrapper bg — SVG already has background */}
              <ToolGlyph icon={card.icon} />

              <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em]">
                {card.title}
              </h3>

              <p className="mt-4 text-[16px] leading-[28px]">{card.copy}</p>

              <Link
                href={card.href}
                className="mt-7 inline-flex items-center gap-3 rounded-[6px] bg-[#043F79] px-5 py-3 text-[16px] font-medium text-white transition hover:bg-[#0A3C6F]"
              >
                {card.cta}
                <ArrowRight className="h-4 w-4 text-white" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
