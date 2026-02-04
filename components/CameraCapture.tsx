import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface CameraHandle {
  capture: () => string | null;
}

interface Props {
  className?: string;
}

const CameraCapture = forwardRef<CameraHandle, Props>(({ className }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Target Aspect Ratio: 9:16
        const targetRatio = 9 / 16;
        const videoRatio = video.videoWidth / video.videoHeight;
        
        // Calculate crop dimensions
        let sWidth, sHeight, sX, sY;
        
        if (videoRatio > targetRatio) {
          // Video is wider than target (e.g., 16:9 video, 9:16 target)
          // Crop width, keep height
          sHeight = video.videoHeight;
          sWidth = sHeight * targetRatio;
          sX = (video.videoWidth - sWidth) / 2;
          sY = 0;
        } else {
          // Video is taller (unlikely for webcam, but possible)
          sWidth = video.videoWidth;
          sHeight = sWidth / targetRatio;
          sX = 0;
          sY = (video.videoHeight - sHeight) / 2;
        }

        const canvas = document.createElement('canvas');
        // Set resolution to high quality 9:16
        canvas.width = 1080;
        canvas.height = 1920; 
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Mirror horizontally
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          
          // Draw cropped portion
          ctx.drawImage(
            video, 
            sX, sY, sWidth, sHeight, // Source crop
            0, 0, canvas.width, canvas.height // Dest
          );
          
          return canvas.toDataURL('image/jpeg', 0.92);
        }
      }
      return null;
    }
  }));

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        // Request high resolution front camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 4096 }, 
            height: { ideal: 2160 } 
          },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Camera access denied or not available.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (error) {
    return <div className="flex items-center justify-center h-full bg-slate-800 text-red-400 p-4 text-center">{error}</div>;
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover transform -scale-x-100" // Mirrors the feed
      />
    </div>
  );
});

export default CameraCapture;