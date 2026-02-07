import { doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, Account } from "@/types/account";

/**
 * 🛡️ Auto-Repair Account Schema
 * This function checks if the user's accounts are missing the critical 'memberIds' field
 * and fixes them on the fly.
 * * WHY: This bridges the gap between your old data (Map-based) and new code (Array-based).
 */
export const repairAccountSchema = async (userId: string) => {
  if (!userId) return;

  try {
    // 1. Fetch User Profile to see which accounts they CLAIM to be in
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return;

    const userData = userSnap.data() as UserProfile;
    const accountIds = userData.joinedAccountIds || [];

    if (accountIds.length === 0) return;

    // 2. Check each account individually
    // We use 'getDoc' (fetch by ID) because your Security Rules ALLOW this 
    // via the 'members' map check, even if the 'list' query fails.
    const repairPromises = accountIds.map(async (accountId) => {
      const accountRef = doc(db, "accounts", accountId);
      const accountSnap = await getDoc(accountRef);

      if (accountSnap.exists()) {
        const data = accountSnap.data();
        
        // 🚨 DETECTION: The field is missing!
        if (!data.memberIds || !Array.isArray(data.memberIds)) {
          console.log(`🔧 [Migration] Upgrading account: ${data.name || accountId}`);
          
          // RECOVERY: Extract valid UIDs from the old 'members' map
          // This creates the missing array from existing data
          const extractedIds = Object.keys(data.members || {});
          
          // If for some reason the map is empty but user claims to be in it, add them safely
          if (!extractedIds.includes(userId)) {
             extractedIds.push(userId);
          }

          // EXECUTE REPAIR
          await updateDoc(accountRef, {
            memberIds: extractedIds
          });
          console.log(`✅ [Migration] Account ${accountId} repaired.`);
        }
      }
    });

    // Run all repairs in parallel
    await Promise.all(repairPromises);

  } catch (error) {
    console.error("⚠️ [Migration] Auto-repair encountered an issue:", error);
    // We swallow the error so the app doesn't crash. 
    // The user might see an empty list, but they can retry refreshing.
  }
};