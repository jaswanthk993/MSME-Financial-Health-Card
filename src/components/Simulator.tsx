import React, { useState, useEffect } from 'react';
import { MSME, ScoreRecord } from '../types';
import { Sparkles, Sliders, TrendingUp, HelpCircle, ArrowUpRight, CheckCircle, Percent, Users, FileText, QrCode } from 'lucide-react';

interface SimulatorProps {
  msme: MSME;
  onSimulate: (id: string, params: {
    gstFilingDelayReduction: number;
    cashFlowGrowth: number;
    employeeGrowth: number;
    digitalInflowRatio: number;
  }) => Promise<{ originalScore: ScoreRecord; simulatedScore: ScoreRecord }>;
}

export default function Simulator({ msme, onSimulate }: SimulatorProps) {
  
  // Slider states
  const [delayReduction, setDelayReduction] = useState<number>(0);
  const [cashFlowGrowth, setCashFlowGrowth] = useState<number>(0);
  const [employeeGrowth, setEmployeeGrowth] = useState<number>(0);
  const [digitalRatio, setDigitalRatio] = useState<number>(Math.round((msme.score.subScores.digitalTrust - 20) / 0.6) || 60);

  // Simulated score outcome
  const [simScore, setSimScore] = useState<ScoreRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Recalculate score whenever sliders change
  useEffect(() => {
    let active = true;
    const fetchSimulatedScore = async () => {
      try {
        setIsLoading(true);
        const res = await onSimulate(msme.id, {
          gstFilingDelayReduction: delayReduction,
          cashFlowGrowth,
          employeeGrowth,
          digitalInflowRatio: digitalRatio / 100,
        });
        if (active) {
          setSimScore(res.simulatedScore);
        }
      } catch (err) {
        console.error("Simulation failed:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const debounced = setTimeout(fetchSimulatedScore, 100);
    return () => {
      active = false;
      clearTimeout(debounced);
    };
  }, [msme, delayReduction, cashFlowGrowth, employeeGrowth, digitalRatio]);

  // Color helpers
  const getBandBadgeClass = (band: string) => {
    switch (band) {
      case 'Excellent': return 'bg-success/10 text-success border-success/20';
      case 'Good': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Average': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-danger/10 text-danger border-danger/20';
    }
  };

  const scoreDiff = simScore ? simScore.overallScore - msme.score.overallScore : 0;

  // Recommended lending simulation based on score
  const getSimulatedLendingLimit = (score: number, baseRevenue: number) => {
    // Basic underwriting logic: higher scores grant larger multiple of monthly revenue
    let multiplier = 0;
    let interestRate = "N/A";
    if (score >= 85) {
      multiplier = 2.5;
      interestRate = "9.5% - 11.5% p.a.";
    } else if (score >= 70) {
      multiplier = 1.8;
      interestRate = "11.5% - 13.5% p.a.";
    } else if (score >= 50) {
      multiplier = 1.0;
      interestRate = "13.5% - 16.0% p.a.";
    } else {
      multiplier = 0.3;
      interestRate = "16.0% - 18.5% p.a. (High Risk)";
    }
    const maxLimit = Math.round(baseRevenue * multiplier);
    return { limit: maxLimit, rate: interestRate };
  };

  const originalLending = getSimulatedLendingLimit(msme.score.overallScore, msme.monthlyRevenue);
  const simulatedLending = simScore ? getSimulatedLendingLimit(simScore.overallScore, msme.monthlyRevenue) : originalLending;

  return (
    <div id="what-if-simulator" className="space-y-6">
      
      {/* TITLE BOX */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" /> Alternate Credit Optimization Sandbox
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Simulate operational optimization (tax filing consistency, UPI transaction volume, EPFO workforce growth) to observe immediate impact on bank creditworthiness scores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SLIDERS SETTINGS (7 columns) */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-7 space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Adjustment Parameters — {msme.businessName}</h3>
          
          <div className="space-y-5">
            {/* Slider 1: GST Filing Delay Reduction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" /> Improve GST Filing discipline
                </label>
                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {delayReduction}% Delay Reduction
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                className="w-full accent-primary cursor-pointer"
                value={delayReduction}
                onChange={e => setDelayReduction(Number(e.target.value))}
              />
              <p className="text-[10px] text-slate-400">Reduces average days delayed filing GSTR-1 & 3B. Slid to 100% means tax returns filed perfectly on due date.</p>
            </div>

            {/* Slider 2: Monthly Cashflow Revenue Growth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-secondary" /> Cash Flow Revenue Shift
                </label>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${cashFlowGrowth >= 0 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                  {cashFlowGrowth >= 0 ? '+' : ''}{cashFlowGrowth}% Growth
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="100"
                step="5"
                className="w-full accent-secondary cursor-pointer"
                value={cashFlowGrowth}
                onChange={e => setCashFlowGrowth(Number(e.target.value))}
              />
              <p className="text-[10px] text-slate-400">Simulates growth/contraction of transaction volumes via UPI credit inflows over the base monthly average.</p>
            </div>

            {/* Slider 3: EPFO Workforce Headcount Growth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-success" /> Workforce Headcount Changes
                </label>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${employeeGrowth >= 0 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>
                  {employeeGrowth >= 0 ? '+' : ''}{employeeGrowth} Employees
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="20"
                step="1"
                disabled={msme.epfoHistory.length === 0}
                className={`w-full accent-success ${msme.epfoHistory.length === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                value={employeeGrowth}
                onChange={e => setEmployeeGrowth(Number(e.target.value))}
              />
              <p className="text-[10px] text-slate-400">
                {msme.epfoHistory.length === 0 
                  ? "Disabled: No starting EPFO registry found for this small-scale micro enterprise."
                  : "Modifies formal headcount. Growing workforce indicates structural continuity & business expansion."
                }
              </p>
            </div>

            {/* Slider 4: Digital UPI/QR Cash Flow Footprint Ratio */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-warning" /> Digital UPI Credit Ratio
                </label>
                <span className="text-xs font-mono font-bold text-warning bg-warning/10 px-2 py-0.5 rounded">
                  {digitalRatio}% UPI Payments
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                className="w-full accent-warning cursor-pointer"
                value={digitalRatio}
                onChange={e => setDigitalRatio(Number(e.target.value))}
              />
              <p className="text-[10px] text-slate-400">Increases the share of business cash flows moving via transparent digital networks (QR codes/UPI) vs. opaque paper cash.</p>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex gap-3 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These factors directly feed the <strong>IDBI Innovate Alternate Underwriting Pipeline</strong>, updating OCEN (Open Credit Enabled Network) rulesets in real-time.
            </p>
          </div>
        </div>        {/* SIMULATION VISUAL OUTCOMES (5 columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* COMPARISON SCORE CARD */}
          <div className="bg-ink text-white p-6 rounded-2xl border border-border/10 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Sandbox Calculation</p>
                <h4 className="text-lg font-bold mt-1">Simulated Outcome</h4>
              </div>
              {scoreDiff !== 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${scoreDiff > 0 ? 'bg-success/20 text-success border-success/30' : 'bg-danger/20 text-danger border-danger/30'}`}>
                  {scoreDiff > 0 ? '+' : ''}{scoreDiff} Points Shift
                </span>
              )}
            </div>

            {/* Score Side-by-Side numbers */}
            <div className="flex items-center justify-around py-2">
              <div className="text-center space-y-1">
                <p className="text-[10px] uppercase text-slate-500 font-mono">Original Score</p>
                <p className="text-3xl font-extrabold text-slate-400">{msme.score.overallScore}</p>
                <span className="text-[10px] text-slate-400 block">{msme.score.band}</span>
              </div>

              <div className="h-10 w-0.5 bg-white/10" />

              <div className="text-center space-y-1 relative">
                <p className="text-[10px] uppercase text-primary font-mono font-bold flex items-center justify-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Simulated Score
                </p>
                {isLoading ? (
                  <div className="h-9 flex items-center justify-center">
                    <span className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></span>
                  </div>
                ) : (
                  <p className={`text-4xl font-extrabold ${scoreDiff > 0 ? 'text-success' : scoreDiff < 0 ? 'text-danger' : 'text-secondary'}`}>
                    {simScore?.overallScore}
                  </p>
                )}
                {simScore && (
                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${getBandBadgeClass(simScore.band)} inline-block mt-0.5`}>
                    {simScore.band} Band
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs space-y-1 leading-relaxed">
              <span className="font-semibold text-slate-300">Alternate Signals Evaluation:</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-slate-400 mt-1">
                <p>Compliance: <span className="text-white font-semibold">{simScore?.subScores.compliance}/100</span></p>
                <p>Cash Flow: <span className="text-white font-semibold">{simScore?.subScores.cashFlow}/100</span></p>
                <p>Stability: <span className="text-white font-semibold">{simScore?.subScores.stability}/100</span></p>
                <p>Digi Trust: <span className="text-white font-semibold">{simScore?.subScores.digitalTrust}/100</span></p>
              </div>
            </div>
          </div>

          {/* SIMULATED UNDERWRITING RECOMMENDATION */}
          <div className="bg-white p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-ink" /> Simulated Underwriting Limits
            </h4>

            <div className="space-y-3">
              {/* Limit amount */}
              <div className="flex justify-between items-center border-b border-border pb-2.5">
                <p className="text-xs text-slate-500">Max Recommended Business Loan</p>
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through">₹{originalLending.limit.toLocaleString()}</p>
                  <p className="text-base font-extrabold text-ink">
                    ₹{simulatedLending.limit.toLocaleString()} <span className="text-[10px] text-slate-400 font-normal">INR</span>
                  </p>
                </div>
              </div>

              {/* Interest rate */}
              <div className="flex justify-between items-center border-b border-border pb-2.5">
                <p className="text-xs text-slate-500">Offered Interest Rate Band</p>
                <div className="text-right">
                  <p className="text-xs text-slate-400 line-through">{originalLending.rate}</p>
                  <p className="text-sm font-bold text-success">{simulatedLending.rate}</p>
                </div>
              </div>

              {/* Repayment mode */}
              <div className="flex justify-between items-center text-xs">
                <p className="text-slate-500">Mitigation sweeping sweeps</p>
                <div className="text-right font-medium text-ink font-mono">
                  {simScore && simScore.overallScore >= 85 ? 'Monthly EMI' : 
                   simScore && simScore.overallScore >= 70 ? 'Semi-Monthly EMI' : 'Daily automatic sweep (OCEN Escrow)'}
                </div>
              </div>
            </div>

            <div className="bg-success/5 border border-success/15 p-3 rounded-xl text-[11px] text-success leading-relaxed font-sans flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
              <span>
                <strong>Credit Boost:</strong> Improving GST delays and transaction routing directly lowers risk margins, triggering dynamic automated credit expansions in real-time.
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
