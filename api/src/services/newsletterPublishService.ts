// // import NewsletterPublish, {
// //   INewsletterPublish,
// // } from "../models/newsletterPublishModel";
// // import { Newsletter } from "../models/newsletterModel";
// // import { emailService } from "@/emails/emailService";
// // import fs from "fs";
// // import path from "path";

// // /* ============================================
// //    Interface: Pagination & Filter Options
// // ============================================ */
// // interface GetNewsletterPublishParams {
// //   page?: number;
// //   limit?: number;
// //   search?: string;
// //   status?: "draft" | "scheduled" | "published";
// //   includeDeleted?: boolean;
// //   sortField?: string;
// //   sortOrder?: "asc" | "desc";
// // }

// // interface PaginationResult<T> {
// //   newsletters: T[];
// //   total: number;
// //   currentPage: number;
// //   totalPages: number;
// //   limit: number;
// // }

// // /* ============================================
// //    Newsletter Publishing Service (UPDATED)
// // ============================================ */
// // export const newsletterPublishService = {
// //   /* ============================================
// //      1. Get all newsletter publications (paginated)
// //   ============================================ */
// //   getAll: async ({
// //     page = 1,
// //     limit = 10,
// //     search = "",
// //     status,
// //     includeDeleted = false,
// //     sortField = "publish_date",
// //     sortOrder = "desc",
// //   }: GetNewsletterPublishParams): Promise<
// //     PaginationResult<INewsletterPublish>
// //   > => {
// //     const skip = (page - 1) * limit;

// //     // Build filter query
// //     const filter: Record<string, any> = {};

// //     if (!includeDeleted) {
// //       filter.is_deleted = false;
// //     }

// //     if (status) {
// //       filter.status = status;
// //     }

// //     if (search.trim()) {
// //       filter.$or = [
// //         { title: { $regex: search, $options: "i" } },
// //         { description: { $regex: search, $options: "i" } },
// //       ];
// //     }

// //     // Sorting
// //     const sortConfig: Record<string, 1 | -1> = {};
// //     sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

// //     // Execute queries
// //     const [newsletters, total] = await Promise.all([
// //       NewsletterPublish.find(filter)
// //         .sort(sortConfig)
// //         .skip(skip)
// //         .limit(limit)
// //         .lean(),
// //       NewsletterPublish.countDocuments(filter),
// //     ]);

// //     return {
// //       newsletters,
// //       total,
// //       currentPage: page,
// //       totalPages: Math.ceil(total / limit),
// //       limit,
// //     };
// //   },

// //   /* ============================================
// //      2. Get newsletter publication by ID
// //   ============================================ */
// //   getById: async (id: string): Promise<INewsletterPublish | null> => {
// //     return NewsletterPublish.findOne({
// //       _id: id,
// //       is_deleted: false,
// //     }).lean();
// //   },

// //   /* ============================================
// //      3. Create new newsletter publication (ALLOW ANY FILE TYPE)
// //   ============================================ */
// //   create: async (
// //     data: Partial<INewsletterPublish>,
// //   ): Promise<INewsletterPublish> => {
// //     // Validate required fields
// //     if (!data.title || !data.publish_date || !data.pdf_file) {
// //       throw new Error("Title, publish date, and file are required");
// //     }

// //     // Validate publish date is not in the past for scheduled/published
// //     const publishDate = new Date(data.publish_date);
// //     const now = new Date();

// //     if (
// //       (data.status === "scheduled" || data.status === "published") &&
// //       publishDate < now
// //     ) {
// //       throw new Error(
// //         "Publish date cannot be in the past for scheduled/published newsletters",
// //       );
// //     }

// //     // Set default status if not provided
// //     if (!data.status) {
// //       data.status = publishDate <= now ? "published" : "scheduled";
// //     }

// //     const newsletter = new NewsletterPublish({
// //       ...data,
// //       is_email_sent: false,
// //       is_deleted: false,
// //     });

// //     return newsletter.save();
// //   },

// //   /* ============================================
// //      4. Update newsletter publication (UPDATED with file cleanup)
// //   ============================================ */
// //   update: async (
// //     id: string,
// //     updateData: Partial<INewsletterPublish>,
// //   ): Promise<INewsletterPublish | null> => {
// //     // Find existing newsletter
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     // Store old file path if updating file
// //     let oldFilePath: string | null = null;
// //     if (updateData.pdf_file && updateData.pdf_file !== newsletter.pdf_file) {
// //       oldFilePath = path.join(
// //         process.cwd(),
// //         "uploads",
// //         "newsletters",
// //         newsletter.pdf_file,
// //       );
// //     }

// //     // If updating status to published and publish date is today or past,
// //     // mark as ready for email sending
// //     if (updateData.status === "published") {
// //       const publishDate = updateData.publish_date
// //         ? new Date(updateData.publish_date)
// //         : newsletter.publish_date;

// //       const now = new Date();
// //       now.setHours(0, 0, 0, 0);

// //       if (publishDate <= now) {
// //         updateData.is_email_sent = false; // Reset for email sending
// //       }
// //     }

// //     // Update newsletter fields
// //     Object.assign(newsletter, updateData);
// //     newsletter.updated_at = new Date();

// //     await newsletter.save();

// //     // Delete old file after successful update
// //     if (oldFilePath && fs.existsSync(oldFilePath)) {
// //       try {
// //         fs.unlinkSync(oldFilePath);
// //       } catch (err) {
// //         console.error("Failed to delete old file:", err);
// //         // Don't throw error - file deletion failure shouldn't break update
// //       }
// //     }

// //     return newsletter;
// //   },

// //   /* ============================================
// //      5. Send newsletter emails to all subscribers
// //   ============================================ */
// //   sendNewsletterEmails: async (
// //     id: string,
// //   ): Promise<{
// //     success: boolean;
// //     message: string;
// //     totalRecipients: number;
// //     successful: number;
// //     failed: number;
// //   }> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     // Check if already sent
// //     if (newsletter.is_email_sent) {
// //       throw new Error("Newsletter emails have already been sent");
// //     }

// //     // Check if can be sent (published/scheduled and publish date reached)
// //     const now = new Date();
// //     if (newsletter.publish_date > now && newsletter.status !== "published") {
// //       throw new Error("Newsletter publish date has not been reached yet");
// //     }

// //     // Get all newsletter subscribers
// //     const subscribers = await Newsletter.find({
// //       is_deleted: false,
// //       email: { $exists: true, $ne: "" },
// //     }).select("email name");

// //     if (subscribers.length === 0) {
// //       throw new Error("No subscribers found to send newsletter");
// //     }

// //     // Prepare file path (any file type allowed)
// //     const filePath = path.join(
// //       process.cwd(),
// //       "uploads",
// //       "newsletters",
// //       newsletter.pdf_file,
// //     );

// //     // Check if file exists
// //     if (!fs.existsSync(filePath)) {
// //       throw new Error("Newsletter file not found");
// //     }

// //     // Extract email addresses
// //     const subscriberEmails = subscribers
// //       .map((s) => s.email)
// //       .filter((email): email is string => !!email && email.includes("@"));

// //     let successfulDeliveries = 0;
// //     let failedDeliveries = 0;

// //     try {
// //       // Send emails using emailService
// //       await emailService.newsletter(
// //         subscriberEmails,
// //         filePath,
// //         newsletter.title,
// //       );

// //       successfulDeliveries = subscriberEmails.length;
// //     } catch (error) {
// //       console.error("Failed to send newsletter emails:", error);
// //       failedDeliveries = subscriberEmails.length;
// //     }

// //     // Update newsletter tracking
// //     newsletter.is_email_sent = true;
// //     newsletter.email_sent_at = new Date();
// //     newsletter.total_recipients = subscriberEmails.length;
// //     newsletter.updated_at = new Date();

// //     // If status was "scheduled", change to "published"
// //     if (newsletter.status === "scheduled") {
// //       newsletter.status = "published";
// //     }

// //     await newsletter.save();

// //     return {
// //       success: successfulDeliveries > 0,
// //       message:
// //         successfulDeliveries > 0
// //           ? `Newsletter sent to ${successfulDeliveries} subscribers`
// //           : "Failed to send newsletter emails",
// //       totalRecipients: subscriberEmails.length,
// //       successful: successfulDeliveries,
// //       failed: failedDeliveries,
// //     };
// //   },

// //   /* ============================================
// //      6. Publish newsletter immediately
// //   ============================================ */
// //   publishNow: async (id: string): Promise<INewsletterPublish> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     // Update to published status with current date
// //     newsletter.status = "published";
// //     newsletter.publish_date = new Date();
// //     newsletter.is_email_sent = false; // Reset for email sending
// //     newsletter.updated_at = new Date();

// //     return newsletter.save();
// //   },

// //   /* ============================================
// //      7. Schedule newsletter for future date
// //   ============================================ */
// //   schedule: async (
// //     id: string,
// //     publishDate: Date,
// //   ): Promise<INewsletterPublish> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     // Validate future date
// //     const now = new Date();
// //     if (publishDate <= now) {
// //       throw new Error("Schedule date must be in the future");
// //     }

// //     newsletter.status = "scheduled";
// //     newsletter.publish_date = publishDate;
// //     newsletter.is_email_sent = false;
// //     newsletter.updated_at = new Date();

// //     return newsletter.save();
// //   },

// //   /* ============================================
// //      8. Soft delete newsletter (with file cleanup)
// //   ============================================ */
// //   softDelete: async (id: string): Promise<INewsletterPublish | null> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     newsletter.is_deleted = true;
// //     newsletter.deleted_at = new Date();
// //     newsletter.updated_at = new Date();

// //     return newsletter.save();
// //   },

// //   /* ============================================
// //      9. Restore soft-deleted newsletter
// //   ============================================ */
// //   restore: async (id: string): Promise<INewsletterPublish | null> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter) {
// //       throw new Error("Newsletter publication not found");
// //     }

// //     newsletter.is_deleted = false;
// //     newsletter.deleted_at = undefined;
// //     newsletter.updated_at = new Date();

// //     return newsletter.save();
// //   },

// //   /* ============================================
// //      10. Get newsletters ready for sending (Cron job)
// //   ============================================ */
// //   getNewslettersReadyToSend: async (): Promise<INewsletterPublish[]> => {
// //     const now = new Date();

// //     return NewsletterPublish.find({
// //       is_deleted: false,
// //       is_email_sent: false,
// //       status: { $in: ["scheduled", "published"] },
// //       publish_date: { $lte: now },
// //     }).lean();
// //   },

// //   /* ============================================
// //      11. Upload file and return file info
// //   ============================================ */
// //   uploadFile: async (
// //     file: Express.Multer.File,
// //   ): Promise<{
// //     filename: string;
// //     originalname: string;
// //     size: number;
// //     mimetype: string;
// //     path: string;
// //   }> => {
// //     if (!file) {
// //       throw new Error("No file uploaded");
// //     }

// //     return {
// //       filename: file.filename,
// //       originalname: file.originalname,
// //       size: file.size,
// //       mimetype: file.mimetype,
// //       path: `/uploads/newsletters/${file.filename}`,
// //     };
// //   },

// //   /* ============================================
// //      12. Get file path for a newsletter
// //   ============================================ */
// //   getFilePath: async (id: string): Promise<string | null> => {
// //     const newsletter = await NewsletterPublish.findById(id);
// //     if (!newsletter || !newsletter.pdf_file) {
// //       return null;
// //     }

// //     return path.join(
// //       process.cwd(),
// //       "uploads",
// //       "newsletters",
// //       newsletter.pdf_file,
// //     );
// //   },
// // };

// import NewsletterPublish, {
//   INewsletterPublish,
// } from "../models/newsletterPublishModel";
// import { Newsletter } from "../models/newsletterModel";
// import { emailService } from "@/emails/emailService";
// import fs from "fs";
// import path from "path";

// /* ============================================
//    Interface: Pagination & Filter Options
// ============================================ */
// interface GetNewsletterPublishParams {
//   page?: number;
//   limit?: number;
//   search?: string;
//   status?: "draft" | "scheduled" | "published";

//   //  Added frequency filter
//   frequency?: "daily" | "weekly" | "monthly";

//   includeDeleted?: boolean;
//   sortField?: string;
//   sortOrder?: "asc" | "desc";
// }

// interface PaginationResult<T> {
//   newsletters: T[];
//   total: number;
//   currentPage: number;
//   totalPages: number;
//   limit: number;
// }

// /* ============================================
//    Newsletter Publishing Service (UPDATED)
// ============================================ */
// export const newsletterPublishService = {
//   /* ============================================
//      1. Get all newsletter publications (paginated)
//   ============================================ */
//   getAll: async ({
//     page = 1,
//     limit = 10,
//     search = "",
//     status,
//     frequency,
//     includeDeleted = false,
//     sortField = "publish_date",
//     sortOrder = "desc",
//   }: GetNewsletterPublishParams): Promise<
//     PaginationResult<INewsletterPublish>
//   > => {
//     const skip = (page - 1) * limit;

//     // Build filter query
//     const filter: Record<string, any> = {};

//     if (!includeDeleted) {
//       filter.is_deleted = false;
//     }

//     if (status) {
//       filter.status = status;
//     }

//     //  Filter by frequency
//     if (frequency) {
//       filter.frequency = frequency;
//     }

//     if (search.trim()) {
//       filter.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },

//         //  Allow searching by frequency keyword too
//         { frequency: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Sorting
//     const sortConfig: Record<string, 1 | -1> = {};
//     sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

//     // Execute queries
//     const [newsletters, total] = await Promise.all([
//       NewsletterPublish.find(filter)
//         .sort(sortConfig)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       NewsletterPublish.countDocuments(filter),
//     ]);

//     return {
//       newsletters,
//       total,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       limit,
//     };
//   },

//   /* ============================================
//      2. Get newsletter publication by ID
//   ============================================ */
//   getById: async (id: string): Promise<INewsletterPublish | null> => {
//     return NewsletterPublish.findOne({
//       _id: id,
//       is_deleted: false,
//     }).lean();
//   },

//   /* ============================================
//      3. Create new newsletter publication
//   ============================================ */
//   // create: async (
//   //   data: Partial<INewsletterPublish>,
//   // ): Promise<INewsletterPublish> => {
//   //   // Validate required fields
//   //   if (!data.title || !data.publish_date || !data.pdf_file) {
//   //     throw new Error("Title, publish date, and file are required");
//   //   }

//   //   //  Default frequency if not provided
//   //   if (!data.frequency) {
//   //     data.frequency = "daily";
//   //   }

//   //   //  Validate frequency
//   //   if (!["daily", "weekly", "monthly"].includes(data.frequency)) {
//   //     throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
//   //   }

//   //   // Validate publish date is not in the past for scheduled/published
//   //   const publishDate = new Date(data.publish_date);
//   //   const now = new Date();

//   //   if (
//   //     (data.status === "scheduled" || data.status === "published") &&
//   //     publishDate < now
//   //   ) {
//   //     throw new Error(
//   //       "Publish date cannot be in the past for scheduled/published newsletters",
//   //     );
//   //   }

//   //   // Set default status if not provided
//   //   if (!data.status) {
//   //     data.status = publishDate <= now ? "published" : "scheduled";
//   //   }

//   //   const newsletter = new NewsletterPublish({
//   //     ...data,
//   //     is_email_sent: false,
//   //     is_deleted: false,
//   //   });

//   //   return newsletter.save();
//   // },

//   create: async (
//     data: Partial<INewsletterPublish>,
//   ): Promise<INewsletterPublish> => {
//     // Validate required fields
//     if (!data.title || !data.publish_date || !data.pdf_file) {
//       throw new Error("Title, publish date, and file are required");
//     }

//     //  Default frequency if not provided
//     if (!data.frequency) {
//       data.frequency = "daily";
//     }

//     //  Validate frequency
//     if (!["daily", "weekly", "monthly"].includes(data.frequency)) {
//       throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
//     }

//     // Validate publish date is not in the past for scheduled/published
//     const publishDate = new Date(data.publish_date);
//     const now = new Date();

//     if (
//       (data.status === "scheduled" || data.status === "published") &&
//       publishDate < now
//     ) {
//       throw new Error(
//         "Publish date cannot be in the past for scheduled/published newsletters",
//       );
//     }

//     // Set default status if not provided
//     if (!data.status) {
//       data.status = publishDate <= now ? "published" : "scheduled";
//     }

//     const newsletter = new NewsletterPublish({
//       ...data,
//       is_email_sent: false,
//       is_deleted: false,
//     });

//     await newsletter.save();

//     // ============ AUTO-SEND FOR NEWLY CREATED PUBLISHED NEWSLETTERS ============
//     if (newsletter.status === "published" && publishDate <= now) {
//       console.log(
//         ` Auto-sending emails for newly created newsletter: ${newsletter.title}`,
//       );

//       // Send emails asynchronously
//       setTimeout(async () => {
//         try {
//           await newsletterPublishService.sendNewsletterEmails(
//             newsletter._id.toString(),
//           );
//           console.log(` Newsletter emails sent for: ${newsletter.title}`);
//         } catch (error) {
//           console.error(` Failed to send emails:`, error);
//         }
//       }, 1000);
//     }
//     // ============ END OF FIX ============

//     return newsletter;
//   },
//   /* ============================================
//      4. Update newsletter publication
//   ============================================ */
//   // update: async (
//   //   id: string,
//   //   updateData: Partial<INewsletterPublish>,
//   // ): Promise<INewsletterPublish | null> => {
//   //   // Find existing newsletter
//   //   const newsletter = await NewsletterPublish.findById(id);
//   //   if (!newsletter) {
//   //     throw new Error("Newsletter publication not found");
//   //   }

//   //   //  Validate frequency if updating it
//   //   if (
//   //     updateData.frequency &&
//   //     !["daily", "weekly", "monthly"].includes(updateData.frequency)
//   //   ) {
//   //     throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
//   //   }

//   //   // Store old file path if updating file
//   //   let oldFilePath: string | null = null;
//   //   if (updateData.pdf_file && updateData.pdf_file !== newsletter.pdf_file) {
//   //     oldFilePath = path.join(
//   //       process.cwd(),
//   //       "uploads",
//   //       "newsletters",
//   //       newsletter.pdf_file,
//   //     );
//   //   }

//   //   // If updating status to published and publish date is today or past,
//   //   // mark as ready for email sending
//   //   if (updateData.status === "published") {
//   //     const publishDate = updateData.publish_date
//   //       ? new Date(updateData.publish_date)
//   //       : newsletter.publish_date;

//   //     const now = new Date();
//   //     now.setHours(0, 0, 0, 0);

//   //     if (publishDate <= now) {
//   //       updateData.is_email_sent = false; // Reset for email sending
//   //     }
//   //   }

//   //   // Update newsletter fields
//   //   Object.assign(newsletter, updateData);
//   //   newsletter.updated_at = new Date();

//   //   await newsletter.save();

//   //   // Delete old file after successful update
//   //   if (oldFilePath && fs.existsSync(oldFilePath)) {
//   //     try {
//   //       fs.unlinkSync(oldFilePath);
//   //     } catch (err) {
//   //       console.error("Failed to delete old file:", err);
//   //     }
//   //   }

//   //   return newsletter;
//   // },
//   update: async (
//     id: string,
//     updateData: Partial<INewsletterPublish>,
//   ): Promise<INewsletterPublish | null> => {
//     // Find existing newsletter
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     //  Validate frequency if updating it
//     if (
//       updateData.frequency &&
//       !["daily", "weekly", "monthly"].includes(updateData.frequency)
//     ) {
//       throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
//     }

//     // Store old file path if updating file
//     let oldFilePath: string | null = null;
//     if (updateData.pdf_file && updateData.pdf_file !== newsletter.pdf_file) {
//       oldFilePath = path.join(
//         process.cwd(),
//         "uploads",
//         "newsletters",
//         newsletter.pdf_file,
//       );
//     }

//     // If updating status to published and publish date is today or past,
//     // mark as ready for email sending
//     if (updateData.status === "published") {
//       const publishDate = updateData.publish_date
//         ? new Date(updateData.publish_date)
//         : newsletter.publish_date;

//       const now = new Date();
//       now.setHours(0, 0, 0, 0);

//       if (publishDate <= now) {
//         updateData.is_email_sent = false; // Reset for email sending
//       }
//     }

//     // Store the original status before update
//     const originalStatus = newsletter.status;

//     // Update newsletter fields
//     Object.assign(newsletter, updateData);
//     newsletter.updated_at = new Date();

//     await newsletter.save();

//     // ============ CRITICAL FIX: AUTO-SEND EMAILS ============
//     // Check if status changed to "published" and publish date has passed
//     const isStatusChangedToPublished =
//       newsletter.status === "published" && originalStatus !== "published";

//     const now = new Date();
//     if (
//       isStatusChangedToPublished &&
//       newsletter.publish_date <= now &&
//       !newsletter.is_email_sent
//     ) {
//       console.log(` Auto-sending newsletter emails for: ${newsletter.title}`);

//       // Send emails asynchronously (don't wait for it)
//       setTimeout(async () => {
//         try {
//           await newsletterPublishService.sendNewsletterEmails(id);
//           console.log(
//             ` Newsletter emails sent successfully for: ${newsletter.title}`,
//           );
//         } catch (emailError) {
//           console.error(` Failed to send newsletter emails:`, emailError);
//           // Don't throw - update should still succeed even if email fails
//         }
//       }, 1000); // 1 second delay to not block the response
//     }
//     // ============ END OF FIX ============

//     // Delete old file after successful update
//     if (oldFilePath && fs.existsSync(oldFilePath)) {
//       try {
//         fs.unlinkSync(oldFilePath);
//       } catch (err) {
//         console.error("Failed to delete old file:", err);
//       }
//     }

//     return newsletter;
//   },
//   /* ============================================
//      5. Send newsletter emails to all subscribers
//   ============================================ */
//   sendNewsletterEmails: async (
//     id: string,
//   ): Promise<{
//     success: boolean;
//     message: string;
//     totalRecipients: number;
//     successful: number;
//     failed: number;
//   }> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     if (newsletter.is_email_sent) {
//       throw new Error("Newsletter emails have already been sent");
//     }

//     const now = new Date();
//     if (newsletter.publish_date > now && newsletter.status !== "published") {
//       throw new Error("Newsletter publish date has not been reached yet");
//     }

//     const subscribers = await Newsletter.find({
//       is_deleted: false,
//       email: { $exists: true, $ne: "" },
//     }).select("email name");

//     if (subscribers.length === 0) {
//       throw new Error("No subscribers found to send newsletter");
//     }

//     const filePath = path.join(
//       process.cwd(),
//       "uploads",
//       "newsletters",
//       newsletter.pdf_file,
//     );

//     if (!fs.existsSync(filePath)) {
//       throw new Error("Newsletter file not found");
//     }

//     const subscriberEmails = subscribers
//       .map((s) => s.email)
//       .filter((email): email is string => !!email && email.includes("@"));

//     let successfulDeliveries = 0;
//     let failedDeliveries = 0;

//     try {
//       await emailService.newsletter(
//         subscriberEmails,
//         filePath,
//         newsletter.title,
//       );
//       successfulDeliveries = subscriberEmails.length;
//     } catch (error) {
//       console.error("Failed to send newsletter emails:", error);
//       failedDeliveries = subscriberEmails.length;
//     }

//     newsletter.is_email_sent = true;
//     newsletter.email_sent_at = new Date();
//     newsletter.total_recipients = subscriberEmails.length;
//     newsletter.updated_at = new Date();

//     if (newsletter.status === "scheduled") {
//       newsletter.status = "published";
//     }

//     await newsletter.save();

//     return {
//       success: successfulDeliveries > 0,
//       message:
//         successfulDeliveries > 0
//           ? `Newsletter sent to ${successfulDeliveries} subscribers`
//           : "Failed to send newsletter emails",
//       totalRecipients: subscriberEmails.length,
//       successful: successfulDeliveries,
//       failed: failedDeliveries,
//     };
//   },

//   /* ============================================
//      6. Publish newsletter immediately
//   ============================================ */
//   publishNow: async (id: string): Promise<INewsletterPublish> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     newsletter.status = "published";
//     newsletter.publish_date = new Date();
//     newsletter.is_email_sent = false;
//     newsletter.updated_at = new Date();

//     return newsletter.save();
//   },

//   /* ============================================
//      7. Schedule newsletter for future date
//   ============================================ */
//   schedule: async (
//     id: string,
//     publishDate: Date,
//   ): Promise<INewsletterPublish> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     const now = new Date();
//     if (publishDate <= now) {
//       throw new Error("Schedule date must be in the future");
//     }

//     newsletter.status = "scheduled";
//     newsletter.publish_date = publishDate;
//     newsletter.is_email_sent = false;
//     newsletter.updated_at = new Date();

//     return newsletter.save();
//   },

//   /* ============================================
//      8. Soft delete newsletter
//   ============================================ */
//   softDelete: async (id: string): Promise<INewsletterPublish | null> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     newsletter.is_deleted = true;
//     newsletter.deleted_at = new Date();
//     newsletter.updated_at = new Date();

//     return newsletter.save();
//   },

//   /* ============================================
//      9. Restore soft-deleted newsletter
//   ============================================ */
//   restore: async (id: string): Promise<INewsletterPublish | null> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter) {
//       throw new Error("Newsletter publication not found");
//     }

//     newsletter.is_deleted = false;
//     newsletter.deleted_at = undefined;
//     newsletter.updated_at = new Date();

//     return newsletter.save();
//   },

//   /* ============================================
//      10. Get newsletters ready for sending (Cron job)
//   ============================================ */
//   getNewslettersReadyToSend: async (): Promise<INewsletterPublish[]> => {
//     const now = new Date();

//     return NewsletterPublish.find({
//       is_deleted: false,
//       is_email_sent: false,
//       status: { $in: ["scheduled", "published"] },
//       publish_date: { $lte: now },
//     }).lean();
//   },

//   /* ============================================
//      11. Upload file and return file info
//   ============================================ */
//   uploadFile: async (
//     file: Express.Multer.File,
//   ): Promise<{
//     filename: string;
//     originalname: string;
//     size: number;
//     mimetype: string;
//     path: string;
//   }> => {
//     if (!file) {
//       throw new Error("No file uploaded");
//     }

//     return {
//       filename: file.filename,
//       originalname: file.originalname,
//       size: file.size,
//       mimetype: file.mimetype,
//       path: `/uploads/newsletters/${file.filename}`,
//     };
//   },

//   /* ============================================
//      12. Get file path for a newsletter
//   ============================================ */
//   getFilePath: async (id: string): Promise<string | null> => {
//     const newsletter = await NewsletterPublish.findById(id);
//     if (!newsletter || !newsletter.pdf_file) {
//       return null;
//     }

//     return path.join(
//       process.cwd(),
//       "uploads",
//       "newsletters",
//       newsletter.pdf_file,
//     );
//   },
// };

import NewsletterPublish, {
  INewsletterPublish,
} from "../models/newsletterPublishModel";
import { Newsletter } from "../models/newsletterModel";
import { emailService } from "@/emails/emailService";
import fs from "fs";
import path from "path";

/* ============================================
   Interface: Pagination & Filter Options
============================================ */
interface GetNewsletterPublishParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "draft" | "scheduled" | "published";
  frequency?: "daily" | "weekly" | "monthly";
  includeDeleted?: boolean;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  isAdmin?: boolean; // NEW: To distinguish admin vs public requests
}

interface PaginationResult<T> {
  newsletters: T[];
  total: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

/* ============================================
   Newsletter Publishing Service (UPDATED)
============================================ */
export const newsletterPublishService = {
  /* ============================================
     1. Get all newsletter publications (paginated) - UPDATED
  ============================================ */
  getAll: async ({
    page = 1,
    limit = 10,
    search = "",
    status,
    frequency,
    includeDeleted = false,
    sortField = "publish_date",
    sortOrder = "desc",
    isAdmin = false, // NEW PARAMETER: Default to false for public access
  }: GetNewsletterPublishParams): Promise<
    PaginationResult<INewsletterPublish>
  > => {
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: Record<string, any> = {};

    if (!includeDeleted) {
      filter.is_deleted = false;
    }

    // CRITICAL: Only show active newsletters for NON-ADMIN requests
    if (!isAdmin) {
      filter.is_active = true;
      // Also ensure only published newsletters are shown to users
      filter.status = "published";
    } else {
      // For admin requests, show all statuses if specified
      if (status) {
        filter.status = status;
      }
    }

    // Filter by frequency
    if (frequency) {
      filter.frequency = frequency;
    }

    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { frequency: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    const sortConfig: Record<string, 1 | -1> = {};
    sortConfig[sortField] = sortOrder === "desc" ? -1 : 1;

    // Execute queries
    const [newsletters, total] = await Promise.all([
      NewsletterPublish.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      NewsletterPublish.countDocuments(filter),
    ]);

    return {
      newsletters,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  },

  /* ============================================
     2. Get newsletter publication by ID
  ============================================ */
  getById: async (id: string): Promise<INewsletterPublish | null> => {
    return NewsletterPublish.findOne({
      _id: id,
      is_deleted: false,
    }).lean();
  },

  /* ============================================
     2a. Get active newsletter by ID (for public users)
  ============================================ */
  getActiveById: async (id: string): Promise<INewsletterPublish | null> => {
    return NewsletterPublish.findOne({
      _id: id,
      is_deleted: false,
      is_active: true,
      status: "published",
    }).lean();
  },

  /* ============================================
     3. Create new newsletter publication
  ============================================ */
  create: async (
    data: Partial<INewsletterPublish>,
  ): Promise<INewsletterPublish> => {
    // Validate required fields
    if (!data.title || !data.publish_date || !data.pdf_file) {
      throw new Error("Title, publish date, and file are required");
    }

    //  Default frequency if not provided
    if (!data.frequency) {
      data.frequency = "daily";
    }

    //  Validate frequency
    if (!["daily", "weekly", "monthly"].includes(data.frequency)) {
      throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
    }

    // Validate publish date is not in the past for scheduled/published
    const publishDate = new Date(data.publish_date);
    const now = new Date();

    if (
      (data.status === "scheduled" || data.status === "published") &&
      publishDate < now
    ) {
      throw new Error(
        "Publish date cannot be in the past for scheduled/published newsletters",
      );
    }

    // Set default status if not provided
    if (!data.status) {
      data.status = publishDate <= now ? "published" : "scheduled";
    }

    const newsletter = new NewsletterPublish({
      ...data,
      is_email_sent: false,
      is_deleted: false,
    });

    await newsletter.save();

    // ============ AUTO-SEND FOR NEWLY CREATED PUBLISHED NEWSLETTERS ============
    if (newsletter.status === "published" && publishDate <= now) {
      console.log(
        ` Auto-sending emails for newly created newsletter: ${newsletter.title}`,
      );

      // Send emails asynchronously
      setTimeout(async () => {
        try {
          await newsletterPublishService.sendNewsletterEmails(
            newsletter._id.toString(),
          );
          console.log(` Newsletter emails sent for: ${newsletter.title}`);
        } catch (error) {
          console.error(` Failed to send emails:`, error);
        }
      }, 1000);
    }
    // ============ END OF FIX ============

    return newsletter;
  },

  /* ============================================
     4. Update newsletter publication
  ============================================ */
  update: async (
    id: string,
    updateData: Partial<INewsletterPublish>,
  ): Promise<INewsletterPublish | null> => {
    // Find existing newsletter
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    //  Validate frequency if updating it
    if (
      updateData.frequency &&
      !["daily", "weekly", "monthly"].includes(updateData.frequency)
    ) {
      throw new Error("Invalid frequency. Allowed: daily, weekly, monthly");
    }

    // Store old file path if updating file
    let oldFilePath: string | null = null;
    if (updateData.pdf_file && updateData.pdf_file !== newsletter.pdf_file) {
      oldFilePath = path.join(
        process.cwd(),
        "uploads",
        "newsletters",
        newsletter.pdf_file,
      );
    }

    // If updating status to published and publish date is today or past,
    // mark as ready for email sending
    if (updateData.status === "published") {
      const publishDate = updateData.publish_date
        ? new Date(updateData.publish_date)
        : newsletter.publish_date;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (publishDate <= now) {
        updateData.is_email_sent = false; // Reset for email sending
      }
    }

    // Store the original status before update
    const originalStatus = newsletter.status;

    // Update newsletter fields
    Object.assign(newsletter, updateData);
    newsletter.updated_at = new Date();

    await newsletter.save();

    // ============ CRITICAL FIX: AUTO-SEND EMAILS ============
    // Check if status changed to "published" and publish date has passed
    const isStatusChangedToPublished =
      newsletter.status === "published" && originalStatus !== "published";

    const now = new Date();
    if (
      isStatusChangedToPublished &&
      newsletter.publish_date <= now &&
      !newsletter.is_email_sent
    ) {
      console.log(` Auto-sending newsletter emails for: ${newsletter.title}`);

      // Send emails asynchronously (don't wait for it)
      setTimeout(async () => {
        try {
          await newsletterPublishService.sendNewsletterEmails(id);
          console.log(
            ` Newsletter emails sent successfully for: ${newsletter.title}`,
          );
        } catch (emailError) {
          console.error(` Failed to send newsletter emails:`, emailError);
          // Don't throw - update should still succeed even if email fails
        }
      }, 1000); // 1 second delay to not block the response
    }
    // ============ END OF FIX ============

    // Delete old file after successful update
    if (oldFilePath && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error("Failed to delete old file:", err);
      }
    }

    return newsletter;
  },

  /* ============================================
     5. Send newsletter emails to all subscribers
  ============================================ */
  sendNewsletterEmails: async (
    id: string,
  ): Promise<{
    success: boolean;
    message: string;
    totalRecipients: number;
    successful: number;
    failed: number;
  }> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    if (newsletter.is_email_sent) {
      throw new Error("Newsletter emails have already been sent");
    }

    const now = new Date();
    if (newsletter.publish_date > now && newsletter.status !== "published") {
      throw new Error("Newsletter publish date has not been reached yet");
    }

    const subscribers = await Newsletter.find({
      is_deleted: false,
      email: { $exists: true, $ne: "" },
    }).select("email name");

    if (subscribers.length === 0) {
      throw new Error("No subscribers found to send newsletter");
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "newsletters",
      newsletter.pdf_file,
    );

    if (!fs.existsSync(filePath)) {
      throw new Error("Newsletter file not found");
    }

    const subscriberEmails = subscribers
      .map((s) => s.email)
      .filter((email): email is string => !!email && email.includes("@"));

    let successfulDeliveries = 0;
    let failedDeliveries = 0;

    try {
      await emailService.newsletter(
        subscriberEmails,
        filePath,
        newsletter.title,
      );
      successfulDeliveries = subscriberEmails.length;
    } catch (error) {
      console.error("Failed to send newsletter emails:", error);
      failedDeliveries = subscriberEmails.length;
    }

    newsletter.is_email_sent = true;
    newsletter.email_sent_at = new Date();
    newsletter.total_recipients = subscriberEmails.length;
    newsletter.updated_at = new Date();

    if (newsletter.status === "scheduled") {
      newsletter.status = "published";
    }

    await newsletter.save();

    return {
      success: successfulDeliveries > 0,
      message:
        successfulDeliveries > 0
          ? `Newsletter sent to ${successfulDeliveries} subscribers`
          : "Failed to send newsletter emails",
      totalRecipients: subscriberEmails.length,
      successful: successfulDeliveries,
      failed: failedDeliveries,
    };
  },

  /* ============================================
     6. Publish newsletter immediately
  ============================================ */
  publishNow: async (id: string): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    newsletter.status = "published";
    newsletter.publish_date = new Date();
    newsletter.is_email_sent = false;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  /* ============================================
     7. Schedule newsletter for future date
  ============================================ */
  schedule: async (
    id: string,
    publishDate: Date,
  ): Promise<INewsletterPublish> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    const now = new Date();
    if (publishDate <= now) {
      throw new Error("Schedule date must be in the future");
    }

    newsletter.status = "scheduled";
    newsletter.publish_date = publishDate;
    newsletter.is_email_sent = false;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  /* ============================================
     8. Soft delete newsletter
  ============================================ */
  softDelete: async (id: string): Promise<INewsletterPublish | null> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    newsletter.is_deleted = true;
    newsletter.deleted_at = new Date();
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  /* ============================================
     9. Restore soft-deleted newsletter
  ============================================ */
  restore: async (id: string): Promise<INewsletterPublish | null> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter) {
      throw new Error("Newsletter publication not found");
    }

    newsletter.is_deleted = false;
    newsletter.deleted_at = undefined;
    newsletter.updated_at = new Date();

    return newsletter.save();
  },

  /* ============================================
     10. Get newsletters ready for sending (Cron job)
  ============================================ */
  getNewslettersReadyToSend: async (): Promise<INewsletterPublish[]> => {
    const now = new Date();

    return NewsletterPublish.find({
      is_deleted: false,
      is_email_sent: false,
      status: { $in: ["scheduled", "published"] },
      publish_date: { $lte: now },
    }).lean();
  },

  /* ============================================
     11. Upload file and return file info
  ============================================ */
  uploadFile: async (
    file: Express.Multer.File,
  ): Promise<{
    filename: string;
    originalname: string;
    size: number;
    mimetype: string;
    path: string;
  }> => {
    if (!file) {
      throw new Error("No file uploaded");
    }

    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      path: `/uploads/newsletters/${file.filename}`,
    };
  },

  /* ============================================
     12. Get file path for a newsletter
  ============================================ */
  getFilePath: async (id: string): Promise<string | null> => {
    const newsletter = await NewsletterPublish.findById(id);
    if (!newsletter || !newsletter.pdf_file) {
      return null;
    }

    return path.join(
      process.cwd(),
      "uploads",
      "newsletters",
      newsletter.pdf_file,
    );
  },
};
