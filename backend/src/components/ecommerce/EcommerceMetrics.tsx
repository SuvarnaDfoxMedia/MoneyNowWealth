// import { useEffect, useState } from "react";
// import {
//   ArrowDownIcon,
//   ArrowUpIcon,
//   BoxIconLine,
//   GroupIcon,
// } from "../../icons";
// import Badge from "../ui/badge/Badge";

// export default function EcommerceMetrics() {
//   const [totalUsers, setTotalUsers] = useState<number>(0);
//   const [loading, setLoading] = useState(true);
//   const backendUrl = import.meta.env.VITE_API_BASE;
//   // Fetch user count from API
//   const fetchUserCount = async () => {
//     try {
//       const response = await fetch(`${backendUrl}/auth/users`);
//       const data = await response.json();

//       if (data.success) {
//         setTotalUsers(data.total); // <-- API gives total count
//       }
//     } catch (error) {
//       console.error("Error fetching user count", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUserCount();
//   }, []);

//   return (
//     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
//       {/* Customers */}
//       <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
//         <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
//           <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
//         </div>

//         <div className="flex items-end justify-between mt-5">
//           <div>
//             <span className="text-sm text-gray-500 dark:text-gray-400">
//               Customers
//             </span>

//             <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
//               {loading ? "Loading..." : totalUsers}
//             </h4>
//           </div>

//           <Badge color="success">
//             <ArrowUpIcon />
//             11.01%
//           </Badge>
//         </div>
//       </div>

//       {/* Orders (Static for now) */}
//       <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
//         <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
//           <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
//         </div>

//         <div className="flex items-end justify-between mt-5">
//           <div>
//             <span className="text-sm text-gray-500 dark:text-gray-400">
//               Orders
//             </span>
//             <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
//               5,359
//             </h4>
//           </div>

//           <Badge color="error">
//             <ArrowDownIcon />
//             9.05%
//           </Badge>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { ArrowUpIcon, BoxIconLine, GroupIcon } from "../../icons";
import Badge from "../ui/badge/Badge";

type SubscriptionUser = {
  user: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
  };
  subscription: any;
  paymentHistory: any[];
  currentStatus: string; // "active" | "none"
  planType: string; // "Premium" | "Free" | "none"
  isPromotional: boolean;
};

export default function EcommerceMetrics() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [premiumUsers, setPremiumUsers] = useState<number>(0);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPremium, setLoadingPremium] = useState(true);

  const backendUrl = import.meta.env.VITE_API_BASE;

  //  Fetch user count (your existing users API)
  const fetchUserCount = async () => {
    try {
      const response = await fetch(`${backendUrl}/auth/users`);
      const data = await response.json();

      if (data?.success) {
        setTotalUsers(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching user count", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  //  Fetch Premium users count from: /api/admin/subscriptions
  const fetchPremiumUsersCount = async () => {
    try {
      const response = await fetch(`${backendUrl}/admin/subscriptions`, {
        credentials: "include", //  IMPORTANT if admin route is protected
      });

      const result = await response.json();

      if (result?.success && Array.isArray(result?.data)) {
        const premiumCount = result.data.filter((item: SubscriptionUser) => {
          return item.currentStatus === "active" && item.planType === "Premium";
        }).length;

        setPremiumUsers(premiumCount);
      } else {
        setPremiumUsers(0);
      }
    } catch (error) {
      console.error("Error fetching premium users count", error);
      setPremiumUsers(0);
    } finally {
      setLoadingPremium(false);
    }
  };

  useEffect(() => {
    fetchUserCount();
    fetchPremiumUsersCount();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Customers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Customers
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loadingUsers ? "Loading..." : totalUsers}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            Live
          </Badge>
        </div>
      </div>

      {/* Premium Members */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Premium Members
            </span>

            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {loadingPremium ? "Loading..." : premiumUsers}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            Active
          </Badge>
        </div>
      </div>
    </div>
  );
}
