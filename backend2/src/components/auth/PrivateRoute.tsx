// import React from "react";
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../context/AuthContext";

// interface PrivateRouteProps {
//   roles: string[];
//   children: JSX.Element;
// }

// const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles, children }) => {
//   const { user, loading } = useAuth();

//   if (loading) return <p className="p-5 text-center">Loading...</p>;

//   if (!user) return <Navigate to="/signin" replace />;

//   if (!roles.includes(user.role)) return <Navigate to="/" replace />;

//   return children;
// };

// export default PrivateRoute;

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PrivateRouteProps {
  roles: string[];
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles, children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-5 text-center">Loading...</p>;
  if (!user) return <Navigate to="/signin" replace />;

  const role = user.role;
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default PrivateRoute;
