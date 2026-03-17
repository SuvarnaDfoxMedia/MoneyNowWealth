import { Request, Response, NextFunction } from "express";

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { firstname, fullname, lastname, email, password, mobile, termsAccepted } =
    req.body;
  const incomingName = String(fullname ?? firstname ?? "").trim();

  if (!incomingName || !email || !password || !mobile) {
    return res.status(400).json({
      success: false,
      message: "Firstname, email, password and mobile are required",
      data: null,
    });
  }

  const nameRegex = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;
  if (!nameRegex.test(incomingName)) {
    return res.status(400).json({
      success: false,
      message:
        "Name must contain letters only",
      data: null,
    });
  }

  if (lastname && !nameRegex.test(String(lastname).trim())) {
    return res.status(400).json({
      success: false,
      message: "Last name must contain letters only",
      data: null,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Valid email is required",
      data: null,
    });
  }

  if (termsAccepted !== true) {
    return res
      .status(400)
      .json({
        success: false,
        message: "You must accept the terms and conditions",
        data: null,
      });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters, include uppercase, lowercase, and a number",
      data: null,
    });
  }

  next();
};
