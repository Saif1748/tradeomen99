import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  SettableMetadata
} from "firebase/storage";
import { storage } from "@/lib/firebase"; 
import { v4 as uuidv4 } from "uuid"; 

// --- 🛡️ CONFIGURATION & CONSTANTS ---

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_MB = 5;

/**
 * 🟢 Upload Trade Image
 * Uploads to: users/{uid}/trade-images/{uuid}.png
 * Includes strict validation and optimization metadata.
 */
export const uploadTradeImage = async (
  userId: string, 
  file: File
): Promise<string> => {
  // 1. Strict Validation (Industry Grade)
  if (!file) throw new Error("Upload failed: No file provided.");
  if (!file.name) throw new Error("Upload failed: Invalid file object.");
  
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: JPG, PNG, WEBP, GIF.`);
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File size exceeds limit of ${MAX_FILE_SIZE_MB}MB.`);
  }

  try {
    // 2. Generate Safe Filename
    const parts = file.name.split('.');
    const fileExtension = parts.length > 1 ? parts.pop()?.toLowerCase() : 'png';
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // 3. Define Storage Path
    const path = `users/${userId}/trade-images/${fileName}`;
    const storageRef = ref(storage, path);

    // 4. Define Metadata with Caching
    // Trade images are immutable (we delete/replace, never update), so we cache them forever.
    const metadata: SettableMetadata = {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000, immutable',
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId
      }
    };

    // 5. Upload
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // 6. Get URL
    return await getDownloadURL(snapshot.ref);

  } catch (error: any) {
    console.error("Image upload failed:", error);
    // Standardize error code handling
    if (error.code === 'storage/unauthorized') {
      throw new Error("Permission denied. Check your storage rules.");
    }
    throw new Error("Failed to upload image. Please try again.");
  }
};

/**
 * 🚀 PROXY AVATAR UPLOAD (Industry Standard)
 * Downloads an external image (Google/provider) and uploads it to our storage.
 * Adds aggressive caching headers to prevent 429s and speed up loading.
 */
export const uploadAvatarFromUrl = async (userId: string, photoUrl: string): Promise<string> => {
  if (!photoUrl) return "";

  try {
    // 1. Fetch the image (Client-side proxy)
    const response = await fetch(photoUrl);
    if (!response.ok) throw new Error("Failed to fetch external avatar");
    const blob = await response.blob();

    // 2. Define Path (Fixed name ensures we overwrite old avatars automatically)
    const path = `users/${userId}/avatar.jpg`;
    const storageRef = ref(storage, path);

    // 3. Metadata for caching (Cache for 1 year, Immutable)
    const metadata: SettableMetadata = {
      contentType: blob.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable', 
    };

    // 4. Upload
    const snapshot = await uploadBytes(storageRef, blob, metadata);

    // 5. Get Stable URL
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn("Avatar proxy upload failed (using original URL as fallback):", error);
    return photoUrl; // Graceful fallback to original URL if upload fails
  }
};

/**
 * 🔴 Delete Trade Image
 * Accepts the full download URL and deletes the file.
 */
export const deleteTradeImage = async (imageUrl: string) => {
  if (!imageUrl) return;
  
  try {
    // Firebase Storage ref() can take the full HTTPS URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore "Object not found" errors (idempotency)
    if (error.code !== 'storage/object-not-found') {
      console.warn("Delete image failed:", error);
    }
  }
};