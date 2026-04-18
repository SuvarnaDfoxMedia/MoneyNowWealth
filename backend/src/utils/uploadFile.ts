export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const apiBase =
    (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || "/api";

  try {
    const response = await fetch(`${apiBase}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const data = await response.json();
    return data.filePath;
  } catch {
    return "";
  }
};
