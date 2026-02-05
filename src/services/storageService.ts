import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { storage } from "@/lib/firebase"; // Ensure you export 'storage' from firebase.ts
import { v4 as uuidv4 } from "uuid"; // Run: npm install uuid @types/uuid

// Define where the image belongs
type ImageType = "SCREENSHOT" | "NOTE_ATTACHMENT";

/**
 * Uploads an image to the user's specific trade folder.
 * Returns the secure Download URL.
 */
export const uploadTradeImage = async (
  userId: string, 
  tradeId: string, 
  file: File, 
  type: ImageType
): Promise<string> => {
  try {
    // 1. Generate a unique safe filename
    // Structure: users/{uid}/trades/{tradeId}/{type}s/{uuid}.jpg
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const folder = type === "SCREENSHOT" ? "screenshots" : "notes";
    
    const path = `users/${userId}/trades/${tradeId}/${folder}/${fileName}`;
    const storageRef = ref(storage, path);

    // 2. Upload the raw bytes
    const snapshot = await uploadBytes(storageRef, file);

    // 3. Get the URL immediately for the UI
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;

  } catch (error) {
    console.error("Image upload failed:", error);
    throw new Error("Failed to upload image");
  }
};

/**
 * Deletes an image from storage (Cleanup)
 * You pass the full Download URL, we figure out the ref.
 */
export const deleteTradeImage = async (imageUrl: string) => {
  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Delete failed:", error);
    // Don't throw here, sometimes the file is already gone
  }
};