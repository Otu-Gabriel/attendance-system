import * as faceapi from "face-api.js";

let modelsLoaded = false;

/**
 * Load Face API models
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    ]);
    modelsLoaded = true;
  } catch (error) {
    console.error("Error loading face models:", error);
    throw new Error("Failed to load face recognition models");
  }
}

/**
 * Extract face descriptor from an image
 */
export async function extractFaceDescriptor(
  image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return detection.descriptor;
}

/**
 * Compare two face descriptors and return similarity score
 * Returns a value between 0 and 1, where lower is more similar
 */
export function compareFaceDescriptors(
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
}

/**
 * Check if two faces match based on threshold
 */
export function isFaceMatch(
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.6
): boolean {
  const distance = compareFaceDescriptors(descriptor1, descriptor2);
  return distance < threshold;
}

/**
 * Convert Float32Array to JSON string for storage
 */
export function descriptorToString(descriptor: Float32Array): string {
  return JSON.stringify(Array.from(descriptor));
}

/**
 * Convert JSON string back to Float32Array
 */
export function stringToDescriptor(str: string): Float32Array {
  const array = JSON.parse(str);
  return new Float32Array(array);
}
