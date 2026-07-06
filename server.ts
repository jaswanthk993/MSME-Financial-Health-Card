import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { MSME, GSTRecord, EPFORecord, TransactionRecord } from './src/types';
import { SYNTHETIC_MSMES, calculateMSMEScore } from './src/data/synthetic';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory MSME database on server side for realistic state persistence
let dbMSMEs: MSME[] = [...SYNTHETIC_MSMES];

// Lazy-initialized Gemini Client to prevent crash on boot if GEMINI_API_KEY is missing
let aiClient: any = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add your GEMINI_API_KEY in Settings > Secrets to enable AI reports.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. GET ALL MSMES
app.get('/api/msmes', (req, res) => {
  try {
    res.json(dbMSMEs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET SINGLE MSME
app.get('/api/msme/:id', (req, res) => {
  const { id } = req.params;
  const msme = dbMSMEs.find(m => m.id === id);
  if (!msme) {
    return res.status(404).json({ error: `MSME with ID ${id} not found.` });
  }
  res.json(msme);
});

// 3. ONBOARD NEW MSME
app.post('/api/msme/onboard', (req, res) => {
  try {
    const {
      businessName,
      pan,
      gstin,
      sector,
      state,
      employeeCount,
      monthlyRevenue,
      consentStatus,
    } = req.body;

    if (!businessName || !pan || !gstin) {
      return res.status(400).json({ error: "Business Name, PAN, and GSTIN are required." });
    }

    const newId = `msme-${Math.round(100 + Math.random() * 899)}`;
    const incorporationYear = 2021 + Math.floor(Math.random() * 4); // 2021-2024

    // Generate highly realistic starting synthetic GST, EPFO and transaction data based on onboarded metrics
    const gstHistory: GSTRecord[] = [];
    const monthlyRevNum = Number(monthlyRevenue || 500000);
    for (let i = 1; i <= 5; i++) {
      const period = `2026-0${i}`;
      const turnover = Math.round(monthlyRevNum * (0.85 + Math.random() * 0.3));
      // give random filing delay to simulate realistic business behavior (0 to 12 days)
      const delay = Math.floor(Math.random() * 15);
      gstHistory.push({
        period,
        turnover,
        filingDelayDays: delay,
        returnType: 'GSTR-1',
        filingStatus: delay > 10 ? 'Delayed' : 'Filed'
      });
      gstHistory.push({
        period,
        turnover,
        filingDelayDays: delay + Math.floor(Math.random() * 3),
        returnType: 'GSTR-3B',
        filingStatus: delay > 10 ? 'Delayed' : 'Filed'
      });
    }

    const epfoHistory: EPFORecord[] = [];
    const empCountNum = Number(employeeCount || 10);
    if (empCountNum > 0) {
      for (let i = 1; i <= 5; i++) {
        epfoHistory.push({
          period: `2026-0` + i,
          employeeCount: empCountNum,
          contributionAmount: empCountNum * 3000,
          status: Math.random() > 0.15 ? 'Paid' : 'Delayed'
        });
      }
    }

    const transactions: TransactionRecord[] = [
      { date: "2026-06-01", amount: Math.round(monthlyRevNum * 0.4), type: "credit", counterpartyCategory: "Customer", balanceAfter: Math.round(monthlyRevNum * 0.5), isUpi: true, description: "UPI QR - Merchant Payment Inflow A" },
      { date: "2026-06-05", amount: Math.round(empCountNum * 3000), type: "debit", counterpartyCategory: "Payroll", balanceAfter: Math.round(monthlyRevNum * 0.4), isUpi: false, description: "Payroll & EPFO Contribution Transfer" },
      { date: "2026-06-12", amount: Math.round(monthlyRevNum * 0.3), type: "credit", counterpartyCategory: "Customer", balanceAfter: Math.round(monthlyRevNum * 0.65), isUpi: true, description: "UPI QR - Merchant Payment Inflow B" },
      { date: "2026-06-18", amount: Math.round(monthlyRevNum * 0.1), type: "debit", counterpartyCategory: "Rent", balanceAfter: Math.round(monthlyRevNum * 0.55), isUpi: true, description: "UPI Rent Payment" },
      { date: "2026-06-25", amount: Math.round(monthlyRevNum * 0.35), type: "debit", counterpartyCategory: "Supplier", balanceAfter: Math.round(monthlyRevNum * 0.2), isUpi: false, description: "NEFT Supplier settlement" }
    ];

    const score = calculateMSMEScore(gstHistory, transactions, epfoHistory, incorporationYear);

    const newMsme: MSME = {
      id: newId,
      pan,
      gstin,
      businessName,
      sector: sector || "Retail",
      incorporationDate: `${incorporationYear}-06-01`,
      consentStatus: {
        gst: consentStatus?.gst ?? true,
        upi: consentStatus?.upi ?? true,
        epfo: consentStatus?.epfo ?? true,
      },
      state: state || "Maharashtra",
      employeeCount: empCountNum,
      monthlyRevenue: monthlyRevNum,
      gstHistory,
      transactions,
      epfoHistory,
      score,
      onboardedAt: new Date().toISOString().split('T')[0],
    };

    dbMSMEs.unshift(newMsme);
    res.status(201).json(newMsme);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. SIMULATE WHAT-IF METRICS IN REAL-TIME (Calculates and returns updated score)
app.post('/api/msme/:id/simulate', (req, res) => {
  try {
    const { id } = req.params;
    const { gstFilingDelayReduction, cashFlowGrowth, employeeGrowth, digitalInflowRatio } = req.body;

    const msme = dbMSMEs.find(m => m.id === id);
    if (!msme) {
      return res.status(404).json({ error: `MSME with ID ${id} not found.` });
    }

    const incorporationYear = new Date(msme.incorporationDate).getFullYear();
    const simulatedScore = calculateMSMEScore(
      msme.gstHistory,
      msme.transactions,
      msme.epfoHistory,
      incorporationYear,
      {
        gstFilingDelayReduction: Number(gstFilingDelayReduction ?? 0),
        cashFlowGrowth: Number(cashFlowGrowth ?? 0),
        employeeGrowth: Number(employeeGrowth ?? 0),
        digitalInflowRatio: digitalInflowRatio !== undefined ? Number(digitalInflowRatio) : undefined
      }
    );

    res.json({
      originalScore: msme.score,
      simulatedScore
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. TRIGGER NEAR REAL-TIME REFRESH (Pulls fresh simulated tax/UPI records, improves score dynamically)
app.post('/api/msme/:id/refresh', (req, res) => {
  try {
    const { id } = req.params;
    const idx = dbMSMEs.findIndex(m => m.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: `MSME with ID ${id} not found.` });
    }

    const msme = { ...dbMSMEs[idx] };

    // Simulate new outstanding perfect filing for current month
    const currentPeriod = "2026-06";
    // Check if we already did a refresh for this period
    const alreadyRefreshed = msme.gstHistory.some(g => g.period === currentPeriod);

    if (!alreadyRefreshed) {
      // Add the latest GST filing (perfectly filed on time!)
      msme.gstHistory.push({
        period: currentPeriod,
        turnover: Math.round(msme.monthlyRevenue * 1.1),
        filingDelayDays: 0,
        returnType: "GSTR-1",
        filingStatus: "Filed"
      });
      msme.gstHistory.push({
        period: currentPeriod,
        turnover: Math.round(msme.monthlyRevenue * 1.1),
        filingDelayDays: 1,
        returnType: "GSTR-3B",
        filingStatus: "Filed"
      });

      // Add a substantial positive UPI customer credit transaction
      msme.transactions.unshift({
        date: new Date().toISOString().split('T')[0],
        amount: Math.round(msme.monthlyRevenue * 0.25),
        type: "credit",
        counterpartyCategory: "Customer",
        balanceAfter: Math.round(msme.monthlyRevenue * 0.8),
        isUpi: true,
        description: "Real-time UPI Credit - Consolidated QR Daily Settlement"
      });

      // Re-calculate the score
      const incorporationYear = new Date(msme.incorporationDate).getFullYear();
      msme.score = calculateMSMEScore(msme.gstHistory, msme.transactions, msme.epfoHistory, incorporationYear);

      // Save updated state to db
      dbMSMEs[idx] = msme;
    }

    res.json({
      refreshed: !alreadyRefreshed,
      msme
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. AI CREDIT OFFICER NARRATIVE ANALYSIS (Uses Server-Side Gemini API)
app.post('/api/msme/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const msme = dbMSMEs.find(m => m.id === id);
    if (!msme) {
      return res.status(404).json({ error: `MSME with ID ${id} not found.` });
    }

    // Call server-side Gemini API
    const ai = getGeminiClient();

    const gstinMasked = msme.gstin.slice(0, 4) + 'XXXX' + msme.gstin.slice(-4);
    const panMasked = msme.pan.slice(0, 3) + 'XXXX' + msme.pan.slice(-1);

    const prompt = `
You are a senior credit officer evaluating an MSME loan proposal for a New-to-Bank (NTB) or New-to-Credit (NTC) merchant in India.
You have access to alternate data sources (GST Compliance, UPI transaction flows, and EPFO payroll records) summarized below.

MSME Entity Details:
- Name: ${msme.businessName}
- Sector: ${msme.sector}
- State: ${msme.state}
- Masked PAN: ${panMasked}
- Masked GSTIN: ${gstinMasked}
- Est. Monthly Revenue: INR ${msme.monthlyRevenue.toLocaleString()}
- Current Employee Count: ${msme.employeeCount}
- Overall Financial Health Score: ${msme.score.overallScore}/100 (${msme.score.band} Band)
  * Cash Flow Score: ${msme.score.subScores.cashFlow}/100
  * GST Compliance Score: ${msme.score.subScores.compliance}/100
  * Stability Score: ${msme.score.subScores.stability}/100
  * Digital Trust Score: ${msme.score.subScores.digitalTrust}/100

GST Filing History (turnover & delay days):
${JSON.stringify(msme.gstHistory)}

EPFO Monthly Contributions (employee headcount & payment compliance):
${JSON.stringify(msme.epfoHistory)}

Recent Bank/UPI Transaction Logs (credits, debits, classification):
${JSON.stringify(msme.transactions)}

Please write an incredibly professional, comprehensive Credit Memo and Credit Report for this business. Format your output strictly in markdown. Do NOT use generic text, instead speak specifically about this business, their industry segment in India, their trends, compliance failures or successes, and give concrete lending suggestions.

Your output must include these five clear sections:
1. ### Executive Summary & Business Profile: Assess their sector, market stability, and alternative creditworthiness profile.
2. ### GST Compliance & Tax Audit Risk: Analyze turnover stability, delayed vs on-time filings, and regulatory risk. Highlight specific months where delayed filing occurred.
3. ### Working Capital & Cash Flow Dynamics: Assess their credit-to-debit ratio, monthly transaction diversity, and working capital sufficiency based on recent transactions.
4. ### EPFO Workforce & Operational Stability: Evaluate the payroll and headcount trends and consistency of EPFO payments as a business continuity signal.
5. ### Underwriting Recommendation & Recommended Credit Terms: Give specific, direct suggestions for a commercial credit limit in INR (recommend a realistic amount based on their revenue), interest rate spread (e.g. 10.5% - 13.5%), repayment frequency, and risk mitigations (e.g. daily/weekly UPI automatic escrow sweep, post-dated cheques).

Make it sound highly objective, precise, and authoritative.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({
      report: response.text
    });
  } catch (error: any) {
    console.error("Gemini API Error in Credit Officer Analysis:", error);
    res.status(500).json({ error: error.message });
  }
});


// 7. VITE OR STATIC ASSETS MIDDLEWARE
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
