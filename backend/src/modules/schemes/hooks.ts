import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSchemeById, fetchSchemes } from "./api";

export const useSchemes = (
  role: string,
  params: { search?: string; page?: number; limit?: number },
) =>
  useQuery({
    queryKey: [role, "schemes", params],
    queryFn: () => fetchSchemes(role, params),
    placeholderData: keepPreviousData,
  });

export const useScheme = (role: string, id: string) =>
  useQuery({
    queryKey: [role, "schemes", id],
    queryFn: () => fetchSchemeById(role, id),
    enabled: Boolean(id),
  });
