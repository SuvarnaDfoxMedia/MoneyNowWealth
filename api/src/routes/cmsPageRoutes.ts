// import express from "express";

// import {
//   getPages,
//   getPageById,
//   addPage,
//   updatePage,
//   togglePageStatus,
//   deletePage,
// } from "../controllers/cmsPageController.js";

// import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";

// const router = express.Router();

// /* -------------------- PUBLIC ROUTES -------------------- */
// router.get("/cmspages", getPages); // list all pages
// router.get("/cmspages/:id", getPageById); // get single page

// /* -------------------- ADMIN-ONLY MIDDLEWARE -------------------- */
// const adminMiddleware = roleFromUrl(["admin"]);

// /* -------------------- ADMIN ROUTES -------------------- */
// router.get("/:role/cmspages", adminMiddleware, getPages); 
// router.get("/:role/cmspages/:id", adminMiddleware, getPageById);

// router.post("/:role/cmspages/create", adminMiddleware, addPage);

// router.put("/:role/cmspages/edit/:id", adminMiddleware, updatePage);

// router.patch(
//   "/:role/cmspages/change/:id/status",
//   adminMiddleware,
//   togglePageStatus
// );

// router.delete("/:role/cmspages/delete/:id", adminMiddleware, deletePage);

// export default router;



import express from "express";
import {
  getPages,
  getPageById,
  addPage,
  updatePage,
  togglePageStatus,
  deletePage,
} from "../controllers/cmsPageController.js";
import { roleFromUrl } from "../middlewares/roleUrlMiddleware.js";
import multer from "multer";
const upload = multer(); // no storage needed for text fields only


const router = express.Router();

/* -------------------- PUBLIC ROUTES -------------------- */
router.get("/cmspages", getPages); // list all pages
router.get("/cmspages/:id", getPageById); // get single page

/* -------------------- ADMIN ROUTES -------------------- */
const adminMiddleware = roleFromUrl(["admin"]);

// CREATE CMS PAGE
router.post(
  "/:role/cmspages/create",
  ...adminMiddleware,
  upload.none(),   // <-- parse FormData
  addPage
);

// UPDATE CMS PAGE
router.put(
  "/:role/cmspages/edit/:id",
  ...adminMiddleware,
  upload.none(),   // <-- parse FormData
  updatePage
);

router.patch("/:role/cmspages/toggle-status/:id", ...adminMiddleware, togglePageStatus);

router.delete("/:role/cmspages/delete/:id", ...adminMiddleware, deletePage);

export default router;
