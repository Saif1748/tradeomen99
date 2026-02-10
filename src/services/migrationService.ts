import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile } from "@/types/account";

/**
 * 🛡️ Auto-Repair Account Schema (Industry Grade)
 * This function checks if the user's accounts are missing the critical 'memberIds' field
 * and fixes them on the fly.
 * * FEATURES:
 * - Non-blocking: Runs in background
 * - Fault Tolerant: One bad account won't stop others from being fixed
 * - Permission Safe: Handles cases where user lost access to an account gracefully
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
    // We run these in parallel, but handle errors for each one separately.
    const repairPromises = accountIds.map(async (accountId) => {
      try {
        const accountRef = doc(db, "accounts", accountId);
        
        // This read is allowed by "allow get" rules if user is in 'members' map
        const accountSnap = await getDoc(accountRef);

        if (accountSnap.exists()) {
          const data = accountSnap.data();
          
          // 🚨 DETECTION: The field is missing!
          if (!data.memberIds || !Array.isArray(data.memberIds)) {
            console.log(`🔧 [Migration] Upgrading account schema: ${data.name || accountId}`);
            
            // RECOVERY: Extract valid UIDs from the old 'members' map
            const extractedIds = Object.keys(data.members || {});
            
            // Safety: Ensure current user is included so they don't lock themselves out
            if (!extractedIds.includes(userId)) {
               extractedIds.push(userId);
            }

            // EXECUTE REPAIR
            await updateDoc(accountRef, {
              memberIds: extractedIds
            });
            console.log(`✅ [Migration] Account ${accountId} repaired successfully.`);
          }
        }
      } catch (innerError: any) {
        // 🛑 GRACEFUL FAILURE
        // If we get "Missing permissions", it means the user was removed from this account
        // or the account was deleted. We simply skip it.
        if (innerError.code === 'permission-denied') {
          console.warn(`⚠️ [Migration] Skipped inaccessible account (Permission Denied): ${accountId}`);
        } else {
          console.error(`❌ [Migration] Error processing account ${accountId}:`, innerError);
        }
      }
    });

    // Run all repairs in parallel
    await Promise.all(repairPromises);

  } catch (error) {
    console.error("⚠️ [Migration] General failure in auto-repair service:", error);
  }
};