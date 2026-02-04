export const uploadToImgBB = async (base64Image: string, apiKey: string): Promise<string> => {
  const formData = new FormData();
  // Remove header for API
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
  formData.append('image', cleanBase64);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error(data.error?.message || "Upload failed");
    }
  } catch (error) {
    console.error("ImgBB Error:", error);
    throw error;
  }
};