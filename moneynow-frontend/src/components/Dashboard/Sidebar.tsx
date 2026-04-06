"use client";

import {
  FiHome,
  FiFileText,
  FiMail,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { FaCalculator } from "react-icons/fa";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [openCalc, setOpenCalc] = useState(true);

  const itemClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition ${
      active
        ? "bg-indigo-50 text-indigo-700 font-semibold"
        : "text-gray-700 hover:bg-slate-100"
    }`;

  const goTo = (path: string) => router.push(path);

  return (
    <aside className="hidden lg:block w-[280px] bg-white rounded-xl p-5 self-start">
      <ul className="space-y-1 text-[15px]">
        {/* Dashboard */}
        <li
          onClick={() => goTo("/user/dashboard")}
          className={itemClass(pathname === "/user/dashboard")}
        >
          <FiHome />
          Dashboard
        </li>

        {/* Subscription */}
        <li
          onClick={() => goTo("/user/dashboard/subscription")}
          className={itemClass(
            pathname.startsWith("/user/dashboard/subscription"),
          )}
        >
          <FiFileText />
          Subscription
        </li>

        {/* Newsletter */}
        <li
          onClick={() => goTo("/user/dashboard/newsletter")}
          className={itemClass(
            pathname.startsWith("/user/dashboard/newsletter"),
          )}
        >
          <FiMail />
          Newsletter
        </li>

        {/* Premium Calculators */}
        <li
          onClick={() => setOpenCalc(!openCalc)}
          className="flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer text-gray-700 hover:bg-slate-100 transition"
        >
          <div className="flex items-center gap-3">
            <FaCalculator />
            Premium Calculators
          </div>
          {openCalc ? <FiChevronDown /> : <FiChevronUp />}
        </li>

        {!openCalc && (
          <ul className="ml-10 mt-2 space-y-2 text-[14px] text-gray-600">
            <li
              onClick={() => goTo("/user/dashboard/calculators/advanced-sip")}
              className={`cursor-pointer transition ${
                pathname.includes("advanced-sip")
                  ? "text-indigo-600 font-semibold"
                  : "hover:text-indigo-600"
              }`}
            >
              Advanced SIP
            </li>

            <li
              onClick={() =>
                goTo("/user/dashboard/calculators/advanced-stepup")
              }
              className={`cursor-pointer transition ${
                pathname.includes("advanced-stepup")
                  ? "text-indigo-600 font-semibold"
                  : "hover:text-indigo-600"
              }`}
            >
              Advanced Step-Up SIP
            </li>

            <li
              onClick={() => goTo("/user/dashboard/calculators/advanced-goal")}
              className={`cursor-pointer transition ${
                pathname.includes("advanced-goal")
                  ? "text-indigo-600 font-semibold"
                  : "hover:text-indigo-600"
              }`}
            >
              Goal Planner
            </li>

            <li
              onClick={() =>
                goTo("/user/dashboard/calculators/advanced-retirement")
              }
              className={`cursor-pointer transition ${
                pathname.includes("advanced-retirement")
                  ? "text-indigo-600 font-semibold"
                  : "hover:text-indigo-600"
              }`}
            >
              Retirement Planner
            </li>
          </ul>
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;
