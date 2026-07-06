export interface GSTRecord {
  period: string; // YYYY-MM
  turnover: number;
  filingDelayDays: number;
  returnType: 'GSTR-1' | 'GSTR-3B';
  filingStatus: 'Filed' | 'Pending' | 'Delayed';
}

export interface TransactionRecord {
  date: string; // YYYY-MM-DD
  amount: number;
  type: 'credit' | 'debit';
  counterpartyCategory: 'Customer' | 'Supplier' | 'Utility' | 'Rent' | 'Payroll' | 'Tax' | 'Other';
  balanceAfter: number;
  isUpi: boolean;
  description: string;
}

export interface EPFORecord {
  period: string; // YYYY-MM
  employeeCount: number;
  contributionAmount: number;
  status: 'Paid' | 'Unpaid' | 'Delayed';
}

export interface ScoreRecord {
  scoreDate: string;
  overallScore: number; // 0 - 100
  band: 'Poor' | 'Average' | 'Good' | 'Excellent';
  subScores: {
    cashFlow: number; // UPI transactional health (0 - 100)
    compliance: number; // GST filing behavior (0 - 100)
    stability: number; // EPFO workforce consistency & business age (0 - 100)
    digitalTrust: number; // Alternate footprints: UPI volume, digital receipts, diversity of counterparties (0 - 100)
  };
  strengths: string[];
  risks: string[];
}

export interface MSME {
  id: string;
  pan: string;
  gstin: string;
  businessName: string;
  sector: string;
  incorporationDate: string;
  consentStatus: {
    gst: boolean;
    upi: boolean;
    epfo: boolean;
  };
  state: string;
  employeeCount: number;
  monthlyRevenue: number;
  gstHistory: GSTRecord[];
  transactions: TransactionRecord[];
  epfoHistory: EPFORecord[];
  score: ScoreRecord;
  onboardedAt: string;
}

export interface PortfolioStats {
  averageScore: number;
  totalMSMEs: number;
  bandDistribution: {
    Excellent: number;
    Good: number;
    Average: number;
    Poor: number;
  };
  sectorDistribution: {
    sector: string;
    count: number;
    avgScore: number;
  }[];
  delinquencyRiskRate: number; // percentage with Poor score
  averageGstCompliance: number; // avg compliance sub-score
  averageCashFlow: number; // avg cashflow sub-score
}
