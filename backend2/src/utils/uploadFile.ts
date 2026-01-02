// src/utils/uploadFile.ts
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("File upload failed");
    }

    const data = await response.json();
    // assuming backend responds with: { success: true, filePath: "/uploads/hero-image.jpg" }
    return data.filePath;
  } catch (error) {
    console.error("Upload error:", error);
    return "";
  }
};
