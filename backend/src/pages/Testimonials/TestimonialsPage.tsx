import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import AddEditTestimonial, {
  type TestimonialPayload,
} from "../../components/testimonials/AddEditTestimonial";
import TestimonialListing, {
  type TestimonialItem,
} from "../../components/tables/ListingComponents/TestimonialListing";
import { axiosApi } from "../../api/axios";

export default function TestimonialsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TestimonialItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: () => axiosApi.get<TestimonialItem[]>("/testimonials/all"),
  });

  const testimonials = useMemo(() => data?.data || [], [data]);
  const totalTestimonials = data?.total ?? testimonials.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const saveMutation = useMutation({
    mutationFn: async (payload: TestimonialPayload) => {
      if (editing?._id) {
        return axiosApi.update(`/testimonials/${editing._id}`, payload);
      }
      return axiosApi.post("/testimonials", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Testimonial updated" : "Testimonial created");
      setEditing(null);
      setIsFormOpen(false);
      invalidate();
    },
    onError: (err: any) => {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) return;
      toast.error(err?.response?.data?.message || "Failed to save testimonial");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosApi.remove(`/testimonials/${id}`),
    onSuccess: () => {
      toast.success("Testimonial deleted");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete testimonial");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => axiosApi.patch(`/testimonials/${id}/toggle`, {}),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to toggle status");
    },
  });

  return (
    <div className="bg-gray-50 min-h-screen p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-gray-800">Testimonials</h2>
        {!isFormOpen ? (
          <button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            className="bg-[#043f79] text-white px-3 py-2 rounded-md shadow-md flex items-center gap-2"
          >
            <FiPlus /> Add
          </button>
        ) : (
          <button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(false);
            }}
            className="flex items-center gap-2 bg-[#043f79] text-white px-4 py-2 rounded-md hover:bg-[#0654a4] transition"
          >
            <FiArrowLeft /> Back
          </button>
        )}
      </div>

      {isFormOpen && (
        <AddEditTestimonial
          initial={editing || undefined}
          loading={saveMutation.isPending}
          onSubmit={async (payload) => {
            await saveMutation.mutateAsync(payload);
          }}
        />
      )}

      {!isFormOpen && (
        <TestimonialListing
          data={testimonials}
          total={totalTestimonials}
          loading={isLoading}
          onEdit={(item) => {
            setEditing(item);
            setIsFormOpen(true);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
          onToggle={(id) => toggleMutation.mutate(id)}
        />
      )}
    </div>
  );
}
