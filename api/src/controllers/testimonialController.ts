import type { Request, Response } from "express";
import Testimonial from "../models/testimonialModel";
import { sendError, sendSuccess } from "../utils/apiResponse";

export const getActiveTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({
      order: 1,
      createdAt: -1,
    });

    return sendSuccess(
      res,
      "Testimonials fetched successfully",
      testimonials,
      200,
      { total: testimonials.length },
    );
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to fetch testimonials",
      500,
    );
  }
};

export const getAllTestimonials = async (_req: Request, res: Response) => {
  try {
    const testimonials = await Testimonial.find().sort({
      order: 1,
      createdAt: -1,
    });

    return sendSuccess(
      res,
      "All testimonials fetched successfully",
      testimonials,
      200,
      { total: testimonials.length },
    );
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to fetch testimonials",
      500,
    );
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.create({
      image: req.body.image || "",
      name: req.body.name,
      designation: req.body.designation || "",
      description: req.body.description,
      rating: Number(req.body.rating),
      isActive:
        typeof req.body.isActive === "boolean" ? req.body.isActive : true,
      order:
        typeof req.body.order === "number"
          ? req.body.order
          : Number(req.body.order ?? 0),
    });

    return sendSuccess(
      res,
      "Testimonial created successfully",
      testimonial,
      201,
    );
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to create testimonial",
      500,
    );
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      {
        image: req.body.image,
        name: req.body.name,
        designation: req.body.designation,
        description: req.body.description,
        rating: Number(req.body.rating),
        ...(req.body.order !== undefined
          ? { order: Number(req.body.order) }
          : {}),
        ...(req.body.isActive !== undefined
          ? { isActive: Boolean(req.body.isActive) }
          : {}),
      },
      { new: true, runValidators: true },
    );

    if (!testimonial) {
      return sendError(res, "Testimonial not found", 404);
    }

    return sendSuccess(res, "Testimonial updated successfully", testimonial);
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to update testimonial",
      500,
    );
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!testimonial) {
      return sendError(res, "Testimonial not found", 404);
    }

    return sendSuccess(
      res,
      "Testimonial soft deleted successfully",
      testimonial,
    );
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to delete testimonial",
      500,
    );
  }
};

export const toggleTestimonialStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return sendError(res, "Testimonial not found", 404);
    }

    testimonial.isActive = !testimonial.isActive;
    await testimonial.save();

    return sendSuccess(
      res,
      `Testimonial ${
        testimonial.isActive ? "activated" : "deactivated"
      } successfully`,
      testimonial,
    );
  } catch (error: any) {
    return sendError(
      res,
      error?.message || "Failed to toggle testimonial status",
      500,
    );
  }
};
