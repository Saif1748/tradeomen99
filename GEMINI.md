# TradeOmen V2 - Professional Development Handbook

This document serves as the absolute **Source of Truth** for technical excellence in the TradeOmen V2 project. All automated agents and human developers must adhere to these world-class engineering standards.

## 1. Core Development Mandates

Before writing any code, the following baseline rules apply:
1. **TypeScript First**: All code must be written in strict TypeScript.
2. **Cross-Platform Readiness**: Code architecture must be designed so core logic can be shared seamlessly across **Web**, **Mobile**, and **Desktop** applications.
3. **Uncompromising Quality**: Code must be industry-grade, well-commented, well-structured, well-documented, well-tested, and well-optimized.

## 2. Architectural Pillars

### 🚀 Performance & Efficiency (Fast & Optimized)
- **Zero Waste**: Minimize processed data. Optimize BigQuery usage with partitioned queries and avoid `SELECT *`.
- **Rerender-Free UI**: Preemptively use `useMemo` and `useCallback` for expensive computations and stable callbacks. Memoize large list items.
- **Lazy Load Everything**: Implement route-based code splitting and dynamic imports for non-critical features to guarantee fast initial paints.

### 🛡️ Security & Privacy (Secure)
- **Secure Data Handling**: Never store Sensitive PII in Firestore without encryption or an explicit business requirement.
- **Rules-First**: Maintain strict Firebase Security Rules. Assume the client is compromised; validate everything on the server.
- **Input Sanitization**: Use Zod for runtime type validation and sanitization before processing user input.

### 📈 Scalability & Robustness
- **Modular Services**: Business logic belongs exclusively in `src/services`. UI components are strictly views. This prevents monoliths.
- **Fault Tolerance**: Every async call must have explicit error handling (`try/catch`). Wrap critical UI sections in `ErrorBoundary` components to prevent catastrophic crashes.
- **Atomic Operations**: Rely on Firestore transactions and batch writes for multi-document updates to ensure absolute data integrity.

## 3. Elite Coding Standards

### 📖 Interpretability (Readable & Well-Commented)
- **Intentional Naming**:
    - **Variables**: Use Nouns/Adjectives (`isAuthenticating`, `tradesList`, `userSettings`).
    - **Functions**: Use Verbs (`calculateDrawdown()`, `handleTradeDelete()`).
- **Declarative Code**: Prefer `map`, `filter`, and `reduce` over imperative loop structures.
- **Explicit Exports**: Avoid `default` exports for services and components to ensure IDE discoverability and refactor safety.
- **Self-Documenting Code**: Write code that explains "what" it does. Use inline comments exclusively to explain "why" (business logic/context).

### 🏛️ Component & Software Architecture (Well-Structured)
- **Container/Presenter Pattern**: Strictly isolate UI from logic. Keep components in `src/components/ui` pure and stateless.
- **Custom Hook Centralization**: Domain logic (e.g., trade calculation, auth state) must be encapsulated in custom hooks within `src/hooks`.
- **SOLID Principles**:
    - **Single Responsibility (S)**: Break down components. A single file should not fetch data, manage global state, *and* render complex UI.
    - **Dependency Inversion (D)**: Inject dependencies via props or hooks. Avoid hardcoding service instantiations inside UI components.
- **DRY & KISS**: Abstract shared logic into `src/lib` or `src/utils`. Avoid over-engineering.

## 4. Tech Stack Master Patterns

| Segment | Best Practice |
| :--- | :--- |
| **State** | `@tanstack/react-query` for server state. No local `useEffect` for data fetching. |
| **Logic** | Modular classes or functional objects in `src/services`. |
| **Style** | Tailwind CSS with design tokens (`tailwind.config.ts`). No inline styles. |
| **Types** | Strict TypeScript (`interface` for objects, `type` for unions). `any` is forbidden. |
| **Analytics** | BigQuery for heavy lifting. Aggregate data BEFORE sending to the client. |

## 5. Documentation Standards (Well-Documented)

- **Mandatory TSDoc**: All exported functions, services, and hooks MUST have TSDoc blocks explaining the purpose, `@param`, and `@returns`.
- **Sub-Directory READMEs**: Every major directory (`src/services`, `src/hooks`, etc.) requires a `README.md` explaining its architectural purpose.
- **TSDoc Example**:
  ```typescript
  /**
   * Calculates the risk-to-reward ratio for a given trade.
   * @param entry - The entry price of the trade.
   * @param stopLoss - The stop loss price.
   * @param takeProfit - The target profit price.
   * @returns The calculated R:R ratio as a number.
   */
  export const calculateRR = (entry: number, stopLoss: number, takeProfit: number): number => { ... }
  ```

## 6. Professional Peer Review & QA (Well-Tested)

Before any code is merged, it must satisfy this checklist:
1. **Clean UI**: No flickering, layout shifts (CLS), or React hydration errors.
2. **Console Cleanliness**: All `console.log` and `debugger` statements are strictly removed.
3. **Responsive**: UI is fully tested and functional across mobile, tablet, and desktop breakpoints.
4. **Type-Safety**: Zero `any` types or `@ts-ignore` directives without documented business justification.
5. **Unit Testing**: Business logic in `src/lib` or `src/utils` MUST have accompanying unit tests.

## 7. Environment & Config Management
- **Type-Safe Envs**: Validate all environment variables via a schema (e.g., Zod) and access them through a centralized `config.ts`.
- **Secret Protection**: `.env` files must remain strictly out of version control. Maintain a safe `.env.example`.

## 8. Quality Assurance (Beyond Automated Tests)
- **Cross-Browser Verification**: Ensure visual/functional consistency across Chrome, Safari, and Firefox.
- **Micro-Interaction QA**: Verify hover states, transitions, and loading skeletons provide a premium feel.
- **Accessibility (a11y)**: Enforce semantic HTML and `aria-labels` for all interactive elements.

---
*Precision. Speed. Reliability. Build the future of trading.*
