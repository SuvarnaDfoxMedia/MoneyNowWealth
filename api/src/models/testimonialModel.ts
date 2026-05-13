import mongoose, { Document, Schema } from "mongoose";

export interface ITestimonial extends Document {
  image: string;
  name: string;
  designation: string;
  description: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const testimonialSchema = new Schema<ITestimonial>(
  {
    image: { type: String, trim: true, default: "" },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
  },
);

const Testimonial = mongoose.model<ITestimonial>(
  "Testimonial",
  testimonialSchema,
);

export default Testimonial;
