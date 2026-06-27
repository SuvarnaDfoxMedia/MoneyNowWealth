import TestimonialsSection from "@/components/Testimonials/TestimonialsSection";

export const revalidate = 300;

export default function TestimonialsPage() {
  return (
    <div className="pt-8">
      <TestimonialsSection mode="grid" showHeading={true} className="mb-0" />
    </div>
  );
}
