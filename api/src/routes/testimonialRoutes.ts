import express from "express";
import { body } from "express-validator";
import {
  createTestimonial,
  deleteTestimonial,
  getActiveTestimonials,
  getAllTestimonials,
  toggleTestimonialStatus,
  updateTestimonial,
} from "../controllers/testimonialController";
import { adminProtect } from "../middlewares/authMiddleware";
import { handleValidationErrors } from "../middlewares/validationMiddleware";

const router = express.Router();

const testimonialValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be an integer between 1 and 5"),
];

router.get("/", getActiveTestimonials);
router.get("/all", adminProtect, getAllTestimonials);
router.post(
  "/",
  adminProtect,
  testimonialValidators,
  handleValidationErrors,
  createTestimonial,
);
router.put(
  "/:id",
  adminProtect,
  testimonialValidators,
  handleValidationErrors,
  updateTestimonial,
);
router.delete("/:id", adminProtect, deleteTestimonial);
router.patch("/:id/toggle", adminProtect, toggleTestimonialStatus);

export default router;
