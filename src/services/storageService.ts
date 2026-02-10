import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage } from "@/lib/firebase"; 
import { v4 as uuidv4 } from "uuid"; 

/**
 * 🟢 Upload Trade Image
 * Uploads to: users/{uid}/trade-images/{uuid}.png
 * Returns: HTTPS Download URL
 */
export const uploadTradeImage = async (
  userId: string, 
  file: File
): Promise<string> => {
  // 1. Strict Validation
  if (!file) {
    throw new Error("Upload failed: No file object provided");
  }
  if (!file.name) {
    throw new Error("Upload failed: File is missing a name property");
  }

  try {
    // 2. Generate Safe Filename
    // Handle files without extensions safely
    const parts = file.name.split('.');
    const fileExtension = parts.length > 1 ? parts.pop()?.toLowerCase() : 'png';
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // 3. Define Storage Path
    // We store in a general 'trade-images' folder for the user
    const path = `users/${userId}/trade-images/${fileName}`;
    const storageRef = ref(storage, path);

    // 4. Define Metadata (CRITICAL for preventing 412 Errors)
    const metadata = {
      contentType: file.type || 'application/octet-stream',
    };

    // 5. Upload with Metadata
    const snapshot = await uploadBytes(storageRef, file, metadata);

    // 6. Get & Return URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;

  } catch (error: any) {
    console.error("Image upload failed:", error);
    // Return a user-friendly error message
    throw new Error(error.message || "Failed to upload image");
  }
};

/**
 * 🔴 Delete Trade Image
 * Accepts the full download URL and deletes the file.
 */
export const deleteTradeImage = async (imageUrl: string) => {
  if (!imageUrl) return;
  
  try {
    // Create a reference from the full URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignore "Object not found" errors (file already deleted)
    if (error.code !== 'storage/object-not-found') {
      console.warn("Delete image failed:", error);
    }
  }
};