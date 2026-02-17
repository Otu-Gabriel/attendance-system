"use client";

import { useState, useEffect } from "react";
import WebcamCapture from "./WebcamCapture";
import { extractFaceDescriptor, stringToDescriptor, isFaceMatch } from "@/lib/face-recognition";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

interface FaceRecognitionProps {
  storedDescriptor: string | null;
  onMatch: (imageData: string, descriptor?: Float32Array) => void;
  onNoMatch?: () => void;
  threshold?: number;
  disabled?: boolean;
  actionType?: "checkin" | "checkout";
}

export default function FaceRecognition({
  storedDescriptor,
  onMatch,
  onNoMatch,
  threshold = 0.6,
  disabled = false,
  actionType = "checkin",
}: FaceRecognitionProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  useEffect(() => {
    // Load face models on mount
    const loadModels = async () => {
      try {
        const { loadFaceModels } = await import("@/lib/face-recognition");
        await loadFaceModels();
        setIsLoadingModels(false);
      } catch (error) {
        toast.error("Failed to load face recognition models");
        setIsLoadingModels(false);
      }
    };
    loadModels();
  }, []);

  const handleCapture = async (imageData: string, descriptor: Float32Array) => {
    if (!storedDescriptor) {
      toast.error("No face data found. Please register your face first.");
      return;
    }

    setIsVerifying(true);

    try {
      const stored = stringToDescriptor(storedDescriptor);
      const isMatch = isFaceMatch(descriptor, stored, threshold);

      if (isMatch) {
        toast.success("Face recognized!");
        onMatch(imageData, descriptor);
      } else {
        toast.error("Face not recognized. Please try again.");
        onNoMatch?.();
      }
    } catch (error) {
      toast.error("Error verifying face. Please try again.");
      onNoMatch?.();
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoadingModels) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading face recognition models...</p>
      </div>
    );
  }

  return (
    <div>
      <WebcamCapture
        onCapture={handleCapture}
        disabled={disabled || isVerifying || !storedDescriptor}
        actionType={actionType}
      />
    </div>
  );
}
