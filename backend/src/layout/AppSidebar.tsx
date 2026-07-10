import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAuth } from "../context/useAuth";
import { getMfApiNavItem } from "../modules/mf-api";
import {
  formatUnreadCount,
  type EnquiryModule,
  useEnquiryUnread,
} from "../hooks/useEnquiryUnread";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    roles?: string[];
    enquiryModule?: EnquiryModule;
  }[];
  roles?: string[];
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || "";
  const { unread } = useEnquiryUnread();
  const unreadBadge = formatUnreadCount(unread?.total ?? 0);

  // ================================
  // ================================
  const allNavItems: NavItem[] = useMemo(
    () => [
      {
        icon: <FiGrid />,
        name: "Dashboard",
        path: `/${role}/dashboard`,
        roles: ["admin", "editor", "user"],
      },
      {
        name: "Blog Contents",
        icon: <FiEdit3 />,
        roles: ["admin", "editor"],
        subItems: [
          {
            name: "Cluster",
            path: `/${role}/cluster`,
            roles: ["admin", "editor"],
          },
          {
            name: "Topics",
            path: `/${role}/topic`,
            roles: ["admin", "editor"],
          },
          {
            name: "Articles",
            path: `/${role}/article`,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        name: "CMS Pages",
        icon: <FiFileText />,
        path: `/${role}/cmspages`,
        roles: ["admin"],
      },
      {
        name: "Manage SEO",
        icon: <FiSettings />,
        path: `/${role}/seo`,
        roles: ["admin"],
      },
      {
        name: "Subscription Plan",
        icon: <FiFile />,
        path: `/${role}/subscriptionplan`,
        roles: ["admin"],
      },
      {
        name: "Testimonials",
        icon: <FiMessageSquare />,
        path: `/${role}/testimonials`,
        roles: ["admin", "editor"],
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
        path: `/${role}/customers`,
        roles: ["admin"],
      },
      {
        name: "Newsletter",
        icon: <FiMail />,
        roles: ["admin"],
        subItems: [
          {
            name: "Newsletter Subscribers",
            path: `/${role}/newsletter`,
            roles: ["admin", "editor"],
          },
          {
            name: "Newsletter Listing",
            path: `/${role}/list-newsletter`,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        name: "Mutual Funds (Manual)",
        icon: <FiFileText />,
        roles: ["admin", "editor"],
        subItems: [
          {
            name: "Main Category",
            path: `/${role}/mf/main-categories`,
            roles: ["admin", "editor"],
          },
          {
            name: "Sub Category",
            path: `/${role}/mf/categories`,
            roles: ["admin", "editor"],
          },
          {
            name: "AMCs",
            path: `/${role}/mf/amcs`,
            roles: ["admin", "editor"],
          },
          {
            name: "Fund",
            path: `/${role}/mf/funds`,
            roles: ["admin", "editor"],
          },
          {
            name: "Top Holdings",
            path: `/${role}/mf/top-holdings`,
            roles: ["admin", "editor"],
          },
          {
            name: "NFO",
            path: `/${role}/mf/nfo`,
            roles: ["admin", "editor"],
          },
          {
            name: "Index Snapshots",
            path: `/${role}/mf/index-snapshots`,
            roles: ["admin", "editor"],
          },
          // MF import entry intentionally disabled
        ],
      },
      getMfApiNavItem(role || "admin"),
      {
        name: "NAV",
        icon: <FiFileText />,
        roles: ["admin", "editor"],
        subItems: [
          {
            name: "Dashboard",
            path: `/${role}/nav/dashboard`,
            roles: ["admin", "editor"],
          },
          {
            name: "History",
            path: `/${role}/nav/history`,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        name: "Benchmark",
        icon: <FiFileText />,
        roles: ["admin", "editor"],
        subItems: [
          {
            name: "Master",
            path: `/${role}/benchmark/master`,
            roles: ["admin", "editor"],
          },
          {
            name: "Returns",
            path: `/${role}/benchmark/returns`,
            roles: ["admin", "editor"],
          },
          {
            name: "View Comparison",
            path: `/${role}/benchmark/view-comparison`,
            roles: ["admin", "editor"],
          },
        ],
      },
      {
        name: "Enquiries",
        icon: <FiMessageSquare />,
        roles: ["admin"],
        subItems: [
          {
            name: "Contact Enquiry",
            path: `/${role}/contact-enquiry`,
            roles: ["admin"],
            enquiryModule: "contact-enquiries",
          },
          {
            name: "Partnership Enquiry",
            path: `/${role}/partnership-enquiry`,
            roles: ["admin"],
            enquiryModule: "partner-enquiries",
          },
          {
            name: "One Crore Journey",
            path: `/${role}/one-crore-journey-enquiry`,
            roles: ["admin"],
            enquiryModule: "one-crore-journey-enquiries",
          },
          {
            name: "Who We Work With",
            path: `/${role}/who-we-work-with-enquiry`,
            roles: ["admin"],
            enquiryModule: "who-we-work-with-enquiries",
          },
          {
            name: "Financial Wellness",
            path: `/${role}/financial-wellness-enquiry`,
            roles: ["admin"],
            enquiryModule: "financial-wellness-enquiries",
          },
          {
            name: "Start Investing",
            path: `/${role}/start-investing-enquiry`,
            roles: ["admin"],
            enquiryModule: "start-investing-enquiries",
          },
          {
            name: "Portfolio Review",
            path: `/${role}/portfolio-review-enquiry`,
            roles: ["admin"],
            enquiryModule: "portfolio-review-enquiries",
          },
        ],
      },
      {
        name: "Settings",
        icon: <FiSettings />,
        roles: ["admin"],
        subItems: [],
      },
    ],
    [role],
  );

  // Filter items based on user role
  const navItems: NavItem[] = useMemo(
    () =>
      allNavItems
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => ({
          ...item,
          subItems: item.subItems?.filter(
            (sub) => !sub.roles || sub.roles.includes(role),
          ),
        })),
    [allNavItems, role],
  );

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [manuallyOpened, setManuallyOpened] = useState<number | null>(null);
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      // Extract base path from navigation path (remove query parameters)
      const basePath = path.split("?")[0];
      return (
        location.pathname === basePath ||
        location.pathname.startsWith(basePath + "/")
      );
    },
    [location.pathname],
  );

  const isSubmenuActive = useCallback(
    (subItems: NavItem["subItems"]) => {
      if (!subItems) return false;
      return subItems.some((subItem) => isActive(subItem.path));
    },
    [isActive],
  );

  // Auto-open submenu if any of its sub-items are active, close otherwise
  useEffect(() => {
    const activeSubmenuIndex = navItems.findIndex(
      (nav) => nav.subItems && isSubmenuActive(nav.subItems),
    );

    if (manuallyOpened === null) {
      const nextOpen = activeSubmenuIndex !== -1 ? activeSubmenuIndex : null;
      if (openSubmenu !== nextOpen) {
        setOpenSubmenu(nextOpen);
      }
    }
  }, [navItems, isSubmenuActive, openSubmenu, manuallyOpened]);

  const toggleSubmenu = (index: number) => {
    const newState = openSubmenu === index ? null : index;
    setOpenSubmenu(newState);
    setManuallyOpened(newState); // Track that this was manually opened
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
                  openSubmenu === index || isSubmenuActive(nav.subItems)
                    ? "menu-item-active"
                    : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    openSubmenu === index || isSubmenuActive(nav.subItems)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) &&
                  nav.name === "Enquiries" &&
                  unreadBadge && (
                    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#043f79] px-2 py-0.5 text-xs font-semibold text-white">
                      {unreadBadge}
                    </span>
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
                ref={(el) => {
                  subMenuRefs.current[index] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu === index
                      ? `${subMenuRefs.current[index]?.scrollHeight}px`
                      : "0px",
                }}
              >
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        className={`menu-dropdown-item flex items-center justify-between gap-3 ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        <span>{subItem.name}</span>
                        {subItem.enquiryModule &&
                          formatUnreadCount(
                            unread?.counts?.[subItem.enquiryModule] ?? 0,
                          ) && (
                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#043f79] px-2 py-0.5 text-xs font-semibold text-white">
                              {formatUnreadCount(
                                unread?.counts?.[subItem.enquiryModule] ?? 0,
                              )}
                            </span>
                          )}
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
                onClick={() => {
                  setOpenSubmenu(null);
                  setManuallyOpened(null);
                }}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } cursor-pointer ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
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
            {isExpanded || isHovered || isMobileOpen ? (
              "Menu"
            ) : (
              <BsThreeDots className="size-6" />
            )}
          </h2>
          {renderMenuItems(navItems)}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
