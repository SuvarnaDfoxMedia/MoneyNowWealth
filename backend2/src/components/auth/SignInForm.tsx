



// import { useState, FormEvent, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
// import Label from "../form/Label";
// import Input from "../form/input/InputField";
// import Button from "../ui/button/Button";
// import { useAuth } from "../../context/AuthContext";

// interface Errors {
//   email?: string;
//   password?: string;
// }

// export default function SignInForm() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<Errors>({});
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const { login, user } = useAuth();

//   const validateFields = (): boolean => {
//     const newErrors: Errors = {};
//     if (!email.trim()) newErrors.email = "Email is required.";
//     else if (!/^\S+@\S+\.\S+$/.test(email))
//       newErrors.email = "Please enter a valid email address.";

//     if (!password.trim()) newErrors.password = "Password is required.";
//     else if (password.length < 8)
//       newErrors.password = "Password must be at least 8 characters long.";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setErrors({});
//     if (!validateFields()) return;

//     setLoading(true);
//     try {
//       await login(email, password);
//     } catch (err: any) {
//       setErrors({ password: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       const role = user.role?.toLowerCase();
//       if (role === "admin" || role === "editor")
//         navigate(`/${role}/dashboard`, { replace: true });
//       else navigate("/userdashboard", { replace: true });
//     }
//   }, [user, navigate]);

//   return (
//     <div className="flex flex-col md:flex-row min-h-screen">
//       {/* Left Side Image - 60% */}
//       <div className="md:w-[60%] w-full h-64 md:h-auto bg-gray-100">
//        <img
//   src="../../../public/images/banner/banner-test.jpg"
//   alt="Sign In Illustration"
//   className="object-cover w-full h-full"
// />

//       </div>

//       {/* Right Side Form - 40% */}
//       <div className="flex flex-col items-center justify-center w-full md:w-[40%] pt-20 pb-20 space-y-8 px-6 bg-white dark:bg-gray-900">
//            <img
//   src="../../../public/images/banner/logo.png"
//   alt="Sign In Illustration"
//   className="object-contain w-[260px] h-auto"
// />

       

//         <div className="w-full max-w-md">
//           <div className="flex flex-col justify-center w-full mx-auto">
//             <div className="mb-5 sm:mb-8">

              

//               <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
//                 Sign In
//               </h1>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 Enter your email and password to sign in!
//               </p>
//             </div>

//             <form onSubmit={handleLogin} noValidate>
//               <div className="space-y-6">
//                 {/* Email */}
//                 <div>
//                   <Label>
//                     Email <span className="text-error-500">*</span>
//                   </Label>
//                   <Input
//                     placeholder="info@gmail.com"
//                     type="text"
//                     value={email}
//                     onChange={(e) => {
//                       setEmail(e.target.value);
//                       if (errors.email)
//                         setErrors({ ...errors, email: undefined });
//                     }}
//                     className={
//                       errors.email ? "border-red-500 ring-1 ring-red-500" : ""
//                     }
//                     disabled={loading}
//                   />
//                   {errors.email && (
//                     <p className="text-red-500 text-sm mt-1">{errors.email}</p>
//                   )}
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <Label>
//                     Password <span className="text-error-500">*</span>
//                   </Label>
//                   <div className="relative">
//                     <Input
//                       placeholder="Enter your password"
//                       type={showPassword ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => {
//                         setPassword(e.target.value);
//                         if (errors.password)
//                           setErrors({ ...errors, password: undefined });
//                       }}
//                       className={
//                         errors.password ? "border-red-500 ring-1 ring-red-500" : ""
//                       }
//                       disabled={loading}
//                     />
//                     <span
//                       onClick={() => setShowPassword(!showPassword)}
//                       className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
//                     >
//                       {showPassword ? (
//                         <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                       ) : (
//                         <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
//                       )}
//                     </span>
//                   </div>
//                   {errors.password && (
//                     <p className="text-red-500 text-sm mt-1">{errors.password}</p>
//                   )}
//                 </div>

//                 <div>
//                   <Button
//                     className="w-full"
//                     size="sm"
//                     type="submit"
//                     disabled={loading}
//                   >
//                     {loading ? "Signing in..." : "Sign in"}
//                   </Button>
//                 </div>
//               </div>
//             </form>

//             <div className="mt-5 flex justify-between items-center text-sm">
//               <Link
//                 to="/forgot-password"
//                 className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
//               >
//                 Forgot password?
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

interface Errors {
  email?: string;
  password?: string;
}

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  const validateFields = (): boolean => {
    const newErrors: Errors = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      newErrors.email = "Please enter a valid email address.";

    if (!password.trim()) newErrors.password = "Password is required.";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters long.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    if (!validateFields()) return;

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrors({ password: err.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const role = user.role?.toLowerCase();
    const currentPath = window.location.pathname;

    if ((role === "admin" || role === "editor") && !currentPath.includes(`${role}/dashboard`)) {
      navigate(`/${role}/dashboard`, { replace: true });
    } else if (role === "user" && currentPath !== "/userdashboard") {
      navigate("/userdashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Left Side */}
      <div className="md:w-[60%] w-full h-64 md:h-auto bg-gray-100">
        <img
          src="/images/banner/banner-test.jpg"
          alt="Sign In Illustration"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Right Side */}
      <div className="flex flex-col items-center justify-center w-full md:w-[40%] pt-20 pb-20 space-y-8 px-6 bg-white dark:bg-gray-900">
        <img
          src="/images/banner/logo.png"
          alt="Logo"
          className="object-contain w-[260px] h-auto"
        />

        <div className="w-full max-w-md">
          <div className="flex flex-col justify-center w-full mx-auto">
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign In
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enter your email and password to sign in!
              </p>
            </div>

            <form onSubmit={handleLogin} noValidate>
              <div className="space-y-6">
                <div>
                  <Label>Email <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="info@gmail.com"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={errors.email ? "border-red-500 ring-1 ring-red-500" : ""}
                    disabled={loading}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <Label>Password <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      className={errors.password ? "border-red-500 ring-1 ring-red-500" : ""}
                      disabled={loading}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5 flex justify-between items-center text-sm">
              <Link
                to="/forgot-password"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
