"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useAdminCrud } from "../../hooks/useAdminCrud";

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  created_at: string;
}

export default function LatestUsersCard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { extractList: users, isLoading } = useAdminCrud<User>({
    module: "admin/users",
    adminModule: true,
    role: "",
    page: 1,
    limit: 5, //  Latest 5 users
    searchValue: "",
    listKey: "users",
    sortField: "created_at",
    sortOrder: "desc",
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Latest Users
        </h3>

        <div className="relative inline-block">
          <button onClick={() => setIsOpen(!isOpen)}>
            <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={() => navigate("/admin/customers")}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700"
            >
              View More
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-gray-500">Loading users...</p>}

        {!isLoading && users?.length === 0 && (
          <p className="text-sm text-gray-500">No users found</p>
        )}

        {users?.map((user) => (
          <div
            key={user._id}
            className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-medium text-gray-800">
                {user.firstname} {user.lastname}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <span className="text-xs text-gray-400">
              {new Date(user.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
