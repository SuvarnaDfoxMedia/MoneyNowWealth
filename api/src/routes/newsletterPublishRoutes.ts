import express from "express";
import {
  getNewsletterPublications,
  getNewsletterPublicationById,
  createNewsletterPublication,
  updateNewsletterPublication,
  sendNewsletterEmails,
  publishNewsletterNow,
  scheduleNewsletter,
  deleteNewsletterPublication,
  restoreNewsletterPublication,
  uploadNewsletterFileOnly,
  uploadNewsletterFile,
  toggleNewsletterStatus,
} from "../controllers/newsletterPublishController";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware";

const router = express.Router();

/* ============================================
   PUBLIC ROUTES (Read-only access)
============================================ */

// Get all newsletter publications (public listing)
router.get("/newsletter-publications", getNewsletterPublications);

// Get single newsletter publication by ID
router.get("/newsletter-publications/:id", getNewsletterPublicationById);

/* ============================================
   ADMIN ROUTES (Protected)
============================================ */

// Helper function to apply admin middleware with optional file upload
const applyAdminMiddleware = (handler: any, withFileUpload = false) => {
  const middleware = roleFromUrl(["admin"]);

  if (withFileUpload) {
    return [...middleware, uploadNewsletterFile, handler];
  }

  return [...middleware, handler];
};

router.get("/:role/newsletter-publications", getNewsletterPublications);
router.get("/:role/newsletter-publications/:id", getNewsletterPublicationById);

/* ---------------------------------------------------
   ADMIN: Create new newsletter publication (with file upload)
--------------------------------------------------- */
router.post(
  "/:role/newsletter-publications/create",
  ...applyAdminMiddleware(createNewsletterPublication, true),
);

/* ---------------------------------------------------
   ADMIN: Update newsletter publication (supports both with and without file)
--------------------------------------------------- */
router.put(
  "/:role/newsletter-publications/edit/:id",
  ...applyAdminMiddleware(updateNewsletterPublication, true), // Always allow file upload for updates
);

/* ---------------------------------------------------
   ADMIN: Send newsletter emails to subscribers
--------------------------------------------------- */
router.post(
  "/:role/newsletter-publications/:id/send-emails",
  ...applyAdminMiddleware(sendNewsletterEmails),
);

/* ---------------------------------------------------
   ADMIN: Publish newsletter immediately
--------------------------------------------------- */
router.post(
  "/:role/newsletter-publications/:id/publish-now",
  ...applyAdminMiddleware(publishNewsletterNow),
);

/* ---------------------------------------------------
   ADMIN: Schedule newsletter for future date
--------------------------------------------------- */
router.post(
  "/:role/newsletter-publications/:id/schedule",
  ...applyAdminMiddleware(scheduleNewsletter),
);

/* ---------------------------------------------------
   ADMIN: Soft delete newsletter publication
--------------------------------------------------- */
router.delete(
  "/:role/newsletter-publications/delete/:id",
  ...applyAdminMiddleware(deleteNewsletterPublication),
);

/* ---------------------------------------------------
   ADMIN: Restore soft-deleted newsletter
--------------------------------------------------- */
router.patch(
  "/:role/newsletter-publications/restore/:id",
  ...applyAdminMiddleware(restoreNewsletterPublication),
);

/* ---------------------------------------------------
   ADMIN: Upload file only (any file type)
--------------------------------------------------- */
router.post(
  "/:role/newsletter-publications/upload-file",
  ...applyAdminMiddleware(uploadNewsletterFile, true),
  uploadNewsletterFileOnly,
);

router.patch(
  "/:role/newsletter-publications/toggle-status/:id",
  ...applyAdminMiddleware(toggleNewsletterStatus),
);

export default router;
