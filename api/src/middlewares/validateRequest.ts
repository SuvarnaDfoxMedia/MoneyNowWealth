// import { Request, Response, NextFunction } from "express";

// // Middleware to validate registration input
// export const validateRegister = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { firstname, lastname, email, password, termsAccepted } = req.body;

//   // Check required fields
//   if (!firstname || !lastname || !email || !password) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   // Validate names (only letters, min 2 chars)
//   const nameRegex = /^[A-Za-z]{2,}$/;
//   if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
//     return res.status(400).json({
//       message:
//         "First and last name must contain only letters and be at least 2 characters long",
//     });
//   }

//   // Validate email
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     return res.status(400).json({ message: "Valid email is required" });
//   }

//   // Terms acceptance
//   if (!termsAccepted) {
//     return res
//       .status(400)
//       .json({ message: "You must accept the terms and conditions" });
//   }

//   // Validate password (min 8 chars, uppercase, lowercase, number)
//   const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       message:
//         "Password must be at least 8 characters, include uppercase, lowercase, and a number",
//     });
//   }

//   // All validations passed
//   next();
// };


import { Request, Response, NextFunction } from "express";

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { firstname, lastname, email, password, termsAccepted } = req.body;

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const nameRegex = /^[A-Za-z]{2,}$/;
  if (!nameRegex.test(firstname) || !nameRegex.test(lastname)) {
    return res.status(400).json({
      message:
        "First and last name must contain only letters and be at least 2 characters long",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  if (!termsAccepted) {
    return res
      .status(400)
      .json({ message: "You must accept the terms and conditions" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters, include uppercase, lowercase, and a number",
    });
  }

  next();
};
