

import { useCallback, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiChevronDown,
  FiSettings,
  FiEdit3,
  FiGrid,
  FiFileText,
  FiUsers,
  FiMessageSquare,
  FiFile,
  FiMail,
} from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; roles?: string[] }[];
  roles?: string[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "";

  // ================================
  // ================================
  const allNavItems: NavItem[] = [
    {
      icon: <FiGrid />,
      name: "Dashboard",
      path: `/${role}/dashboard`,
      roles: ["admin", "editor", "user"],
    },
    {
      name: "Blog Contents",
      icon: <FiEdit3 />,
      roles: ["admin"],
      subItems: [
        { name: "Cluster", path: `/${role}/cluster`, roles: ["admin", "editor"] },
        { name: "Topics", path: `/${role}/topic`, roles: ["admin", "editor"] },
        { name: "Articles", path: `/${role}/article`, roles: ["admin", "editor"] },
      ],
    },
    {
      name: "CMS Pages",
      icon: <FiFileText />,
      path: `/${role}/cmspages`,
      roles: ["admin"],
    },
    {
      name: "Subscription Plan",
      icon: <FiFile />,
      path: `/${role}/subscriptionplan`,
      roles: ["admin"],
    },
    {
      name: "User Subscription",
      icon: <FiUsers />,
      path: `/${role}/user-subscription`,
      roles: ["admin"],
    },
        {
      name: "Customer",
      icon: <FiUsers />,
      path: `/customers`,
      roles: ["admin"],
    },
    {
      name: "Newsletter",
      icon: <FiMail />,
      path: `/${role}/newsletter`,
      roles: ["admin"],
    },
     
    {
      name: "Contact Enquiry",
      icon: <FiMessageSquare />,
      path: `/${role}/contactenquiry`,
      roles: ["admin"],
    },
    {
      name: "Settings",
      icon: <FiSettings />,
      roles: ["admin"],
      subItems: [
        // { name: "Cluster", path: `/${role}/cluster`, roles: ["admin", "editor"] },
      ],
    },
  ];

  // Filter items based on user role
  const navItems: NavItem[] = allNavItems
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({
      ...item,
      subItems: item.subItems?.filter((sub) => !sub.roles || sub.roles.includes(role)),
    }));

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path || location.pathname.startsWith(path + "/"),
    [location.pathname]
  );

  const toggleSubmenu = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => toggleSubmenu(index)}
                className={`menu-item group ${
                  openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu === index
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <FiChevronDown
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                      openSubmenu === index ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                )}
              </button>
              <div
            ref={(el) => { subMenuRefs.current[index] = el; }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: openSubmenu === index
                    ? `${subMenuRefs.current[index]?.scrollHeight}px`
                    : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              className="dark:hidden"
              src="/images/logo/logo.png"
              alt="Logo"
              width={150}
              height={40}
            />
          ) : (
            <img
              src="/images/logo/moneynowwealth-icon.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <BsThreeDots className="size-6" />}
          </h2>
          {renderMenuItems(navItems)}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
