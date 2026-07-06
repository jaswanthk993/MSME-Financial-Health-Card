# IDBI Innovate 2026 | Problem Statement 3
## MSME Financial Health Card — Alternative Credit Decisioning Engine

A multi-agent, AI-driven underwriting and portfolio assessment system designed to evaluate **New-to-Credit (NTC)** and **New-to-Bank (NTB)** MSMEs. By aggregating alternate data streams—including GST filings, UPI bank transactions (Account Aggregator ledger), and EPFO payroll contributions—the engine builds a multi-dimensional financial health rating to drive financial inclusion under ULI, OCEN, and AA architecture standards.

---

## 🏛️ Executive Summary

Traditional bank credit underwriting relies heavily on collateral and historical bureau records (like CIBIL), which locks out millions of high-performing micro, small, and medium enterprises. 

**IDBI Innovate Financial Health Card** solves this by:
1. **Ingesting Consent-Based Alternate Data**: Extracting secure digital trails from GSTIN filings, UPI cash inflows/outflows, and EPFO payments.
2. **Dynamic Multi-Dimensional Scoring**: Computing an instant Financial Health Score (0–100) across four core vectors: Cash Flow, Compliance, Stability, and Digital Trust.
3. **Generative AI Risk Underwriting**: Powering automated, professional-grade credit committee memos with zero hallucination and high explainability using server-side Gemini models.
4. **What-If Simulation Sandbox**: Letting loan officers and MSME owners model improvements (e.g., "reducing GST delays by 50%") to witness real-time rating updates and dynamically calculated lending limits.

---

## 🎨 Professional Color Palette & Visual Theme

The application interface is meticulously styled around a bespoke **IDBI-Inspired Navy & Electric Blue Theme** to establish trust, compliance, and clinical visual authority:
*   **Deep Navy (`#003366`)**: Applied to high-level headers, logo accents, and navigation rails to convey institutional strength.
*   **Vibrant Electric Blue (`#0066FF`)**: Directs user focus to primary Call-to-Actions, score progress badges, and interactive navigation rails.
*   **Pure Emerald (`#10B981`) & Warm Amber (`#FF9900`)**: Deliver immediate visual categorization for Excellent, Good, Average, and Poor credit risk bands.
*   **Soft Slate Blue Background (`#F1F5F9`)**: Clean, low-contrast canvas letting critical data cards and charts emerge beautifully.

---

## 🚀 Key Functional Modules

### 1. 🏛️ Portfolio Panel (Dashboard)
*   **Unified At-a-Glance Portfolio Stats**: Real-time evaluation of total onboarded MSMEs, average health scores, average GST compliance ratios, and active delinquency rates.
*   **Multi-Dimensional Score Distribution**: Clean, custom SVG-rendered bar charts mapping portfolio density across Excellent (85+), Good (70-84), Average (50-69), and Poor (<50) bands.
*   **Enterprise Explorer**: Instant search and granular filtering by Industry Sector (Manufacturing, Retail, Textiles, Services, Agribusiness) and Credit Band.

### 2. 📋 Alternate Credit Rating (Health Card)
*   **Interactive Ring Gauge Meter**: Visualizes the consolidated alternative credit score.
*   **Subscore Diagnostics**:
    *   *UPI Cash Flow Liquidity (35% Weight)*: Inflow-outflow margins, balances, and digital credit frequency.
    *   *Tax Compliance Discipline (30% Weight)*: Delay delays tracking based on GSTR-1 & 3B files.
    *   *Workforce & Business Age (20% Weight)*: Active employee enrollment and consistency of EPFO deposits.
    *   *Digital Footprint (15% Weight)*: Counterparty supplier/customer diversity ratios.
*   **Secure Consent Registry status**: Replicates Account Aggregator consent flows (GST ✔, UPI ✔, EPFO ✔).
*   **Historic Trends Visualizers**: Custom time-series bar graphs mapping historical GST turnovers and monthly EPFO headcount stability.

### 3. 🧪 Sandbox What-If Simulator
*   **Operational Slider Parameters**: Adjust delay-reduction rates, monthly cash flow growth, employee payroll count shifts, and UPI transaction ratios.
*   **Real-time Credit Re-evaluation**: Runs the alternate scoring ruleset instantly to simulate score shifts (+/- points) and updated lending brackets.
*   **Dynamic Underwriting Adjustments**: Automatically recalculates maximum recommended business loan amounts, interest rates, and loan sweeping/repayment frequencies.

### 4. 🤖 Underwrite AI (Gemini Agent)
*   **Automated Credit Memo Compilation**: Triggers a server-side Gemini request to compile a professional-grade credit memo.
*   **Deep Financial Synthesis**:
    *   Section 1: Detailed Financial & Compliance Ingestion Summary.
    *   Section 2: Strength vectors based on raw Alternate data.
    *   Section 3: Key Risk alerts and regulatory warnings.
    *   Section 4: Direct Credit Decisioning & proposed lending limits.
    *   Section 5: Specific collateral mitigation recommendations (e.g., ESCROW sweeps).
*   **Copy & Offline Print Ready**: Clean, print-styled stylesheet allowing credit officers to print physically clean, paper documents ready for offline sign-offs.

---

## 📊 Normalized Entity Data Schema

The platform is designed with an extensible, relational-ready normalized schema:

```typescript
interface Msme {
  id: string;
  businessName: string;
  pan: string;
  gstin: string;
  sector: string;
  state: string;
  monthlyRevenue: number;
  employeeCount: number;
  consentStatus: {
    gst: boolean;
    upi: boolean;
    epfo: boolean;
  };
  score: {
    overallScore: number;
    band: 'Excellent' | 'Good' | 'Average' | 'Poor';
    subScores: {
      cashFlow: number;
      compliance: number;
      stability: number;
      digitalTrust: number;
    };
    strengths: string[];
    risks: string[];
  };
  gstHistory: {
    period: string;
    turnover: number;
    filingDelayDays: number;
    returnType: 'GSTR-1' | 'GSTR-3B';
    filingStatus: 'Filed' | 'Delayed' | 'Pending';
  }[];
  transactions: {
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    isUpi: boolean;
    counterpartyCategory: 'Customer' | 'Supplier' | 'Payroll' | 'Other';
    balanceAfter: number;
  }[];
  epfoHistory: {
    period: string;
    employeeCount: number;
    contributionAmount: number;
    status: 'Paid' | 'Delayed';
  }[];
}
```

---

## 🛠️ Installation & Execution

### Prerequisites
*   Node.js (v18+)
*   NPM

### Running Locally
1.  **Clone the Repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Define Environment Variables**:
    Create a `.env` file in the root based on `.env.example`:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
4.  **Launch the Dev Server**:
    ```bash
    npm run dev
    ```
    The server will boot on `http://localhost:3000` incorporating hot-reloading for both client-side React code and Express routes.

5.  **Build for Production**:
    ```bash
    npm run build
    ```
    Creates a highly optimized, single bundled output under `dist/` utilizing esbuild for the backend compilation and vite for client static generation.

---

## 🗺️ Future Roadmap & Horizons

### 🌟 Horizon 1 — Short-Term (Next 1–2 Months)
*   **Live Sandbox Integrations**: Upgrade synthetic data pipelines to consume live sandbox APIs (Setu/Sahamati AA networks, GSTN developers sandbox).
*   **Gradient Boosting Score Calibration**: Transition from weighted rules-based scoring to ML classifiers trained on proxy default datasets.
*   **Early Risk Alerts**: Implement automated notification channels for lenders when subscores (e.g., EPFO payroll consistency) suddenly fall below safety thresholds.

### 🚀 Horizon 2 — Mid-Term (3–6 Months)
*   **OCEN/ULI Live Integration**: Connect to real Open Credit Enabled Network protocols to automatically dispatch loan quotes instantly upon scoring.
*   **Macro-Sector Analytics**: Build interactive sector-wise risk heatmaps enabling risk teams to correlate regional GST/UPI shifts against specific industries.
*   **Audit-Trail Ledger**: Introduce cryptographic hashes of consent certificates and scoring decisions, aligning with DPDP compliance protocols.

### 🛸 Horizon 3 — Long-Term (6–12+ Months)
*   **Streaming Alternate Scoring**: Event-driven architecture that recalculates MSME creditworthiness in real-time on every incoming GST filing or UPI transaction.
*   **Consented Score Portability**: Empower MSMEs to package their certified alternative credit rating and carry it securely to any competitive bidding lender.
