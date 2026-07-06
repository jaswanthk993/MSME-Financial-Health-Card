import { MSME, GSTRecord, TransactionRecord, EPFORecord, ScoreRecord } from '../types';

// Helper to calculate score mathematically based on profile features.
// This allows the Sandbox Simulator to recalculate scores dynamically.
export function calculateMSMEScore(
  gstHistory: GSTRecord[],
  transactions: TransactionRecord[],
  epfoHistory: EPFORecord[],
  incorporationYear: number,
  simulationModifiers?: {
    gstFilingDelayReduction?: number; // percentage reduction (0 to 100)
    cashFlowGrowth?: number; // percentage change in monthly turnover (-50 to +100)
    employeeGrowth?: number; // absolute change in employees (-10 to +20)
    digitalInflowRatio?: number; // target digital trust ratio (0 to 1)
  }
): ScoreRecord {
  // 1. COMPLIANCE SCORE (Weight: 30%)
  let totalDelayDays = 0;
  let totalFilings = gstHistory.length;
  let delayedFilingsCount = 0;
  let pendingFilingsCount = 0;

  gstHistory.forEach(rec => {
    let delay = rec.filingDelayDays;
    if (simulationModifiers?.gstFilingDelayReduction !== undefined) {
      // Reduce the delay days
      delay = Math.max(0, Math.round(delay * (1 - simulationModifiers.gstFilingDelayReduction / 100)));
    }
    
    if (rec.filingStatus === 'Pending') {
      if (simulationModifiers?.gstFilingDelayReduction !== undefined && simulationModifiers.gstFilingDelayReduction > 50) {
        // Assume pending filings get filed under high simulation optimization
        totalDelayDays += 5; 
      } else {
        pendingFilingsCount++;
        totalDelayDays += 45; // high penalty for pending
      }
    } else {
      totalDelayDays += delay;
      if (delay > 3) {
        delayedFilingsCount++;
      }
    }
  });

  const avgDelay = totalFilings > 0 ? totalDelayDays / totalFilings : 15;
  // Score mapping: 0 delay = 100, 30+ days average delay = 30 points
  let complianceScore = Math.max(20, Math.min(100, 100 - (avgDelay * 2.2) - (pendingFilingsCount * 15)));

  // 2. CASH FLOW SCORE (Weight: 35%)
  const credits = transactions.filter(t => t.type === 'credit');
  const debits = transactions.filter(t => t.type === 'debit');
  
  let totalCreditAmount = credits.reduce((sum, t) => sum + t.amount, 0);
  let totalDebitAmount = debits.reduce((sum, t) => sum + t.amount, 0);

  if (simulationModifiers?.cashFlowGrowth !== undefined) {
    const growthFactor = 1 + (simulationModifiers.cashFlowGrowth / 100);
    totalCreditAmount *= growthFactor;
    // Debits grow proportionally but slightly less if positive growth (improving margin)
    const debitGrowth = simulationModifiers.cashFlowGrowth > 0 
      ? 1 + (simulationModifiers.cashFlowGrowth * 0.7 / 100) 
      : growthFactor;
    totalDebitAmount *= debitGrowth;
  }

  const creditToDebitRatio = totalDebitAmount > 0 ? totalCreditAmount / totalDebitAmount : 1.5;
  
  // Cash flow volatility & sufficiency
  let cashFlowBase = 70;
  if (creditToDebitRatio > 1.2) cashFlowBase += 15;
  else if (creditToDebitRatio < 1.0) cashFlowBase -= 25; // deficit

  // Add points for average monthly balance stability
  const netSavings = totalCreditAmount - totalDebitAmount;
  if (netSavings > 0) {
    cashFlowBase += Math.min(15, (netSavings / totalCreditAmount) * 50);
  } else {
    cashFlowBase -= 15;
  }

  let cashFlowScore = Math.max(15, Math.min(100, cashFlowBase));

  // 3. STABILITY SCORE (Weight: 20%)
  const age = new Date().getFullYear() - incorporationYear;
  let ageScore = Math.min(100, 40 + age * 6); // Cap age benefit at 10 years (100 pts)

  let epfoRegularity = 100;
  let epfoDelayedCount = epfoHistory.filter(e => e.status === 'Delayed').length;
  let epfoUnpaidCount = epfoHistory.filter(e => e.status === 'Unpaid').length;
  epfoRegularity -= (epfoDelayedCount * 10 + epfoUnpaidCount * 30);

  let currentEmployeeCount = epfoHistory.length > 0 ? epfoHistory[epfoHistory.length - 1].employeeCount : 0;
  if (simulationModifiers?.employeeGrowth !== undefined) {
    currentEmployeeCount = Math.max(1, currentEmployeeCount + simulationModifiers.employeeGrowth);
  }

  let employeeTrendPoints = 50;
  if (epfoHistory.length >= 3) {
    const startCount = epfoHistory[0].employeeCount;
    const endCount = currentEmployeeCount;
    if (endCount > startCount) employeeTrendPoints = 85; // growing
    else if (endCount === startCount) employeeTrendPoints = 70; // stable
    else employeeTrendPoints = 30; // downsizing
  }

  let stabilityScore = (ageScore * 0.3) + (Math.max(0, epfoRegularity) * 0.4) + (employeeTrendPoints * 0.3);
  stabilityScore = Math.max(20, Math.min(100, stabilityScore));

  // 4. DIGITAL TRUST SCORE (Weight: 15%)
  const upiCredits = credits.filter(t => t.isUpi);
  const upiCreditAmount = upiCredits.reduce((sum, t) => sum + t.amount, 0);
  
  let digitalRatio = totalCreditAmount > 0 ? upiCreditAmount / totalCreditAmount : 0.5;
  if (simulationModifiers?.digitalInflowRatio !== undefined) {
    digitalRatio = simulationModifiers.digitalInflowRatio;
  }

  // Diversity of counterparties
  const uniqueCategories = new Set(transactions.map(t => t.counterpartyCategory)).size;
  const categorySpreadPoints = (uniqueCategories / 7) * 100; // 7 unique categories is max

  let digitalTrustScore = (digitalRatio * 60) + (categorySpreadPoints * 0.4);
  digitalTrustScore = Math.max(30, Math.min(100, digitalTrustScore));

  // Overall Score Weighted Integration
  const overallScore = Math.round(
    (cashFlowScore * 0.35) +
    (complianceScore * 0.30) +
    (stabilityScore * 0.20) +
    (digitalTrustScore * 0.15)
  );

  let band: 'Poor' | 'Average' | 'Good' | 'Excellent';
  if (overallScore >= 85) band = 'Excellent';
  else if (overallScore >= 70) band = 'Good';
  else if (overallScore >= 50) band = 'Average';
  else band = 'Poor';

  // Compute strengths and risks dynamically
  const strengths: string[] = [];
  const risks: string[] = [];

  if (complianceScore > 85) strengths.push('Impeccable GST compliance with zero filing delays');
  else if (complianceScore > 70) strengths.push('Consistent tax filing with minimal delayed submissions');
  else if (complianceScore < 50) risks.push('Frequent delays in GST filings, posing regulatory audit risks');

  if (cashFlowScore > 85) strengths.push('Robust and highly liquid cash inflows, well-covering operating debits');
  else if (cashFlowScore < 55) risks.push('Taut cash flow buffer; high expenditures relative to incoming credits');

  if (stabilityScore > 80) strengths.push('Highly stable business history with regular EPFO contributions and payroll growth');
  else if (stabilityScore < 50) risks.push('Workforce downsizing or inconsistent EPFO contribution timings detected');

  if (digitalTrustScore > 80) strengths.push('Deep digital transaction integration via UPI with high counterparty diversity');
  else if (digitalTrustScore < 50) risks.push('Traditional cash-heavy footprint; limited transparent alternate digital trail');

  // fallback if lists are empty
  if (strengths.length === 0) strengths.push('Stable operational performance across alternate parameters');
  if (risks.length === 0) risks.push('No critical alarm flags triggered in current compliance/cash cycle');

  return {
    scoreDate: new Date().toISOString().split('T')[0],
    overallScore,
    band,
    subScores: {
      cashFlow: Math.round(cashFlowScore),
      compliance: Math.round(complianceScore),
      stability: Math.round(stabilityScore),
      digitalTrust: Math.round(digitalTrustScore),
    },
    strengths,
    risks,
  };
}

// Pre-packaged 15 high-quality synthetic MSME profiles
export const SYNTHETIC_MSMES: MSME[] = [
  {
    id: "msme-01",
    pan: "AAAFM1290K",
    gstin: "24AAAFM1290K1Z9",
    businessName: "Vardhaman Tex-Fab Pvt Ltd",
    sector: "Manufacturing",
    incorporationDate: "2016-04-12",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Gujarat",
    employeeCount: 42,
    monthlyRevenue: 1850000,
    onboardedAt: "2026-06-01",
    gstHistory: [
      { period: "2026-01", turnover: 1720000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 1720000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1810000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1810000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1950000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1950000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1890000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1890000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1920000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1920000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 40, contributionAmount: 120000, status: "Paid" },
      { period: "2026-02", employeeCount: 41, contributionAmount: 123000, status: "Paid" },
      { period: "2026-03", employeeCount: 42, contributionAmount: 126000, status: "Paid" },
      { period: "2026-04", employeeCount: 42, contributionAmount: 126000, status: "Paid" },
      { period: "2026-05", employeeCount: 42, contributionAmount: 126000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 450000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 680000, isUpi: true, description: "UPI Inflow - Prime Retailers" },
      { date: "2026-06-03", amount: 180000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 500000, isUpi: false, description: "NEFT - Yarn Suppliers India" },
      { date: "2026-06-05", amount: 126000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 374000, isUpi: false, description: "EPFO Contribution E-payment" },
      { date: "2026-06-10", amount: 320000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 694000, isUpi: true, description: "UPI QR - Fabric Dealership Inflow" },
      { date: "2026-06-15", amount: 45000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 649000, isUpi: true, description: "UPI - Torrent Power Gujarat" },
      { date: "2026-06-20", amount: 250000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 899000, isUpi: true, description: "UPI QR - Wholesale Bazaar" },
      { date: "2026-06-25", amount: 95000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 804000, isUpi: true, description: "UPI Rent - Vardhaman Industrial Estate" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-02",
    pan: "ABGPA3382F",
    gstin: "29ABGPA3382F1ZG",
    businessName: "Ananya Food Processing Unit",
    sector: "Agro Processing",
    incorporationDate: "2019-08-25",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Karnataka",
    employeeCount: 28,
    monthlyRevenue: 1200000,
    onboardedAt: "2026-06-02",
    gstHistory: [
      { period: "2026-01", turnover: 1100000, filingDelayDays: 3, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 1100000, filingDelayDays: 4, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1150000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1150000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1300000, filingDelayDays: 8, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1300000, filingDelayDays: 9, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1250000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1250000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1200000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1200000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 26, contributionAmount: 78000, status: "Paid" },
      { period: "2026-02", employeeCount: 26, contributionAmount: 78000, status: "Paid" },
      { period: "2026-03", employeeCount: 28, contributionAmount: 84000, status: "Delayed" },
      { period: "2026-04", employeeCount: 28, contributionAmount: 84000, status: "Paid" },
      { period: "2026-05", employeeCount: 28, contributionAmount: 84000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-02", amount: 350000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 420000, isUpi: true, description: "UPI QR Inflow - BigBasket Retail" },
      { date: "2026-06-05", amount: 150000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 270000, isUpi: false, description: "RTGS - Agro Seed Distributors" },
      { date: "2026-06-10", amount: 84000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 186000, isUpi: false, description: "PF e-payment EPFO Bangalore" },
      { date: "2026-06-12", amount: 280000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 466000, isUpi: true, description: "UPI - More Mega Mart credits" },
      { date: "2026-06-18", amount: 32000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 434000, isUpi: true, description: "UPI - BESCOM Power bill" },
      { date: "2026-06-22", amount: 190000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 624000, isUpi: true, description: "UPI - Dynamic Organic Store" },
      { date: "2026-06-27", amount: 60000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 564000, isUpi: true, description: "Rent Transfer - KIADB Industrial Shed" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-03",
    pan: "AHCPB8904M",
    gstin: "37AHCPB8904M2ZA",
    businessName: "Sai Balaji Enterprises",
    sector: "Retail",
    incorporationDate: "2021-11-05",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Andhra Pradesh",
    employeeCount: 8,
    monthlyRevenue: 650000,
    onboardedAt: "2026-06-04",
    // SCENARIO: Rich cash flows via UPI QR codes (high transactions), but poor compliance discipline (filings delayed by 15-20 days). Classic sandbox candidate!
    gstHistory: [
      { period: "2026-01", turnover: 610000, filingDelayDays: 18, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-01", turnover: 610000, filingDelayDays: 20, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 640000, filingDelayDays: 14, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 640000, filingDelayDays: 16, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 690000, filingDelayDays: 22, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 690000, filingDelayDays: 24, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-04", turnover: 630000, filingDelayDays: 12, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-04", turnover: 630000, filingDelayDays: 15, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-05", turnover: 650000, filingDelayDays: 19, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-05", turnover: 650000, filingDelayDays: 21, returnType: "GSTR-3B", filingStatus: "Delayed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 8, contributionAmount: 24000, status: "Paid" },
      { period: "2026-02", employeeCount: 8, contributionAmount: 24000, status: "Delayed" },
      { period: "2026-03", employeeCount: 8, contributionAmount: 24000, status: "Paid" },
      { period: "2026-04", employeeCount: 7, contributionAmount: 21000, status: "Delayed" },
      { period: "2026-05", employeeCount: 8, contributionAmount: 24000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 120000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 150000, isUpi: true, description: "UPI QR Inflow - Store Sales Batch A" },
      { date: "2026-06-02", amount: 95000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 245000, isUpi: true, description: "UPI QR Inflow - Store Sales Batch B" },
      { date: "2026-06-05", amount: 140000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 105000, isUpi: true, description: "UPI - Wholesale Supplier Vizag" },
      { date: "2026-06-08", amount: 85000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 190000, isUpi: true, description: "UPI QR - Store Sales Batch C" },
      { date: "2026-06-12", amount: 24000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 166000, isUpi: false, description: "EPFO e-payment Andhra" },
      { date: "2026-06-15", amount: 15000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 151000, isUpi: true, description: "UPI - APEPDCL Electricity Bill" },
      { date: "2026-06-20", amount: 105000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 256000, isUpi: true, description: "UPI QR - Store Sales Batch D" },
      { date: "2026-06-25", amount: 30000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 226000, isUpi: true, description: "Rent Transfer - Commercial Space" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-04",
    pan: "AEWPM7123A",
    gstin: "27AEWPM7123A1Z8",
    businessName: "Ganesh Metal Crafts",
    sector: "Manufacturing",
    incorporationDate: "2022-03-10",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Maharashtra",
    employeeCount: 14,
    monthlyRevenue: 450000,
    onboardedAt: "2026-06-05",
    // SCENARIO: Poor rating. Low cash flow, falling employees, extreme GSTR delays and pending.
    gstHistory: [
      { period: "2026-01", turnover: 490000, filingDelayDays: 12, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 490000, filingDelayDays: 14, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 450000, filingDelayDays: 25, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 450000, filingDelayDays: 29, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 380000, filingDelayDays: 32, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 380000, filingDelayDays: 35, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-04", turnover: 350000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Pending" },
      { period: "2026-04", turnover: 350000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Pending" },
      { period: "2026-05", turnover: 310000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Pending" },
      { period: "2026-05", turnover: 310000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Pending" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 18, contributionAmount: 54000, status: "Paid" },
      { period: "2026-02", employeeCount: 16, contributionAmount: 48000, status: "Delayed" },
      { period: "2026-03", employeeCount: 14, contributionAmount: 42000, status: "Delayed" },
      { period: "2026-04", employeeCount: 14, contributionAmount: 42000, status: "Unpaid" },
      { period: "2026-05", employeeCount: 14, contributionAmount: 42000, status: "Unpaid" },
    ],
    transactions: [
      { date: "2026-06-02", amount: 110000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 120000, isUpi: false, description: "Cheque Deposit - Local Dealer" },
      { date: "2026-06-06", amount: 150000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: -30000, isUpi: false, description: "OD A/C Debit - Metal Sheet Stockist" },
      { date: "2026-06-10", amount: 35000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 5000, isUpi: true, description: "UPI - Scrap Sales" },
      { date: "2026-06-15", amount: 45000, type: "debit", counterpartyCategory: "Rent", balanceAfter: -40000, isUpi: true, description: "UPI - Workshop Rent (Overdraft)" },
      { date: "2026-06-20", amount: 20000, type: "debit", counterpartyCategory: "Utility", balanceAfter: -60000, isUpi: false, description: "MSEDCL Power Penalty payment" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-05",
    pan: "ACDPR5520D",
    gstin: "29ACDPR5520D1ZE",
    businessName: "Quantum Web Solutions",
    sector: "IT & Services",
    incorporationDate: "2020-05-18",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Karnataka",
    employeeCount: 18,
    monthlyRevenue: 2400000,
    onboardedAt: "2026-06-03",
    gstHistory: [
      { period: "2026-01", turnover: 2200000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 2200000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 2350000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 2350000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 2450000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 2450000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 2500000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 2500000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 2400000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 2400000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 16, contributionAmount: 64000, status: "Paid" },
      { period: "2026-02", employeeCount: 16, contributionAmount: 64000, status: "Paid" },
      { period: "2026-03", employeeCount: 17, contributionAmount: 68000, status: "Paid" },
      { period: "2026-04", employeeCount: 18, contributionAmount: 72000, status: "Paid" },
      { period: "2026-05", employeeCount: 18, contributionAmount: 72000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 800000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 1200000, isUpi: true, description: "UPI - Razorpay Payout Corporate Clients" },
      { date: "2026-06-05", amount: 72000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 1128000, isUpi: false, description: "EPFO e-Payment Karnataka" },
      { date: "2026-06-10", amount: 650000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 1778000, isUpi: true, description: "UPI - Stripe Payout SaaS Sales" },
      { date: "2026-06-12", amount: 140000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 1638000, isUpi: true, description: "UPI Rent - TechPark Bangalore" },
      { date: "2026-06-18", amount: 15000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 1623000, isUpi: true, description: "UPI - AWS Cloud Infrastructure payment" },
      { date: "2026-06-25", amount: 450000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 2073000, isUpi: true, description: "UPI - App Development Contract Phase 2" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-06",
    pan: "AFGPA6639S",
    gstin: "03AFGPA6639S1ZK",
    businessName: "Saraswati Agro Implements",
    sector: "Agro Processing",
    incorporationDate: "2017-03-15",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Punjab",
    employeeCount: 15,
    monthlyRevenue: 950000,
    onboardedAt: "2026-06-06",
    gstHistory: [
      { period: "2026-01", turnover: 910000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 910000, filingDelayDays: 3, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 930000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 930000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 980000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 980000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 920000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 920000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 950000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 950000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-02", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-03", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-04", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-05", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-03", amount: 300000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 350000, isUpi: true, description: "UPI - Harpreet Tractor Agency" },
      { date: "2026-06-07", amount: 140000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 210000, isUpi: false, description: "RTGS - Ludhiana Steel Casting" },
      { date: "2026-06-12", amount: 45000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 165000, isUpi: false, description: "EPFO e-payment Ludhiana" },
      { date: "2026-06-15", amount: 180000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 345000, isUpi: true, description: "UPI - Kisan Vikas Coop" },
      { date: "2026-06-25", amount: 25000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 320000, isUpi: true, description: "UPI - PSPCL Electric Bill" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-07",
    pan: "AEFPD1203Q",
    gstin: "06AEFPD1203Q1ZH",
    businessName: "Elite Logistics & Transport",
    sector: "Logistics",
    incorporationDate: "2018-10-10",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Haryana",
    employeeCount: 35,
    monthlyRevenue: 1500000,
    onboardedAt: "2026-06-07",
    gstHistory: [
      { period: "2026-01", turnover: 1420000, filingDelayDays: 5, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 1420000, filingDelayDays: 6, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1480000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1480000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1550000, filingDelayDays: 12, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 1550000, filingDelayDays: 14, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-04", turnover: 1490000, filingDelayDays: 3, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1490000, filingDelayDays: 4, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1500000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1500000, filingDelayDays: 3, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 32, contributionAmount: 96000, status: "Paid" },
      { period: "2026-02", employeeCount: 32, contributionAmount: 96000, status: "Paid" },
      { period: "2026-03", employeeCount: 35, contributionAmount: 105000, status: "Paid" },
      { period: "2026-04", employeeCount: 35, contributionAmount: 105000, status: "Delayed" },
      { period: "2026-05", employeeCount: 35, contributionAmount: 105000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 420000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 510000, isUpi: true, description: "UPI - Delhi Cargo Hub Inflow" },
      { date: "2026-06-04", amount: 250000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 260000, isUpi: false, description: "NEFT - Indian Oil Fleet refueling" },
      { date: "2026-06-11", amount: 105000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 155000, isUpi: false, description: "EPFO e-payment Gurugram" },
      { date: "2026-06-15", amount: 390000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 545000, isUpi: true, description: "UPI - Gati Distributors Ltd" },
      { date: "2026-06-22", amount: 85000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 460000, isUpi: true, description: "UPI Rent - Warehouse Storage Space" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-08",
    pan: "AELPA3345T",
    gstin: "07AELPA3345T1ZD",
    businessName: "Jai Ho Garments Unit",
    sector: "Manufacturing",
    incorporationDate: "2021-02-14",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Delhi",
    employeeCount: 12,
    monthlyRevenue: 300000,
    onboardedAt: "2026-06-08",
    // SCENARIO: Severe compliance issues, pending GSTs, declining employees, cash flow critical. Poor rating.
    gstHistory: [
      { period: "2026-01", turnover: 410000, filingDelayDays: 15, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-01", turnover: 410000, filingDelayDays: 18, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 380000, filingDelayDays: 22, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 380000, filingDelayDays: 25, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 320000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Pending" },
      { period: "2026-03", turnover: 320000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Pending" },
      { period: "2026-04", turnover: 300000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Pending" },
      { period: "2026-04", turnover: 300000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Pending" },
      { period: "2026-05", turnover: 280000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Pending" },
      { period: "2026-05", turnover: 280000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Pending" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 18, contributionAmount: 54000, status: "Paid" },
      { period: "2026-02", employeeCount: 15, contributionAmount: 45000, status: "Delayed" },
      { period: "2026-03", employeeCount: 12, contributionAmount: 36000, status: "Unpaid" },
      { period: "2026-04", employeeCount: 12, contributionAmount: 36000, status: "Unpaid" },
      { period: "2026-05", employeeCount: 12, contributionAmount: 36000, status: "Unpaid" },
    ],
    transactions: [
      { date: "2026-06-02", amount: 60000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 68000, isUpi: true, description: "UPI - Boutique Inflow Batch" },
      { date: "2026-06-08", amount: 80000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: -12000, isUpi: false, description: "NEFT - Okhla Thread Mill (Overdraft)" },
      { date: "2026-06-15", amount: 35000, type: "debit", counterpartyCategory: "Rent", balanceAfter: -47000, isUpi: true, description: "UPI Rent - Factory Shed Delhi" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-09",
    pan: "ABKPR4420M",
    gstin: "32ABKPR4420M1ZG",
    businessName: "Royal Spices Export Co",
    sector: "Agro Processing",
    incorporationDate: "2018-06-12",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Kerala",
    employeeCount: 22,
    monthlyRevenue: 1400000,
    onboardedAt: "2026-06-09",
    gstHistory: [
      { period: "2026-01", turnover: 1300000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 1300000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1350000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 1350000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1450000, filingDelayDays: 4, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 1450000, filingDelayDays: 5, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1400000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 1400000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1400000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 1400000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 22, contributionAmount: 66000, status: "Paid" },
      { period: "2026-02", employeeCount: 22, contributionAmount: 66000, status: "Paid" },
      { period: "2026-03", employeeCount: 22, contributionAmount: 66000, status: "Paid" },
      { period: "2026-04", employeeCount: 22, contributionAmount: 66000, status: "Paid" },
      { period: "2026-05", employeeCount: 22, contributionAmount: 66000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 480000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 580000, isUpi: true, description: "UPI - Kochi Spice Hub exports" },
      { date: "2026-06-06", amount: 180000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 400000, isUpi: false, description: "NEFT - Cardamom Farmers Coop" },
      { date: "2026-06-10", amount: 66000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 334000, isUpi: false, description: "EPFO e-payment Cochin" },
      { date: "2026-06-15", amount: 310000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 644000, isUpi: true, description: "UPI - Spices Board India credit" },
      { date: "2026-06-22", amount: 45000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 599000, isUpi: true, description: "UPI - KSEB Power payment" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-10",
    pan: "AEWPM5520F",
    gstin: "09AEWPM5520F1ZD",
    businessName: "Krishna Sweet Mart",
    sector: "Retail",
    incorporationDate: "2022-09-01",
    consentStatus: { gst: true, upi: true, epfo: false },
    state: "Uttar Pradesh",
    employeeCount: 0, // No EPFO records (small family store)
    monthlyRevenue: 550000,
    onboardedAt: "2026-06-10",
    gstHistory: [
      { period: "2026-01", turnover: 520000, filingDelayDays: 4, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 520000, filingDelayDays: 5, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 540000, filingDelayDays: 3, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 540000, filingDelayDays: 4, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 580000, filingDelayDays: 6, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 580000, filingDelayDays: 7, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 510000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 510000, filingDelayDays: 3, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 550000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 550000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [], // empty (no EPFO registered)
    transactions: [
      { date: "2026-06-01", amount: 85000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 110000, isUpi: true, description: "UPI QR Inflow - Daily Sweets Sales" },
      { date: "2026-06-04", amount: 90000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 200000, isUpi: true, description: "UPI QR Inflow - Marriage Party Advance" },
      { date: "2026-06-08", amount: 110000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 90000, isUpi: true, description: "UPI - Milk & Khoya Traders" },
      { date: "2026-06-15", amount: 95000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 185000, isUpi: true, description: "UPI QR Inflow - Store Retail" },
      { date: "2026-06-22", amount: 35000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 150000, isUpi: true, description: "UPI Rent - Shop Rent Varanasi" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-11",
    pan: "AEWPM2204B",
    gstin: "33AEWPM2204B1ZH",
    businessName: "Apex Auto Components Pvt Ltd",
    sector: "Manufacturing",
    incorporationDate: "2015-02-10",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Tamil Nadu",
    employeeCount: 52,
    monthlyRevenue: 2800000,
    onboardedAt: "2026-06-01",
    gstHistory: [
      { period: "2026-01", turnover: 2600000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 2600000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 2750000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 2750000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 2900000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 2900000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 2850000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 2850000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 2800000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 2800000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 50, contributionAmount: 150000, status: "Paid" },
      { period: "2026-02", employeeCount: 50, contributionAmount: 150000, status: "Paid" },
      { period: "2026-03", employeeCount: 52, contributionAmount: 156000, status: "Paid" },
      { period: "2026-04", employeeCount: 52, contributionAmount: 156000, status: "Paid" },
      { period: "2026-05", employeeCount: 52, contributionAmount: 156000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 750000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 950000, isUpi: true, description: "UPI - Chennai Auto Hub" },
      { date: "2026-06-05", amount: 280000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 670000, isUpi: false, description: "RTGS - Tata Steel Supply" },
      { date: "2026-06-10", amount: 156000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 514000, isUpi: false, description: "EPFO e-payment Chennai" },
      { date: "2026-06-15", amount: 650000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 1164000, isUpi: true, description: "UPI - Sundaram Fasteners Credit" },
      { date: "2026-06-25", amount: 95000, type: "debit", counterpartyCategory: "Utility", balanceAfter: 1069000, isUpi: true, description: "UPI - TANGEDCO Power Bill" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-12",
    pan: "AEGPA8122D",
    gstin: "19AEGPA8122D1ZC",
    businessName: "Global Print & Pack",
    sector: "Manufacturing",
    incorporationDate: "2020-11-20",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "West Bengal",
    employeeCount: 15,
    monthlyRevenue: 700000,
    onboardedAt: "2026-06-11",
    gstHistory: [
      { period: "2026-01", turnover: 680000, filingDelayDays: 4, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 680000, filingDelayDays: 5, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 710000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 710000, filingDelayDays: 3, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 730000, filingDelayDays: 9, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 730000, filingDelayDays: 10, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 690000, filingDelayDays: 3, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 690000, filingDelayDays: 4, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 700000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 700000, filingDelayDays: 3, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-02", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-03", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-04", employeeCount: 15, contributionAmount: 45000, status: "Delayed" },
      { period: "2026-05", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-02", amount: 190000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 240000, isUpi: true, description: "UPI QR Inflow - Packaging Orders" },
      { date: "2026-06-05", amount: 95000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 145000, isUpi: false, description: "NEFT - Kraft Paper Mill Bengal" },
      { date: "2026-06-12", amount: 45000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 100000, isUpi: false, description: "EPFO e-payment Kolkata" },
      { date: "2026-06-18", amount: 150000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 250000, isUpi: true, description: "UPI - FMCG Client Deposit" },
      { date: "2026-06-24", amount: 35000, type: "debit", counterpartyCategory: "Rent", balanceAfter: 215000, isUpi: true, description: "UPI - Print Shop Rental" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-13",
    pan: "ABKPM5422S",
    gstin: "27ABKPM5422S1Z3",
    businessName: "Shiva Clean Tech Solutions",
    sector: "Services",
    incorporationDate: "2021-08-01",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Maharashtra",
    employeeCount: 16,
    monthlyRevenue: 980000,
    onboardedAt: "2026-06-03",
    gstHistory: [
      { period: "2026-01", turnover: 910000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 910000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 930000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 930000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 950000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 950000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 970000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 970000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 980000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 980000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-02", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-03", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-04", employeeCount: 15, contributionAmount: 45000, status: "Paid" },
      { period: "2026-05", employeeCount: 16, contributionAmount: 48000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-01", amount: 310000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 390000, isUpi: true, description: "UPI - BMC Pune waste services" },
      { date: "2026-06-05", amount: 48000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 342000, isUpi: false, description: "EPFO e-payment Pune" },
      { date: "2026-06-10", amount: 280000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 622000, isUpi: true, description: "UPI - Godrej Housing Society contract" },
      { date: "2026-06-15", amount: 85000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 537000, isUpi: true, description: "UPI - Eco-Bag supply bills" },
      { date: "2026-06-22", amount: 250000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 787000, isUpi: true, description: "UPI - Serum Institute cleaning contract" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-14",
    pan: "AEKPA6432Z",
    gstin: "36AEKPA6432Z1Z2",
    businessName: "Modern Handloom Weavers Weft",
    sector: "Manufacturing",
    incorporationDate: "2021-06-15",
    consentStatus: { gst: true, upi: true, epfo: false },
    state: "Telangana",
    employeeCount: 0,
    monthlyRevenue: 380000,
    onboardedAt: "2026-06-12",
    gstHistory: [
      { period: "2026-01", turnover: 420000, filingDelayDays: 14, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-01", turnover: 420000, filingDelayDays: 16, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 410000, filingDelayDays: 12, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-02", turnover: 410000, filingDelayDays: 14, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 390000, filingDelayDays: 21, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-03", turnover: 390000, filingDelayDays: 23, returnType: "GSTR-3B", filingStatus: "Delayed" },
      { period: "2026-04", turnover: 370000, filingDelayDays: 9, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 370000, filingDelayDays: 10, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 380000, filingDelayDays: 15, returnType: "GSTR-1", filingStatus: "Delayed" },
      { period: "2026-05", turnover: 380000, filingDelayDays: 17, returnType: "GSTR-3B", filingStatus: "Delayed" },
    ],
    epfoHistory: [],
    transactions: [
      { date: "2026-06-03", amount: 75000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 95000, isUpi: true, description: "UPI - Handloom Coop Inflow" },
      { date: "2026-06-08", amount: 65000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 30000, isUpi: true, description: "UPI - Yarn distributor Hyd" },
      { date: "2026-06-15", amount: 45000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 75000, isUpi: true, description: "UPI QR - Exhibition Stall sales" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
  {
    id: "msme-15",
    pan: "ABGPA9201C",
    gstin: "32ABGPA9201C1ZB",
    businessName: "Veda Wellness Clinic",
    sector: "Services",
    incorporationDate: "2020-02-15",
    consentStatus: { gst: true, upi: true, epfo: true },
    state: "Kerala",
    employeeCount: 14,
    monthlyRevenue: 850000,
    onboardedAt: "2026-06-09",
    gstHistory: [
      { period: "2026-01", turnover: 810000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-01", turnover: 810000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-02", turnover: 830000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-02", turnover: 830000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-03", turnover: 860000, filingDelayDays: 2, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-03", turnover: 860000, filingDelayDays: 2, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-04", turnover: 840000, filingDelayDays: 0, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-04", turnover: 840000, filingDelayDays: 0, returnType: "GSTR-3B", filingStatus: "Filed" },
      { period: "2026-05", turnover: 850000, filingDelayDays: 1, returnType: "GSTR-1", filingStatus: "Filed" },
      { period: "2026-05", turnover: 850000, filingDelayDays: 1, returnType: "GSTR-3B", filingStatus: "Filed" },
    ],
    epfoHistory: [
      { period: "2026-01", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-02", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-03", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-04", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
      { period: "2026-05", employeeCount: 14, contributionAmount: 42000, status: "Paid" },
    ],
    transactions: [
      { date: "2026-06-02", amount: 220000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 280000, isUpi: true, description: "UPI QR - Patient consultations A" },
      { date: "2026-06-05", amount: 42000, type: "debit", counterpartyCategory: "Payroll", balanceAfter: 238000, isUpi: false, description: "EPFO e-payment Trivandrum" },
      { date: "2026-06-10", amount: 180000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 418000, isUpi: true, description: "UPI QR - Patient consultations B" },
      { date: "2026-06-15", amount: 45000, type: "debit", counterpartyCategory: "Supplier", balanceAfter: 373000, isUpi: true, description: "UPI - Ayurvedic Medicine Suppliers" },
      { date: "2026-06-22", amount: 240000, type: "credit", counterpartyCategory: "Customer", balanceAfter: 613000, isUpi: true, description: "UPI QR - Corporate Wellness Retreat" },
    ],
    score: { scoreDate: "", overallScore: 0, band: "Poor", subScores: { cashFlow: 0, compliance: 0, stability: 0, digitalTrust: 0 }, strengths: [], risks: [] }
  },
];

// Initialize the scores dynamically for the preloaded profiles
SYNTHETIC_MSMES.forEach(m => {
  const incYear = new Date(m.incorporationDate).getFullYear();
  m.score = calculateMSMEScore(m.gstHistory, m.transactions, m.epfoHistory, incYear);
});
