import { Request, Response, NextFunction } from "express";

export const validateRegister = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    firstname,
    fullname,
    lastname,
    email,
    password,
    mobile,
    termsAccepted,
  } = req.body;
  const incomingName = String(fullname ?? firstname ?? "").trim();
  const incomingEmail = String(email ?? "").trim().toLowerCase();
  const incomingPassword = String(password ?? "");
  const incomingMobile = String(mobile ?? "").trim().replace(/\s+/g, "");

  if (!incomingName || !incomingEmail || !incomingPassword || !incomingMobile) {
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
  if (!emailRegex.test(incomingEmail)) {
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

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,128}$/;
  if (!passwordRegex.test(incomingPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be 8+ chars, include 1 uppercase, 1 number & 1 special character",
      data: null,
    });
  }

  next();
};
