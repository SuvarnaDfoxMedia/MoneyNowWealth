

import { useEffect, useState } from "react";
import { ArrowUpIcon, BoxIconLine, GroupIcon } from "../../icons";
import Badge from "../ui/badge/Badge";
import { axiosApi } from "../../api/axios";

type SubscriptionUser = {
  user?: {
    _id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    role?: string;
  };
  user_id?: {
    _id?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    role?: string;
  };
  subscription?: {
    status?: string;
    is_active?: boolean;
    planType?: string;
    plan_type?: string;
    plan_id?: {
      name?: string;
      plan_type?: string;
    };
  };
  currentStatus?: string; // "active" | "none"
  status?: string;
  planType?: string; // "Premium" | "Free" | "none"
  plan_type?: string;
  isPromotional?: boolean;
};

const extractList = (payload: any) => {
  if (!payload || typeof payload !== "object") return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.users)) return payload.users;
  if (Array.isArray(payload.subscriptions)) return payload.subscriptions;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const toCount = (payload: any, fallback: unknown[] = []) => {
  const total = Number(payload?.total ?? payload?.count);
  if (Number.isFinite(total) && total >= 0) return total;
  return fallback.length;
};

const getPlanType = (item: SubscriptionUser) =>
  String(
    item.planType ||
      item.plan_type ||
      item.subscription?.plan_id?.name ||
      item.subscription?.planType ||
      item.subscription?.plan_type ||
      item.subscription?.plan_id?.plan_type ||
      "",
  ).trim().toLowerCase();

const getStatus = (item: SubscriptionUser) =>
  String(
    item.currentStatus ||
      item.status ||
      item.subscription?.status ||
      "",
  )
    .trim()
    .toLowerCase();

export default function EcommerceMetrics() {
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [premiumUsers, setPremiumUsers] = useState<number>(0);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPremium, setLoadingPremium] = useState(true);

  const fetchUserCount = async () => {
    try {
      const response = await axiosApi.get<any>("/auth/admin/users", {
        page: 1,
        limit: 1,
      });
      const users = extractList(response);
      setTotalUsers(toCount(response, users));
    } catch (error) {
      console.error("Error fetching user count", error);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPremiumUsersCount = async () => {
    try {
      const response = await axiosApi.get<any>("/admin/subscriptions", {
        page: 1,
        limit: 5000,
        includeInactive: true,
      });

      const subscriptions = extractList(response) as SubscriptionUser[];
      const premiumCount = subscriptions.filter((item) => {
        const status = getStatus(item);
        const planType = getPlanType(item);
        const isActive =
          item.subscription?.is_active === true ||
          status === "active" ||
          item.currentStatus === "active" ||
          item.status === "active";

        return isActive && planType === "premium";
      }).length;

      setPremiumUsers(premiumCount);
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
