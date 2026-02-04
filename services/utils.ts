export const convertBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(blob);
  });
};

export const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return convertBlobToBase64(blob);
};

export const cropTo916 = (base64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if(!ctx) { resolve(base64); return; }

      const targetRatio = 9/16;
      const imgRatio = img.width / img.height;

      let sWidth, sHeight, sX, sY;

      if (imgRatio > targetRatio) {
          // Image is wider than target. Crop width.
          sHeight = img.height;
          sWidth = sHeight * targetRatio;
          sX = (img.width - sWidth) / 2;
          sY = 0;
      } else {
          // Image is taller. Crop height.
          sWidth = img.width;
          sHeight = sWidth / targetRatio;
          sX = 0;
          sY = (img.height - sHeight) / 2;
      }

      ctx.drawImage(img, sX, sY, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = base64;
  });
};

// Adds the HKAPA Watermark
export const addWatermark = async (base64Image: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Image);
        return;
      }

      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // --- Watermark Logic ---
      const w = canvas.width;
      const h = canvas.height;

      // Semi-transparent backdrop
      const barHeight = h * 0.08; // 8% of height
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'; // Slate-900 with opacity
      ctx.fillRect(0, h - barHeight, w, barHeight);

      // Gold line top
      ctx.fillStyle = '#C0A062'; // Metallic Gold
      ctx.fillRect(0, h - barHeight, w, h * 0.005);

      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${h * 0.03}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('HKAPA Film & TV Library 2026', w / 2, h - (barHeight / 2));

      // Return new base64
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = base64Image;
  });
};