import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";

const functions = getFunctions(app);

// =====================================================================
// 🏛️ OLAP SERVICE — AI-Powered BigQuery Analytics
// =====================================================================

export interface AiQueryResult {
  data: Record<string, any>[];
  rowCount: number;
  truncated: boolean;
}

export const olapService = {
  /**
   * 🔄 Creates the flattened SQL views in BigQuery.
   * Run this ONCE after installing the BigQuery extension.
   */
  syncViews: async (): Promise<{ success: boolean; message: string }> => {
    const fn = httpsCallable(functions, "createAnalyticsViews");
    const result = await fn();
    return result.data as { success: boolean; message: string };
  },

  /**
   * 📚 Fetches the database schema context for the LLM.
   * The AI uses this to understand what tables/columns exist.
   */
  getSchemaContext: async (): Promise<string> => {
    const fn = httpsCallable(functions, "getSchemaContext");
    const result = await fn();
    return (result.data as any).schema;
  },

  /**
   * 🤖 Executes an AI-generated SQL query securely.
   * 
   * FLOW:
   * 1. Frontend sends user's natural language question to LLM
   * 2. LLM generates SQL using the schema context
   * 3. This function sends the SQL to the Cloud Function
   * 4. Cloud Function validates, parameterizes, and executes against BigQuery
   * 5. Results are returned to the frontend for the AI to interpret
   * 
   * @param accountId - The active workspace ID (injected as @accountId parameter)
   * @param sql - The AI-generated SQL query (SELECT only)
   */
  executeQuery: async (accountId: string, sql: string): Promise<AiQueryResult> => {
    const fn = httpsCallable(functions, "executeAiQuery");
    const result = await fn({ accountId, sql });
    return result.data as AiQueryResult;
  },

  /**
   * 🧠 AI CHAT PIPELINE
   * Complete end-to-end flow: User question → LLM → SQL → BigQuery → Answer
   * 
   * This is the method your AI chat component should call.
   * 
   * @param accountId - Active workspace
   * @param userQuestion - Natural language question from the user
   * @param llmGenerateSQL - A callback function that takes (schema, question) and returns SQL
   *                         This allows you to plug in ANY LLM (OpenAI, Gemini, Claude, etc.)
   */
  askAI: async (
    accountId: string,
    userQuestion: string,
    llmGenerateSQL: (schemaContext: string, question: string) => Promise<string>
  ): Promise<{ sql: string; data: Record<string, any>[]; rowCount: number }> => {
    // Step 1: Get the schema context
    const schema = await olapService.getSchemaContext();

    // Step 2: Let the LLM generate the SQL
    const sql = await llmGenerateSQL(schema, userQuestion);

    // Step 3: Execute the query securely
    const result = await olapService.executeQuery(accountId, sql);

    return { sql, data: result.data, rowCount: result.rowCount };
  }
};
