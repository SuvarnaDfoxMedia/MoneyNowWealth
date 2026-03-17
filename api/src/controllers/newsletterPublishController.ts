// // import type { Request, Response } from "express";
// // import { newsletterPublishService } from "../services/newsletterPublishService";
// // import multer from "multer";
// // import path from "path";
// // import fs from "fs";

// // // Define Request interface with file property
// // declare global {
// //   namespace Express {
// //     interface Request {
// //       file?: Express.Multer.File;
// //     }
// //   }
// // }

// // /* ============================================
// //    Helper: Setup newsletter upload directory
// // ============================================ */
// // const newsletterUploadDir = path.join(process.cwd(), "uploads/newsletters");
// // if (!fs.existsSync(newsletterUploadDir)) {
// //   fs.mkdirSync(newsletterUploadDir, { recursive: true });
// // }

// // /* ============================================
// //    Multer configuration for ANY file uploads (not just PDF)
// // ============================================ */
// // const newsletterStorage = multer.diskStorage({
// //   destination: (_req, _file, cb) => {
// //     cb(null, newsletterUploadDir);
// //   },
// //   filename: (_req, file, cb) => {
// //     const uniqueName = `newsletter-${Date.now()}-${Math.round(
// //       Math.random() * 1e9,
// //     )}${path.extname(file.originalname)}`;
// //     cb(null, uniqueName);
// //   },
// // });

// // const newsletterUpload = multer({
// //   storage: newsletterStorage,
// //   limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit (increased for any file type)
// // });

// // /* ============================================
// //    MIDDLEWARE: Upload newsletter file (any type)
// // ============================================ */
// // export const uploadNewsletterFile = newsletterUpload.single("pdf_file");

// // /* ============================================
// //    Helper: Parse FormData fields
// // ============================================ */
// // const parseFormData = (req: Request) => {
// //   // If content-type is multipart/form-data, body fields are already parsed
// //   // We need to handle both JSON and FormData
// //   const body = req.body;

// //   // Convert string dates to Date objects
// //   if (body.publish_date && typeof body.publish_date === "string") {
// //     body.publish_date = new Date(body.publish_date);
// //   }

// //   return body;
// // };

// // /* ============================================
// //    CONTROLLER FUNCTIONS (UPDATED)
// // ============================================ */

// // /* ---------------------------------------------------
// //    1. Get all newsletter publications
// // --------------------------------------------------- */
// // export const getNewsletterPublications = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const {
// //       page = 1,
// //       limit = 10,
// //       search = "",
// //       status,
// //       includeDeleted = "false",
// //       sortField = "publish_date",
// //       sortOrder = "desc",
// //     } = req.query;

// //     const result = await newsletterPublishService.getAll({
// //       page: Number(page),
// //       limit: Number(limit),
// //       search: String(search),
// //       status: status as any,
// //       includeDeleted: includeDeleted === "true",
// //       sortField: String(sortField),
// //       sortOrder: sortOrder as "asc" | "desc",
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       ...result,
// //     });
// //   } catch (error: any) {
// //     console.error("Get newsletter publications error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to fetch newsletter publications",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    2. Get single newsletter publication by ID
// // --------------------------------------------------- */
// // export const getNewsletterPublicationById = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const { id } = req.params;

// //     const newsletter = await newsletterPublishService.getById(id);

// //     if (!newsletter) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Newsletter publication not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Get newsletter publication error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to fetch newsletter publication",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    3. Create new newsletter publication (ALLOW ANY FILE TYPE)
// // --------------------------------------------------- */
// // export const createNewsletterPublication = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const { title, description, publish_date, status } = req.body;

// //     // Validate required fields
// //     if (!title || !publish_date) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Title and publish date are required",
// //       });
// //     }

// //     if (!req.file) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "File is required",
// //       });
// //     }

// //     // Prepare newsletter data
// //     const newsletterData: any = {
// //       title: title.trim(),
// //       description: description?.trim() || "",
// //       publish_date: new Date(publish_date),
// //       pdf_file: req.file.filename,
// //       file_size: req.file.size,
// //     };

// //     // Add status if provided
// //     if (status && ["draft", "scheduled", "published"].includes(status)) {
// //       newsletterData.status = status;
// //     }

// //     // Create newsletter publication
// //     const newsletter = await newsletterPublishService.create(newsletterData);

// //     return res.status(201).json({
// //       success: true,
// //       message: "Newsletter publication created successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Create newsletter publication error:", error);

// //     // Clean up uploaded file if creation fails
// //     if (req.file) {
// //       const filePath = path.join(newsletterUploadDir, req.file.filename);
// //       if (fs.existsSync(filePath)) {
// //         fs.unlinkSync(filePath);
// //       }
// //     }

// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to create newsletter publication",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    4. Update newsletter publication (UPDATED for FormData)
// // --------------------------------------------------- */
// // export const updateNewsletterPublication = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const { id } = req.params;

// //     // Parse form data (handles both JSON and multipart/form-data)
// //     const updateData = parseFormData(req);

// //     // If a new file is uploaded, add it to update data
// //     if (req.file) {
// //       updateData.pdf_file = req.file.filename;
// //       updateData.file_size = req.file.size;
// //     }

// //     const newsletter = await newsletterPublishService.update(id, updateData);

// //     if (!newsletter) {
// //       // Clean up uploaded file if update fails
// //       if (req.file) {
// //         const filePath = path.join(newsletterUploadDir, req.file.filename);
// //         if (fs.existsSync(filePath)) {
// //           fs.unlinkSync(filePath);
// //         }
// //       }

// //       return res.status(404).json({
// //         success: false,
// //         message: "Newsletter publication not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: "Newsletter publication updated successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Update newsletter publication error:", error);

// //     // Clean up uploaded file if update fails
// //     if (req.file) {
// //       const filePath = path.join(newsletterUploadDir, req.file.filename);
// //       if (fs.existsSync(filePath)) {
// //         fs.unlinkSync(filePath);
// //       }
// //     }

// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to update newsletter publication",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    5. Send newsletter emails to subscribers
// // --------------------------------------------------- */
// // export const sendNewsletterEmails = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;

// //     const result = await newsletterPublishService.sendNewsletterEmails(id);

// //     return res.status(200).json({
// //       success: true,
// //       ...result,
// //     });
// //   } catch (error: any) {
// //     console.error("Send newsletter emails error:", error);
// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to send newsletter emails",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    6. Publish newsletter immediately
// // --------------------------------------------------- */
// // export const publishNewsletterNow = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;

// //     const newsletter = await newsletterPublishService.publishNow(id);

// //     return res.status(200).json({
// //       success: true,
// //       message: "Newsletter published successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Publish newsletter error:", error);
// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to publish newsletter",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    7. Schedule newsletter for future date
// // --------------------------------------------------- */
// // export const scheduleNewsletter = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const { publish_date } = req.body;

// //     if (!publish_date) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Publish date is required for scheduling",
// //       });
// //     }

// //     const newsletter = await newsletterPublishService.schedule(
// //       id,
// //       new Date(publish_date),
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       message: "Newsletter scheduled successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Schedule newsletter error:", error);
// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to schedule newsletter",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    8. Soft delete newsletter publication
// // --------------------------------------------------- */
// // export const deleteNewsletterPublication = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const { id } = req.params;

// //     const newsletter = await newsletterPublishService.softDelete(id);

// //     return res.status(200).json({
// //       success: true,
// //       message: "Newsletter publication deleted successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Delete newsletter publication error:", error);
// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to delete newsletter publication",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    9. Restore soft-deleted newsletter
// // --------------------------------------------------- */
// // export const restoreNewsletterPublication = async (
// //   req: Request,
// //   res: Response,
// // ) => {
// //   try {
// //     const { id } = req.params;

// //     const newsletter = await newsletterPublishService.restore(id);

// //     return res.status(200).json({
// //       success: true,
// //       message: "Newsletter publication restored successfully",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Restore newsletter publication error:", error);
// //     return res.status(400).json({
// //       success: false,
// //       message: error.message || "Failed to restore newsletter publication",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    10. Upload file only (any file type allowed)
// // --------------------------------------------------- */
// // export const uploadNewsletterFileOnly = async (req: Request, res: Response) => {
// //   try {
// //     if (!req.file) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "No file uploaded",
// //       });
// //     }

// //     const fileInfo = await newsletterPublishService.uploadFile(req.file);

// //     return res.status(200).json({
// //       success: true,
// //       message: "File uploaded successfully",
// //       file: fileInfo,
// //     });
// //   } catch (error: any) {
// //     console.error("Upload file error:", error);

// //     // Clean up uploaded file if error
// //     if (req.file) {
// //       const filePath = path.join(newsletterUploadDir, req.file.filename);
// //       if (fs.existsSync(filePath)) {
// //         fs.unlinkSync(filePath);
// //       }
// //     }

// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to upload file",
// //     });
// //   }
// // };

// // /* ---------------------------------------------------
// //    11. Toggle Active / Inactive
// // --------------------------------------------------- */
// // export const toggleNewsletterStatus = async (req: Request, res: Response) => {
// //   try {
// //     const { id } = req.params;
// //     const { is_active } = req.body;

// //     console.log("Toggle status request:", { id, body: req.body });

// //     // Accept boolean, number (0/1), or string ("true"/"false")
// //     let isActiveBool: boolean;

// //     if (typeof is_active === "boolean") {
// //       isActiveBool = is_active;
// //     } else if (typeof is_active === "number") {
// //       isActiveBool = is_active === 1;
// //     } else if (typeof is_active === "string") {
// //       isActiveBool = is_active.toLowerCase() === "true" || is_active === "1";
// //     } else {
// //       return res.status(400).json({
// //         success: false,
// //         message:
// //           "is_active boolean required (true/false, 1/0, or 'true'/'false')",
// //       });
// //     }

// //     const newsletter = await newsletterPublishService.update(id, {
// //       is_active: isActiveBool,
// //     });

// //     if (!newsletter) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Newsletter not found",
// //       });
// //     }

// //     return res.status(200).json({
// //       success: true,
// //       message: isActiveBool ? "Activated" : "Deactivated",
// //       newsletter,
// //     });
// //   } catch (error: any) {
// //     console.error("Toggle status error:", error);
// //     return res.status(500).json({
// //       success: false,
// //       message: error.message || "Failed to toggle status",
// //     });
// //   }
// // };

// import type { Request, Response, NextFunction } from "express";
// import { newsletterPublishService } from "../services/newsletterPublishService";
// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Define Request interface with file property
// declare global {
//   namespace Express {
//     interface Request {
//       file?: Express.Multer.File;
//     }
//   }
// }

// /* ============================================
//    Helper: Setup newsletter upload directory
// ============================================ */
// const newsletterUploadDir = path.join(process.cwd(), "uploads/newsletters");
// if (!fs.existsSync(newsletterUploadDir)) {
//   fs.mkdirSync(newsletterUploadDir, { recursive: true });
// }

// /* ============================================
//    Multer configuration for ANY file uploads
// ============================================ */
// const newsletterStorage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, newsletterUploadDir);
//   },
//   filename: (_req, file, cb) => {
//     const uniqueName = `newsletter-${Date.now()}-${Math.round(
//       Math.random() * 1e9,
//     )}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// const newsletterUpload = multer({
//   storage: newsletterStorage,
//   limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
// });

// /* ============================================
//    MIDDLEWARE: Upload newsletter file (any type)
// ============================================ */
// export const uploadNewsletterFile = newsletterUpload.single("pdf_file");

// /* ============================================
//    Helper: Parse FormData fields
// ============================================ */
// const parseFormData = (req: Request) => {
//   const body: any = { ...req.body };

//   // Convert string publish_date into Date
//   if (body.publish_date && typeof body.publish_date === "string") {
//     body.publish_date = new Date(body.publish_date);
//   }

//   return body;
// };

// /* ============================================
//    Helper: Delete uploaded file safely
// ============================================ */
// const cleanupUploadedFile = (file?: Express.Multer.File) => {
//   if (!file) return;

//   const filePath = path.join(newsletterUploadDir, file.filename);
//   if (fs.existsSync(filePath)) {
//     try {
//       fs.unlinkSync(filePath);
//     } catch (err) {
//       console.error("Failed to delete uploaded file:", err);
//     }
//   }
// };

// /* ============================================
//    CONTROLLER FUNCTIONS (UPDATED)
// ============================================ */

// /* ---------------------------------------------------
//    1. Get all newsletter publications
// --------------------------------------------------- */
// export const getNewsletterPublications = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search = "",
//       status,
//       includeDeleted = "false",
//       sortField = "publish_date",
//       sortOrder = "desc",
//     } = req.query;

//     const result = await newsletterPublishService.getAll({
//       page: Number(page),
//       limit: Number(limit),
//       search: String(search),
//       status: status as any,
//       includeDeleted: includeDeleted === "true",
//       sortField: String(sortField),
//       sortOrder: sortOrder as "asc" | "desc",
//     });

//     return res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error: any) {
//     console.error("Get newsletter publications error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch newsletter publications",
//     });
//   }
// };

// /* ---------------------------------------------------
//    2. Get single newsletter publication by ID
// --------------------------------------------------- */
// export const getNewsletterPublicationById = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { id } = req.params;

//     const newsletter = await newsletterPublishService.getById(id);

//     if (!newsletter) {
//       return res.status(404).json({
//         success: false,
//         message: "Newsletter publication not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Get newsletter publication error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch newsletter publication",
//     });
//   }
// };

// /* ---------------------------------------------------
//    3. Create new newsletter publication (ALLOW ANY FILE TYPE)
// --------------------------------------------------- */
// export const createNewsletterPublication = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const body = parseFormData(req);

//     const title = body.title;
//     const description = body.description;
//     const publish_date = body.publish_date;
//     const status = body.status;

//     // Validate required fields
//     if (!title || !publish_date) {
//       cleanupUploadedFile(req.file);
//       return res.status(400).json({
//         success: false,
//         message: "Title and publish date are required",
//       });
//     }

//     // Validate publish_date
//     const publishDateObj = new Date(publish_date);
//     if (isNaN(publishDateObj.getTime())) {
//       cleanupUploadedFile(req.file);
//       return res.status(400).json({
//         success: false,
//         message: "Invalid publish date format",
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "File is required",
//       });
//     }

//     // Prepare newsletter data
//     const newsletterData: any = {
//       title: String(title).trim(),
//       description: description ? String(description).trim() : "",
//       publish_date: publishDateObj,
//       pdf_file: req.file.filename,
//       file_size: req.file.size,
//     };

//     // Add status if provided
//     if (status && ["draft", "scheduled", "published"].includes(status)) {
//       newsletterData.status = status;
//     }

//     const newsletter = await newsletterPublishService.create(newsletterData);

//     return res.status(201).json({
//       success: true,
//       message: "Newsletter publication created successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Create newsletter publication error:", error);

//     cleanupUploadedFile(req.file);

//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to create newsletter publication",
//     });
//   }
// };

// /* ---------------------------------------------------
//    4. Update newsletter publication (UPDATED for FormData)
// --------------------------------------------------- */
// export const updateNewsletterPublication = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { id } = req.params;

//     const updateData = parseFormData(req);

//     // Convert publish_date safely if string
//     if (updateData.publish_date) {
//       const dt = new Date(updateData.publish_date);
//       if (isNaN(dt.getTime())) {
//         cleanupUploadedFile(req.file);
//         return res.status(400).json({
//           success: false,
//           message: "Invalid publish date format",
//         });
//       }
//       updateData.publish_date = dt;
//     }

//     // If a new file is uploaded, add it to update data
//     if (req.file) {
//       updateData.pdf_file = req.file.filename;
//       updateData.file_size = req.file.size;
//     }

//     const newsletter = await newsletterPublishService.update(id, updateData);

//     if (!newsletter) {
//       cleanupUploadedFile(req.file);

//       return res.status(404).json({
//         success: false,
//         message: "Newsletter publication not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Newsletter publication updated successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Update newsletter publication error:", error);

//     cleanupUploadedFile(req.file);

//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to update newsletter publication",
//     });
//   }
// };

// /* ---------------------------------------------------
//    5. Send newsletter emails to subscribers
// --------------------------------------------------- */
// export const sendNewsletterEmails = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const result = await newsletterPublishService.sendNewsletterEmails(id);

//     return res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error: any) {
//     console.error("Send newsletter emails error:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to send newsletter emails",
//     });
//   }
// };

// /* ---------------------------------------------------
//    6. Publish newsletter immediately
// --------------------------------------------------- */
// export const publishNewsletterNow = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const newsletter = await newsletterPublishService.publishNow(id);

//     return res.status(200).json({
//       success: true,
//       message: "Newsletter published successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Publish newsletter error:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to publish newsletter",
//     });
//   }
// };

// /* ---------------------------------------------------
//    7. Schedule newsletter for future date
// --------------------------------------------------- */
// export const scheduleNewsletter = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { publish_date } = req.body;

//     if (!publish_date) {
//       return res.status(400).json({
//         success: false,
//         message: "Publish date is required for scheduling",
//       });
//     }

//     const dt = new Date(publish_date);
//     if (isNaN(dt.getTime())) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid publish date format",
//       });
//     }

//     const newsletter = await newsletterPublishService.schedule(id, dt);

//     return res.status(200).json({
//       success: true,
//       message: "Newsletter scheduled successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Schedule newsletter error:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to schedule newsletter",
//     });
//   }
// };

// /* ---------------------------------------------------
//    8. Soft delete newsletter publication
// --------------------------------------------------- */
// export const deleteNewsletterPublication = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { id } = req.params;

//     const newsletter = await newsletterPublishService.softDelete(id);

//     return res.status(200).json({
//       success: true,
//       message: "Newsletter publication deleted successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Delete newsletter publication error:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to delete newsletter publication",
//     });
//   }
// };

// /* ---------------------------------------------------
//    9. Restore soft-deleted newsletter
// --------------------------------------------------- */
// export const restoreNewsletterPublication = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { id } = req.params;

//     const newsletter = await newsletterPublishService.restore(id);

//     return res.status(200).json({
//       success: true,
//       message: "Newsletter publication restored successfully",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Restore newsletter publication error:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to restore newsletter publication",
//     });
//   }
// };

// /* ---------------------------------------------------
//    10. Upload file only (any file type allowed)
// --------------------------------------------------- */
// export const uploadNewsletterFileOnly = async (req: Request, res: Response) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "No file uploaded",
//       });
//     }

//     const fileInfo = await newsletterPublishService.uploadFile(req.file);

//     return res.status(200).json({
//       success: true,
//       message: "File uploaded successfully",
//       file: fileInfo,
//     });
//   } catch (error: any) {
//     console.error("Upload file error:", error);

//     cleanupUploadedFile(req.file);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to upload file",
//     });
//   }
// };

// /* ---------------------------------------------------
//    11. Toggle Active / Inactive
// --------------------------------------------------- */
// export const toggleNewsletterStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { is_active } = req.body;

//     // Accept boolean, number (0/1), or string ("true"/"false")
//     let isActiveBool: boolean;

//     if (typeof is_active === "boolean") {
//       isActiveBool = is_active;
//     } else if (typeof is_active === "number") {
//       isActiveBool = is_active === 1;
//     } else if (typeof is_active === "string") {
//       isActiveBool = is_active.toLowerCase() === "true" || is_active === "1";
//     } else {
//       return res.status(400).json({
//         success: false,
//         message:
//           "is_active boolean required (true/false, 1/0, or 'true'/'false')",
//       });
//     }

//     const newsletter = await newsletterPublishService.update(id, {
//       is_active: isActiveBool,
//     });

//     if (!newsletter) {
//       return res.status(404).json({
//         success: false,
//         message: "Newsletter not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: isActiveBool ? "Activated" : "Deactivated",
//       newsletter,
//     });
//   } catch (error: any) {
//     console.error("Toggle status error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to toggle status",
//     });
//   }
// };

// /* ---------------------------------------------------
//    OPTIONAL: Multer error handler middleware
//    (Use in routes if you want better file upload errors)
// --------------------------------------------------- */
// export const handleNewsletterUploadErrors = (
//   err: any,
//   _req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   if (!err) return next();

//   if (err instanceof multer.MulterError) {
//     if (err.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "File too large. Max size is 25MB.",
//       });
//     }

//     return res.status(400).json({
//       success: false,
//       message: err.message || "File upload error",
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: err.message || "Unexpected upload error",
//   });
// };

import type { Request, Response, NextFunction } from "express";
import { newsletterPublishService } from "../services/newsletterPublishService";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendError, sendSuccess } from "../utils/apiResponse";

// Define Request interface with file property
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

/* ============================================
   Helper: Setup newsletter upload directory
============================================ */
const newsletterUploadDir = path.join(process.cwd(), "uploads/newsletters");
if (!fs.existsSync(newsletterUploadDir)) {
  fs.mkdirSync(newsletterUploadDir, { recursive: true });
}

/* ============================================
   Multer configuration for ANY file uploads
============================================ */
const newsletterStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, newsletterUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `newsletter-${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const newsletterUpload = multer({
  storage: newsletterStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

/* ============================================
   MIDDLEWARE: Upload newsletter file (any type)
============================================ */
export const uploadNewsletterFile = newsletterUpload.single("pdf_file");

/* ============================================
   Helper: Parse FormData fields
============================================ */
const parseFormData = (req: Request) => {
  const body: any = { ...req.body };

  // Convert string publish_date into Date
  if (body.publish_date && typeof body.publish_date === "string") {
    body.publish_date = new Date(body.publish_date);
  }

  return body;
};

/* ============================================
   Helper: Delete uploaded file safely
============================================ */
const cleanupUploadedFile = (file?: Express.Multer.File) => {
  if (!file) return;

  const filePath = path.join(newsletterUploadDir, file.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Failed to delete uploaded file:", err);
    }
  }
};

/* ============================================
   CONTROLLER FUNCTIONS (UPDATED)
============================================ */

/* ---------------------------------------------------
   1. Get all newsletter publications - UPDATED
--------------------------------------------------- */
export const getNewsletterPublications = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      includeDeleted = "false",
      sortField = "publish_date",
      sortOrder = "desc",
    } = req.query;

    // Check if this is an admin request
    // Method 1: Check if route has :role parameter
    const hasRoleParam = req.params.role !== undefined;

    // Method 2: Check original URL for admin pattern
    const originalUrl = req.originalUrl || "";
    const hasAdminPattern =
      originalUrl.includes("/admin/") || originalUrl.includes("/:role/");

    // Method 3: Check path for admin routes
    const path = req.path || "";
    const isAdminPath = path.includes("/admin/") || path.includes("/:role/");

    // Determine if admin request
    const isAdminRequest = hasRoleParam || hasAdminPattern || isAdminPath;

    // Prepare service parameters
    const serviceParams: any = {
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      status: status as any,
      includeDeleted: includeDeleted === "true",
      sortField: String(sortField),
      sortOrder: sortOrder as "asc" | "desc",
      isAdmin: isAdminRequest, // Pass isAdmin flag to service
    };

    // If admin is requesting specific status, allow it
    // For public requests, we don't pass status (service will auto-filter to "published")
    if (!isAdminRequest && status) {
      // Public users can only see published newsletters
      // Don't pass status filter, service will handle it
      delete serviceParams.status;
    }

    const result = await newsletterPublishService.getAll(serviceParams);

    return sendSuccess(
      res,
      "Newsletter publications fetched successfully",
      result,
      200,
      { ...result },
    );
  } catch (error: any) {
    console.error("Get newsletter publications error:", error);
    return sendError(
      res,
      error.message || "Failed to fetch newsletter publications",
      500,
    );
  }
};

/* ---------------------------------------------------
   2. Get single newsletter publication by ID - UPDATED
--------------------------------------------------- */
export const getNewsletterPublicationById = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    // Check if this is an admin request
    const hasRoleParam = req.params.role !== undefined;
    const originalUrl = req.originalUrl || "";
    const hasAdminPattern =
      originalUrl.includes("/admin/") || originalUrl.includes("/:role/");
    const isAdminRequest = hasRoleParam || hasAdminPattern;

    let newsletter;

    if (isAdminRequest) {
      // Admin can see any newsletter
      newsletter = await newsletterPublishService.getById(id);
    } else {
      // Public users can only see active, published newsletters
      newsletter = await newsletterPublishService.getActiveById(id);
    }

    if (!newsletter) {
      return sendError(res, "Newsletter publication not found", 404);
    }

    return sendSuccess(
      res,
      "Newsletter publication fetched successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Get newsletter publication error:", error);
    return sendError(
      res,
      error.message || "Failed to fetch newsletter publication",
      500,
    );
  }
};

/* ---------------------------------------------------
   3. Create new newsletter publication (ALLOW ANY FILE TYPE)
--------------------------------------------------- */
export const createNewsletterPublication = async (
  req: Request,
  res: Response,
) => {
  try {
    const body = parseFormData(req);

    const title = body.title;
    const description = body.description;
    const publish_date = body.publish_date;
    const status = body.status;

    // Validate required fields
    if (!title || !publish_date) {
      cleanupUploadedFile(req.file);
      return sendError(res, "Title and publish date are required", 400);
    }

    // Validate publish_date
    const publishDateObj = new Date(publish_date);
    if (isNaN(publishDateObj.getTime())) {
      cleanupUploadedFile(req.file);
      return sendError(res, "Invalid publish date format", 400);
    }

    if (!req.file) {
      return sendError(res, "File is required", 400);
    }

    // Prepare newsletter data
    const newsletterData: any = {
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      publish_date: publishDateObj,
      pdf_file: req.file.filename,
      file_size: req.file.size,
    };

    // Add status if provided
    if (status && ["draft", "scheduled", "published"].includes(status)) {
      newsletterData.status = status;
    }

    const newsletter = await newsletterPublishService.create(newsletterData);

    return sendSuccess(
      res,
      "Newsletter publication created successfully",
      newsletter,
      201,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Create newsletter publication error:", error);

    cleanupUploadedFile(req.file);

    return sendError(
      res,
      error.message || "Failed to create newsletter publication",
      400,
    );
  }
};

/* ---------------------------------------------------
   4. Update newsletter publication (UPDATED for FormData)
--------------------------------------------------- */
export const updateNewsletterPublication = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const updateData = parseFormData(req);

    // Convert publish_date safely if string
    if (updateData.publish_date) {
      const dt = new Date(updateData.publish_date);
      if (isNaN(dt.getTime())) {
        cleanupUploadedFile(req.file);
        return sendError(res, "Invalid publish date format", 400);
      }
      updateData.publish_date = dt;
    }

    // If a new file is uploaded, add it to update data
    if (req.file) {
      updateData.pdf_file = req.file.filename;
      updateData.file_size = req.file.size;
    }

    const newsletter = await newsletterPublishService.update(id, updateData);

    if (!newsletter) {
      cleanupUploadedFile(req.file);

      return sendError(res, "Newsletter publication not found", 404);
    }

    return sendSuccess(
      res,
      "Newsletter publication updated successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Update newsletter publication error:", error);

    cleanupUploadedFile(req.file);

    return sendError(
      res,
      error.message || "Failed to update newsletter publication",
      400,
    );
  }
};

/* ---------------------------------------------------
   5. Send newsletter emails to subscribers
--------------------------------------------------- */
export const sendNewsletterEmails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await newsletterPublishService.sendNewsletterEmails(id);

    return sendSuccess(
      res,
      "Newsletter emails sent successfully",
      result,
      200,
      { ...result },
    );
  } catch (error: any) {
    console.error("Send newsletter emails error:", error);
    return sendError(
      res,
      error.message || "Failed to send newsletter emails",
      400,
    );
  }
};

/* ---------------------------------------------------
   6. Publish newsletter immediately
--------------------------------------------------- */
export const publishNewsletterNow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const newsletter = await newsletterPublishService.publishNow(id);

    return sendSuccess(
      res,
      "Newsletter published successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Publish newsletter error:", error);
    return sendError(res, error.message || "Failed to publish newsletter", 400);
  }
};

/* ---------------------------------------------------
   7. Schedule newsletter for future date
--------------------------------------------------- */
export const scheduleNewsletter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { publish_date } = req.body;

    if (!publish_date) {
      return sendError(res, "Publish date is required for scheduling", 400);
    }

    const dt = new Date(publish_date);
    if (isNaN(dt.getTime())) {
      return sendError(res, "Invalid publish date format", 400);
    }

    const newsletter = await newsletterPublishService.schedule(id, dt);

    return sendSuccess(
      res,
      "Newsletter scheduled successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Schedule newsletter error:", error);
    return sendError(res, error.message || "Failed to schedule newsletter", 400);
  }
};

/* ---------------------------------------------------
   8. Soft delete newsletter publication
--------------------------------------------------- */
export const deleteNewsletterPublication = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const newsletter = await newsletterPublishService.softDelete(id);

    return sendSuccess(
      res,
      "Newsletter publication deleted successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Delete newsletter publication error:", error);
    return sendError(
      res,
      error.message || "Failed to delete newsletter publication",
      400,
    );
  }
};

/* ---------------------------------------------------
   9. Restore soft-deleted newsletter
--------------------------------------------------- */
export const restoreNewsletterPublication = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const newsletter = await newsletterPublishService.restore(id);

    return sendSuccess(
      res,
      "Newsletter publication restored successfully",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Restore newsletter publication error:", error);
    return sendError(
      res,
      error.message || "Failed to restore newsletter publication",
      400,
    );
  }
};

/* ---------------------------------------------------
   10. Upload file only (any file type allowed)
--------------------------------------------------- */
export const uploadNewsletterFileOnly = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded", 400);
    }

    const fileInfo = await newsletterPublishService.uploadFile(req.file);

    return sendSuccess(res, "File uploaded successfully", fileInfo, 200, {
      file: fileInfo,
    });
  } catch (error: any) {
    console.error("Upload file error:", error);

    cleanupUploadedFile(req.file);

    return sendError(res, error.message || "Failed to upload file", 500);
  }
};

/* ---------------------------------------------------
   11. Toggle Active / Inactive
--------------------------------------------------- */
export const toggleNewsletterStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Accept boolean, number (0/1), or string ("true"/"false")
    let isActiveBool: boolean;

    if (typeof is_active === "boolean") {
      isActiveBool = is_active;
    } else if (typeof is_active === "number") {
      isActiveBool = is_active === 1;
    } else if (typeof is_active === "string") {
      isActiveBool = is_active.toLowerCase() === "true" || is_active === "1";
    } else {
      return sendError(
        res,
        "is_active boolean required (true/false, 1/0, or 'true'/'false')",
        400,
      );
    }

    const newsletter = await newsletterPublishService.update(id, {
      is_active: isActiveBool,
    });

    if (!newsletter) {
      return sendError(res, "Newsletter not found", 404);
    }

    return sendSuccess(
      res,
      isActiveBool ? "Activated" : "Deactivated",
      newsletter,
      200,
      { newsletter },
    );
  } catch (error: any) {
    console.error("Toggle status error:", error);
    return sendError(res, error.message || "Failed to toggle status", 500);
  }
};

/* ---------------------------------------------------
   OPTIONAL: Multer error handler middleware
   (Use in routes if you want better file upload errors)
--------------------------------------------------- */
export const handleNewsletterUploadErrors = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return sendError(res, "File too large. Max size is 25MB.", 400);
    }

    return sendError(res, err.message || "File upload error", 400);
  }

  return sendError(res, err.message || "Unexpected upload error", 500);
};
