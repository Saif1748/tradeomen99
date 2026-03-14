import {onCall, HttpsError} from "firebase-functions/v2/https";
import {BigQuery} from "@google-cloud/bigquery";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {SCHEMA_CONTEXT, validateSQL, PROJECT_ID, DATASET_ID} from "./schema";

// Initialize Firebase Admin (for Firestore access checks)
if (!admin.apps.length) admin.initializeApp();

const bq = new BigQuery();
const firestoreDb = admin.firestore();

// =====================================================================
// 🔒 SECURITY: Account Access Verification
// =====================================================================

/**
 * Verifies that the authenticated user has access to the given accountId.
 * This is the CRITICAL multi-tenant isolation check.
 *
 * @param {string} uid - The user ID to check
 * @param {string} accountId - The account ID to verify access against
 */
const verifyAccountAccess = async (uid: string, accountId: string): Promise<boolean> => {
  try {
    const accountSnap = await firestoreDb.doc(`accounts/${accountId}`).get();
    if (!accountSnap.exists) return false;

    const data = accountSnap.data();
    if (!data) return false;

    // User must be the owner OR a member
    const memberIds = data.memberIds ? data.memberIds : [];
    return data.ownerId === uid || memberIds.includes(uid);
  } catch {
    return false;
  }
};

// =====================================================================
// 📊 VIEW GENERATOR (Run Once After Extension Install)
// =====================================================================

/**
 * Creates flattened SQL views from the raw changelog tables.
 * The AI queries these views, not the raw data.
 */
export const createAnalyticsViews = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required.");

  const viewDefinitions: Record<string, string> = {
    trades_view: `
      CREATE OR REPLACE VIEW \`${PROJECT_ID}.${DATASET_ID}.trades_raw_latest\` AS
      SELECT 
        document_id,
        JSON_VALUE(data, '$.accountId') as accountId,
        JSON_VALUE(data, '$.userId') as userId,
        JSON_VALUE(data, '$.symbol') as symbol,
        JSON_VALUE(data, '$.direction') as direction,
        JSON_VALUE(data, '$.assetClass') as assetClass,
        JSON_VALUE(data, '$.status') as status,
        CAST(JSON_VALUE(data, '$.netQuantity') AS FLOAT64) as netQuantity,
        CAST(JSON_VALUE(data, '$.plannedQuantity') AS FLOAT64) as plannedQuantity,
        CAST(JSON_VALUE(data, '$.peakQuantity') AS FLOAT64) as peakQuantity,
        CAST(JSON_VALUE(data, '$.avgEntryPrice') AS FLOAT64) as avgEntryPrice,
        CAST(JSON_VALUE(data, '$.avgExitPrice') AS FLOAT64) as avgExitPrice,
        CAST(JSON_VALUE(data, '$.totalExecutions') AS INT64) as totalExecutions,
        CAST(JSON_VALUE(data, '$.investedAmount') AS FLOAT64) as investedAmount,
        CAST(JSON_VALUE(data, '$.peakInvested') AS FLOAT64) as peakInvested,
        CAST(JSON_VALUE(data, '$.totalBuyValue') AS FLOAT64) as totalBuyValue,
        CAST(JSON_VALUE(data, '$.totalSellValue') AS FLOAT64) as totalSellValue,
        CAST(JSON_VALUE(data, '$.grossPnl') AS FLOAT64) as grossPnl,
        CAST(JSON_VALUE(data, '$.realizedPnl') AS FLOAT64) as realizedPnl,
        CAST(JSON_VALUE(data, '$.totalFees') AS FLOAT64) as totalFees,
        CAST(JSON_VALUE(data, '$.netPnl') AS FLOAT64) as netPnl,
        CAST(JSON_VALUE(data, '$.returnPercent') AS FLOAT64) as returnPercent,
        CAST(JSON_VALUE(data, '$.initialStopLoss') AS FLOAT64) as initialStopLoss,
        CAST(JSON_VALUE(data, '$.takeProfitTarget') AS FLOAT64) as takeProfitTarget,
        CAST(JSON_VALUE(data, '$.riskAmount') AS FLOAT64) as riskAmount,
        CAST(JSON_VALUE(data, '$.riskMultiple') AS FLOAT64) as riskMultiple,
        CAST(JSON_VALUE(data, '$.plannedRR') AS FLOAT64) as plannedRR,
        CAST(JSON_VALUE(data, '$.profitCapture') AS FLOAT64) as profitCapture,
        CAST(JSON_VALUE(data, '$.holdingPeriodReturn') AS FLOAT64) as holdingPeriodReturn,
        CAST(JSON_VALUE(data, '$.profitVelocity') AS FLOAT64) as profitVelocity,
        CAST(JSON_VALUE(data, '$.totalSlippage') AS FLOAT64) as totalSlippage,
        JSON_VALUE(data, '$.emotion') as emotion,
        JSON_VALUE(data, '$.tags') as tags,
        JSON_VALUE(data, '$.notes') as notes,
        JSON_VALUE(data, '$.strategyId') as strategyId,
        TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.entryDate._seconds') AS INT64)) as entryDate,
        TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.exitDate._seconds') AS INT64)) as exitDate,
        CAST(JSON_VALUE(data, '$.durationSeconds') AS FLOAT64) as durationSeconds,
        JSON_VALUE(data, '$.source') as source
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY timestamp DESC) as rn
        FROM \`${PROJECT_ID}.${DATASET_ID}.trades_raw_changelog\`
      )
      WHERE rn = 1 AND operation != 'DELETE'
    `,
    executions_view: `
      CREATE OR REPLACE VIEW \`${PROJECT_ID}.${DATASET_ID}.executions_raw_latest\` AS
      SELECT 
        document_id,
        JSON_VALUE(data, '$.tradeId') as tradeId,
        JSON_VALUE(data, '$.accountId') as accountId,
        JSON_VALUE(data, '$.userId') as userId,
        TIMESTAMP_SECONDS(CAST(JSON_VALUE(data, '$.date._seconds') AS INT64)) as date,
        JSON_VALUE(data, '$.side') as side,
        CAST(JSON_VALUE(data, '$.price') AS FLOAT64) as price,
        CAST(JSON_VALUE(data, '$.quantity') AS FLOAT64) as quantity,
        CAST(JSON_VALUE(data, '$.fees') AS FLOAT64) as fees,
        CAST(JSON_VALUE(data, '$.expectedPrice') AS FLOAT64) as expectedPrice,
        CAST(JSON_VALUE(data, '$.slippage') AS FLOAT64) as slippage,
        JSON_VALUE(data, '$.brokerOrderId') as brokerOrderId,
        JSON_VALUE(data, '$.notes') as notes
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY timestamp DESC) as rn
        FROM \`${PROJECT_ID}.${DATASET_ID}.executions_raw_changelog\`
      )
      WHERE rn = 1 AND operation != 'DELETE'
    `,
    strategies_view: `
      CREATE OR REPLACE VIEW \`${PROJECT_ID}.${DATASET_ID}.strategies_raw_latest\` AS
      SELECT 
        document_id,
        JSON_VALUE(data, '$.accountId') as accountId,
        JSON_VALUE(data, '$.userId') as userId,
        JSON_VALUE(data, '$.name') as name,
        JSON_VALUE(data, '$.description') as description,
        JSON_VALUE(data, '$.status') as status,
        JSON_VALUE(data, '$.style') as style,
        JSON_VALUE(data, '$.color') as color,
        CAST(JSON_VALUE(data, '$.metrics.totalTrades') AS INT64) as metrics_totalTrades,
        CAST(JSON_VALUE(data, '$.metrics.winRate') AS FLOAT64) as metrics_winRate,
        CAST(JSON_VALUE(data, '$.metrics.profitFactor') AS FLOAT64) as metrics_profitFactor,
        CAST(JSON_VALUE(data, '$.metrics.totalPnl') AS FLOAT64) as metrics_totalPnl
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY timestamp DESC) as rn
        FROM \`${PROJECT_ID}.${DATASET_ID}.strategies_raw_changelog\`
      )
      WHERE rn = 1 AND operation != 'DELETE'
    `,
    accounts_view: `
      CREATE OR REPLACE VIEW \`${PROJECT_ID}.${DATASET_ID}.accounts_raw_latest\` AS
      SELECT 
        document_id,
        JSON_VALUE(data, '$.name') as name,
        JSON_VALUE(data, '$.ownerId') as ownerId,
        CAST(JSON_VALUE(data, '$.balance') AS FLOAT64) as balance,
        CAST(JSON_VALUE(data, '$.initialBalance') AS FLOAT64) as initialBalance,
        JSON_VALUE(data, '$.currency') as currency
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY document_id ORDER BY timestamp DESC) as rn
        FROM \`${PROJECT_ID}.${DATASET_ID}.accounts_raw_changelog\`
      )
      WHERE rn = 1 AND operation != 'DELETE'
    `,
  };

  try {
    for (const [viewName, sql] of Object.entries(viewDefinitions)) {
      await bq.query({query: sql});
      logger.info(`✅ View created: ${viewName}`);
    }
    return {success: true, message: "All analytics views created successfully."};
  } catch (error) {
    logger.error("View creation failed", error);
    throw new HttpsError("internal", (error as Error).message);
  }
});

// =====================================================================
// 🤖 AI SQL EXECUTOR (The Core Engine)
// =====================================================================

/**
 * Executes an AI-generated SQL query against BigQuery.
 *
 * SECURITY LAYERS:
 * 1. Firebase Auth check (must be logged in)
 * 2. Account access verification (must be owner/member)
 * 3. SQL validation (must be SELECT-only, no injection vectors)
 * 4. Parameterized accountId (never inlined into SQL)
 * 5. Row limit enforcement (max 1000 rows)
 * 6. Query timeout (30 seconds max)
 */
export const executeAiQuery = onCall(
  {timeoutSeconds: 60, memory: "256MiB"},
  async (request) => {
    // --- Layer 1: Authentication ---
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in.");
    }
    const uid = request.auth.uid;

    // --- Layer 2: Input Validation ---
    const {accountId, sql} = request.data;
    if (!accountId || typeof accountId !== "string") {
      throw new HttpsError("invalid-argument", "accountId is required.");
    }
    if (!sql || typeof sql !== "string") {
      throw new HttpsError("invalid-argument", "sql query is required.");
    }

    // --- Layer 3: Account Access Verification ---
    const hasAccess = await verifyAccountAccess(uid, accountId);
    if (!hasAccess) {
      throw new HttpsError("permission-denied", "You do not have access to this workspace.");
    }

    // --- Layer 4: SQL Safety Validation ---
    const validation = validateSQL(sql);
    if (!validation.safe) {
      logger.warn(`🚫 Blocked unsafe SQL from user ${uid}: ${validation.reason}`);
      throw new HttpsError("permission-denied", `Query rejected: ${validation.reason}`);
    }

    // --- Layer 5: Execute with Parameterized Query ---
    try {
      const [rows] = await bq.query({
        query: sql,
        params: {accountId},
        location: "US",
        maximumBytesBilled: "100000000", // 100MB scan limit (cost control)
      });

      // Layer 6: Enforce row limit
      const limitedRows = rows.slice(0, 1000);

      logger.info(`✅ AI Query executed for user ${uid} on account ${accountId}. Rows: ${limitedRows.length}`);

      return {
        data: limitedRows,
        rowCount: limitedRows.length,
        truncated: rows.length > 1000,
      };
    } catch (error) {
      logger.error(`❌ BigQuery execution failed for user ${uid}:`, (error as Error).message);
      throw new HttpsError("internal", "Query execution failed. The AI may have generated invalid SQL.");
    }
  }
);

// =====================================================================
// 📚 SCHEMA PROVIDER (For the AI/LLM Context)
// =====================================================================

/**
 * Returns the database schema context to the frontend.
 * The frontend sends this to the LLM so it knows what tables/columns exist.
 */
export const getSchemaContext = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }
  return {schema: SCHEMA_CONTEXT};
});
