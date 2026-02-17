"use client";

import { useRef, useEffect, useState } from "react";
import { extractFaceDescriptor } from "@/lib/face-recognition";
import Button from "@/components/ui/Button";

interface WebcamCaptureProps {
  onCapture: (imageData: string, descriptor: Float32Array) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  actionType?: "checkin" | "checkout";
}

export default function WebcamCapture({
  onCapture,
  onError,
  disabled = false,
  actionType = "checkin",
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initCamera = async () => {
      if (isMounted) {
        await startCamera();
      }
    };
    
    initCamera();
    
    return () => {
      isMounted = false;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Handle play() promise properly to avoid AbortError
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsStreaming(true);
              setError(null);
            })
            .catch((err) => {
              // Ignore AbortError - it's expected when component unmounts
              if (err.name !== "AbortError") {
                console.error("Error playing video:", err);
                setError("Failed to start camera video");
                onError?.("Failed to start camera video");
              }
            });
        }
      }
    } catch (err) {
      const errorMessage = "Failed to access camera. Please check permissions.";
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current || disabled || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Extract face descriptor
      const descriptor = await extractFaceDescriptor(video);

      if (!descriptor) {
        throw new Error("No face detected. Please ensure your face is clearly visible.");
      }

      // Convert canvas to base64
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      onCapture(imageData, descriptor);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to capture face";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          onLoadedMetadata={() => {
            // Ensure video plays when metadata is loaded
            if (videoRef.current && !isStreaming) {
              videoRef.current.play().catch(() => {
                // Ignore play errors
              });
            }
          }}
        />
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">Loading camera...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
            <p className="text-center text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <Button
        onClick={capture}
        disabled={disabled || !isStreaming || isProcessing}
        className="w-full"
        variant={actionType === "checkout" ? "default" : "default"}
      >
        {isProcessing
          ? "Processing..."
          : disabled
          ? "Camera Disabled"
          : actionType === "checkout"
          ? "Check Out"
          : "Check In"}
      </Button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
