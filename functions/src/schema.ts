/* eslint-disable */
/**
 * 🧠 SCHEMA CONTEXT FOR AI/LLM
 * 
 * This file defines the BigQuery schema that gets injected into the LLM's
 * system prompt. The AI uses this to write accurate SQL queries.
 * 
 * SECURITY: This is server-side only. The schema is never exposed to the client.
 */

export const PROJECT_ID = "tradeomen-cea1d";
export const DATASET_ID = "tradeomen_olap";

/**
 * The schema context string that gets sent to the LLM.
 * This acts as the "brain" that teaches the AI about your database.
 */
export const SCHEMA_CONTEXT = `
You are a SQL query generator for a trading journal SaaS application called TradeOmen.
You have access to a BigQuery dataset called \`${PROJECT_ID}.${DATASET_ID}\`.

## Available Tables

### 1. \`${PROJECT_ID}.${DATASET_ID}.trades_raw_latest\` (Primary - Trade Performance)
| Column | Type | Description |
|--------|------|-------------|
| document_id | STRING | Unique trade ID |
| accountId | STRING | Workspace isolation key (ALWAYS filter by this) |
| userId | STRING | Owner of the trade |
| symbol | STRING | Ticker symbol (e.g. "AAPL", "BTCUSD") |
| direction | STRING | "LONG" or "SHORT" |
| assetClass | STRING | "STOCK", "CRYPTO", "FOREX", "FUTURES", "OPTIONS", "INDEX" |
| status | STRING | "OPEN" or "CLOSED" |
| netQuantity | FLOAT64 | Current open position size (0 = closed) |
| plannedQuantity | FLOAT64 | Intended full position size |
| peakQuantity | FLOAT64 | Max position size reached |
| avgEntryPrice | FLOAT64 | Weighted average entry price |
| avgExitPrice | FLOAT64 | Weighted average exit price |
| totalExecutions | INT64 | Number of fills/executions |
| investedAmount | FLOAT64 | Current cost basis |
| peakInvested | FLOAT64 | Max capital deployed |
| totalBuyValue | FLOAT64 | Sum of all buy fills |
| totalSellValue | FLOAT64 | Sum of all sell fills |
| grossPnl | FLOAT64 | Realized + unrealized PnL before fees |
| realizedPnl | FLOAT64 | Locked-in PnL from closed legs |
| totalFees | FLOAT64 | Sum of all commissions/fees |
| netPnl | FLOAT64 | Final PnL after fees (THE key metric) |
| returnPercent | FLOAT64 | ROI percentage |
| initialStopLoss | FLOAT64 | User's stop loss price |
| takeProfitTarget | FLOAT64 | User's take profit price |
| riskAmount | FLOAT64 | Dollar risk per trade |
| riskMultiple | FLOAT64 | R-Multiple (netPnl / riskAmount) |
| plannedRR | FLOAT64 | Planned risk:reward ratio |
| profitCapture | FLOAT64 | Efficiency vs planned reward (%) |
| holdingPeriodReturn | FLOAT64 | Capital efficiency (%) |
| profitVelocity | FLOAT64 | PnL per hour |
| totalSlippage | FLOAT64 | Execution quality cost |
| emotion | STRING | "CONFIDENT","NEUTRAL","FEARFUL","GREEDY","REVENGING","FOMO","HESITANT" |
| tags | STRING | Comma-separated tags |
| notes | STRING | User's trade notes |
| strategyId | STRING | Foreign key to strategies table |
| entryDate | TIMESTAMP | Date of first execution |
| exitDate | TIMESTAMP | Date of last execution (if closed) |
| durationSeconds | FLOAT64 | How long the trade was held |
| source | STRING | "MANUAL", "IMPORT", or "API" |

### 2. \`${PROJECT_ID}.${DATASET_ID}.executions_raw_latest\` (Trade Fills/Executions)
| Column | Type | Description |
|--------|------|-------------|
| document_id | STRING | Unique execution ID |
| tradeId | STRING | Foreign key to trades table |
| accountId | STRING | Workspace isolation key |
| userId | STRING | User who executed the trade |
| date | TIMESTAMP | Exact fill time |
| side | STRING | "BUY" or "SELL" |
| price | FLOAT64 | Execution fill price |
| quantity | FLOAT64 | Amount filled (always positive) |
| fees | FLOAT64 | Commission + Swap + SEC fees |
| expectedPrice | FLOAT64 | The Limit/Stop price (used to calc slippage) |
| slippage | FLOAT64 | Calculated: abs(Fill - Expected) * Quantity |
| brokerOrderId | STRING | External Broker ID |
| notes | STRING | Execution notes |

### 2. \`${PROJECT_ID}.${DATASET_ID}.strategies_raw_latest\` (Strategy Playbooks)
| Column | Type | Description |
|--------|------|-------------|
| document_id | STRING | Unique strategy ID |
| accountId | STRING | Workspace isolation key |
| name | STRING | Strategy name (e.g. "Morning Gap Fade") |
| description | STRING | Strategy description |
| status | STRING | "active", "archived", "developing" |
| style | STRING | "SCALP", "DAY_TRADE", "SWING", "POSITION", "INVESTMENT" |
| color | STRING | Hex color for charts |
| metrics_totalTrades | INT64 | Total trades using this strategy |
| metrics_winRate | FLOAT64 | Win rate 0-100 |
| metrics_profitFactor | FLOAT64 | Gross profit / gross loss |
| metrics_totalPnl | FLOAT64 | Net PnL for this strategy |

### 3. \`${PROJECT_ID}.${DATASET_ID}.accounts_raw_latest\` (Workspaces)
| Column | Type | Description |
|--------|------|-------------|
| document_id | STRING | Unique account/workspace ID |
| name | STRING | Workspace name |
| ownerId | STRING | Owner's user ID |
| balance | FLOAT64 | Current account balance |
| initialBalance | FLOAT64 | Starting balance |
| currency | STRING | Account currency (e.g. "USD") |

## CRITICAL RULES
1. **ALWAYS** filter by \`accountId = @accountId\`. NEVER return data from other accounts.
2. **ALWAYS** use parameterized queries with @accountId. NEVER inline the accountId value.
3. **NEVER** use DELETE, UPDATE, INSERT, DROP, ALTER, CREATE, GRANT, or any DDL/DML statements.
4. **ONLY** use SELECT statements.
5. When joining trades with strategies, use: \`trades.strategyId = strategies.document_id\`
6. For win rate calculations: a winning trade has \`netPnl > 0\`, losing has \`netPnl < 0\`.
7. Keep results under 1000 rows. Use LIMIT if needed.
8. Use \`status = 'CLOSED'\` for completed trade analysis (exclude open positions).
9. Round financial values to 2 decimal places using ROUND().
10. For date filtering, use TIMESTAMP functions (e.g., \`entryDate >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)\`).
11. When joining executions with trades, use: \`executions.tradeId = trades.document_id\`

## EXAMPLE QUERIES

Q: "What is my win rate on AAPL?"
A: SELECT ROUND(COUNTIF(netPnl > 0) / COUNT(*) * 100, 2) as winRate, COUNT(*) as totalTrades FROM \`${PROJECT_ID}.${DATASET_ID}.trades_raw_latest\` WHERE accountId = @accountId AND symbol = 'AAPL' AND status = 'CLOSED'

Q: "What is my best performing strategy?"
A: SELECT s.name, COUNT(*) as trades, ROUND(AVG(t.netPnl), 2) as avgPnl, ROUND(COUNTIF(t.netPnl > 0) / COUNT(*) * 100, 2) as winRate FROM \`${PROJECT_ID}.${DATASET_ID}.trades_raw_latest\` t JOIN \`${PROJECT_ID}.${DATASET_ID}.strategies_raw_latest\` s ON t.strategyId = s.document_id AND t.accountId = s.accountId WHERE t.accountId = @accountId AND t.status = 'CLOSED' GROUP BY s.name ORDER BY avgPnl DESC LIMIT 10

Q: "Show me my equity curve"
A: SELECT DATE(entryDate) as tradeDate, ROUND(SUM(netPnl) OVER (ORDER BY entryDate), 2) as cumulativePnl FROM \`${PROJECT_ID}.${DATASET_ID}.trades_raw_latest\` WHERE accountId = @accountId AND status = 'CLOSED' ORDER BY entryDate ASC
`;

/**
 * List of forbidden SQL keywords that indicate non-SELECT operations.
 * Used for server-side validation before executing any AI-generated query.
 */
export const FORBIDDEN_SQL_PATTERNS = [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bGRANT\b/i,
  /\bREVOKE\b/i,
  /\bTRUNCATE\b/i,
  /\bMERGE\b/i,
  /\bEXEC\b/i,
  /\bEXECUTE\b/i,
  /\bCALL\b/i,
  /\bINTO\b/i,       // SELECT INTO
  /--/,              // SQL comments (injection vector)
  /\/\*/,            // Block comments (injection vector)
  /;\s*\S/,          // Multiple statements (injection vector)
];

/**
 * Validates that a SQL query is safe to execute.
 * Returns { safe: true } or { safe: false, reason: string }
 */
export const validateSQL = (sql: string): { safe: boolean; reason?: string } => {
  // 1. Must start with SELECT (after trimming whitespace)
  const trimmed = sql.trim();
  if (!trimmed.toUpperCase().startsWith("SELECT")) {
    return { safe: false, reason: "Query must start with SELECT." };
  }

  // 2. Must contain the accountId parameter
  if (!trimmed.includes("@accountId")) {
    return { safe: false, reason: "Query must filter by @accountId for tenant isolation." };
  }

  // 3. Check for forbidden patterns
  for (const pattern of FORBIDDEN_SQL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: `Forbidden SQL pattern detected: ${pattern.source}` };
    }
  }

  // 4. Must not exceed a reasonable length (prevent abuse)
  if (trimmed.length > 5000) {
    return { safe: false, reason: "Query exceeds maximum length (5000 chars)." };
  }

  return { safe: true };
};
