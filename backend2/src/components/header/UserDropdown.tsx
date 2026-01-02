

// import { useState, useEffect } from "react";
// import { DropdownItem } from "../ui/dropdown/DropdownItem";
// import { Dropdown } from "../ui/dropdown/Dropdown";
// import { useNavigate } from "react-router";
// import { toast } from "react-hot-toast";
// import { useAuth } from "../../context/AuthContext"; // <-- use this

// export default function UserDropdown() {
//   const [isOpen, setIsOpen] = useState(false);
//   const { user,  logout } = useAuth(); // <-- use useAuth
//   const [imageVersion, setImageVersion] = useState(Date.now());
//   const navigate = useNavigate();

//   const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

//   const toggleDropdown = () => setIsOpen(!isOpen);
//   const closeDropdown = () => setIsOpen(false);

//   const handleLogout = async () => {
//     closeDropdown();
//     try {
//       await logout(); // <-- use logout from AuthContext
//       toast.success("Logged out successfully!");
//       navigate("/signin");
//     } catch (err: any) {
//       toast.error(err.response?.data?.message || "Logout failed");
//     }
//   };

//   useEffect(() => {
//     if (user?.profileImage) setImageVersion(Date.now());
//   }, [user?.profileImage]);

//   const firstName = user?.firstname ?? (user?.name ? user.name.split(" ")[0] : "Admin");
//   const lastName = user?.lastname ?? (user?.name ? user.name.split(" ").slice(1).join(" ") : "");
//   const fullName = user ? `${firstName} ${lastName}`.trim() : "Admin";

//   const profileImage = user?.profileImage
//     ? `${backendUrl}${user.profileImage}?v=${imageVersion}`
//     : "/images/user/owner.jpg";

//   const role = user?.role || "user";

//   // Role-aware navigation
//   const handleNavigation = (page: "profile" | "change-password") => {
//     closeDropdown();
//     if (role === "user") {
//       navigate(`/user/${page}`);
//     } else {
//       navigate(`/${role}/${page}`);
//     }
//   };

//   return (
//     <div className="relative">
//       <button onClick={toggleDropdown} className="flex items-center text-gray-700">
//         <span className="mr-3 w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
//           <img src={profileImage} alt="User" className="w-full h-full object-cover" />
//         </span>
//         <span>{firstName}</span>
//       </button>

//       <Dropdown isOpen={isOpen} onClose={closeDropdown} className="absolute right-0 mt-2 w-64 p-3">
//         <div>
//           <span className="font-medium">{fullName}</span>
//           <span className="block text-sm text-gray-500">{user?.email ?? "email@example.com"}</span>
//         </div>

//         <ul className="flex flex-col gap-1 pt-4 pb-3 border-b">
//           <li>
//             <DropdownItem tag="button" onItemClick={() => handleNavigation("profile")}>
//               Edit Profile
//             </DropdownItem>
//           </li>
//           <li>
//             <DropdownItem tag="button" onItemClick={() => handleNavigation("change-password")}>
//               Change Password
//             </DropdownItem>
//           </li>
//         </ul>

//         <DropdownItem tag="button" onItemClick={handleLogout}>
//           Sign out
//         </DropdownItem>
//       </Dropdown>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const [imageVersion, setImageVersion] = useState(Date.now());
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleLogout = async () => {
    closeDropdown();
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/signin");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  };

  useEffect(() => {
    if (user?.profileImage) setImageVersion(Date.now());
  }, [user?.profileImage]);

  // -----------------------------
  // ✔ FIX: Only use firstname + lastname
  // -----------------------------
  const firstName = user?.firstname || "Admin";
  const lastName = user?.lastname || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const profileImage = user?.profileImage
    ? `${backendUrl}${user.profileImage}?v=${imageVersion}`
    : "/images/user/owner.jpg";

  const role = user?.role || "user";

  const handleNavigation = (page: "profile" | "change-password") => {
    closeDropdown();
    navigate(`/${role}/${page}`);
  };

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="flex items-center text-gray-700">
        <span className="mr-3 w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
          <img src={profileImage} alt="User" className="w-full h-full object-cover" />
        </span>
        <span>{firstName}</span>
      </button>

      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="absolute right-0 mt-2 w-64 p-3">
        <div>
          <span className="font-medium">{fullName}</span>
          <span className="block text-sm text-gray-500">{user?.email ?? "email@example.com"}</span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b">
          <li>
            <DropdownItem tag="button" onItemClick={() => handleNavigation("profile")}>
              Edit Profile
            </DropdownItem>
          </li>
          <li>
            <DropdownItem tag="button" onItemClick={() => handleNavigation("change-password")}>
              Change Password
            </DropdownItem>
          </li>
        </ul>

        <DropdownItem tag="button" onItemClick={handleLogout}>
          Sign out
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
