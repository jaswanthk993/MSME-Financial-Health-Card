import React, { useState } from 'react';
import { MSME, GSTRecord, TransactionRecord, EPFORecord } from '../types';
import { 
  ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, FileText, 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  Users, Building2, Landmark, Clock, IndianRupee, HelpCircle, Activity 
} from 'lucide-react';

interface HealthCardProps {
  msme: MSME;
  onBack: () => void;
  onRefreshData: (id: string) => Promise<void>;
  isRefreshing: boolean;
}

export default function HealthCard({
  msme,
  onBack,
  onRefreshData,
  isRefreshing,
}: HealthCardProps) {
  
  const [activeTab, setActiveTab] = useState<'gst' | 'cash' | 'epfo'>('gst');

  // Score styling helpers
  const getBandBadgeClass = (band: string) => {
    switch (band) {
      case 'Excellent': return 'bg-success/10 text-success border-success/20';
      case 'Good': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Average': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-danger/10 text-danger border-danger/20';
    }
  };

  const getScoreCircleColor = (score: number) => {
    if (score >= 85) return 'stroke-success';
    if (score >= 70) return 'stroke-secondary';
    if (score >= 50) return 'stroke-warning';
    return 'stroke-danger';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-success/10 text-success border-success/20';
    if (score >= 70) return 'bg-secondary/10 text-secondary border-secondary/20';
    if (score >= 50) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-danger/10 text-danger border-danger/20';
  };

  // SVG Gauge calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (msme.score.overallScore / 100) * circumference;

  return (
    <div id="msme-health-card-view" className="space-y-6">
      
      {/* ACTION BAR / HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-ink transition-colors font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-bg"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onRefreshData(msme.id)}
            disabled={isRefreshing}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg border border-primary/10 text-white transition-all bg-primary hover:bg-opacity-95 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Ingesting Alternate Streams...' : 'Trigger Real-Time Stream Ingestion'}
          </button>
        </div>
      </div>

      {/* CORE PROFILE HERO */}
      <div className="bg-ink text-white p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-md">
        <div className="space-y-3 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-success/20 text-success border border-success/30 rounded-full tracking-wider">
              {msme.sector}
            </span>
            <span className="px-2.5 py-0.5 text-[10px] font-mono bg-white/10 text-white/80 border border-white/10 rounded-full">
              State: {msme.state}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{msme.businessName}</h2>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-300">
            <p>PAN: <span className="text-white font-medium">{msme.pan}</span></p>
            <p>GSTIN: <span className="text-white font-medium">{msme.gstin}</span></p>
            <p>Incorp. Date: <span className="text-white font-medium">{msme.incorporationDate}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10 bg-white/5 border border-white/10 px-4 py-3 rounded-xl backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 text-success" />
          <div className="text-xs">
            <p className="text-slate-400 font-medium">Consent Registry Status</p>
            <div className="flex gap-2 mt-1 font-semibold font-mono text-[10px]">
              <span className={msme.consentStatus.gst ? 'text-success' : 'text-danger'}>GST ✔</span>
              <span className="text-slate-500">•</span>
              <span className={msme.consentStatus.upi ? 'text-success' : 'text-danger'}>UPI ✔</span>
              <span className="text-slate-500">•</span>
              <span className={msme.consentStatus.epfo ? 'text-success' : 'text-danger'}>EPFO ✔</span>
            </div>
          </div>
        </div>
      </div>

      {/* THREE-COLUMN SCORE CARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SCORE CIRCLE METER (4 columns) */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-4 flex flex-col items-center justify-center text-center space-y-4">
          <h3 className="text-sm font-bold text-slate-700 tracking-wider uppercase">Alternate Credit Rating</h3>
          
          <div className="relative h-40 w-40 flex items-center justify-center">
            {/* SVG Arc Progress Meter */}
            <svg className="absolute inset-0 h-full w-full transform -rotate-90">
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className="stroke-bg" 
                strokeWidth="10" 
                fill="none" 
              />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                className={`transition-all duration-1000 ease-out ${getScoreCircleColor(msme.score.overallScore)}`} 
                strokeWidth="10" 
                fill="none" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-extrabold text-ink">{msme.score.overallScore}</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Health Score</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className={`px-4 py-1 text-sm font-bold rounded-full border ${getBandBadgeClass(msme.score.band)}`}>
              {msme.score.band} Band
            </span>
            <p className="text-xs text-slate-400 mt-2">Dossier Pulled: {msme.score.scoreDate}</p>
          </div>
        </div>

        {/* SUB-SCORES BREAKDOWN BAR GRAPHS (5 columns) */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 tracking-wider uppercase">Financial Health Subscores</h3>
          
          <div className="space-y-4">
            {/* Cash Flow */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-secondary" />
                  UPI Cash Flow Liquidity
                </span>
                <span className="font-mono font-bold text-ink">{msme.score.subScores.cashFlow}/100</span>
              </div>
              <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${msme.score.subScores.cashFlow}%` }} />
              </div>
              <p className="text-[10px] text-slate-400">Evaluates daily credit frequency, cash balance safety, credit-to-debit margins.</p>
            </div>

            {/* Compliance */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Tax Compliance Discipline (GST)
                </span>
                <span className="font-mono font-bold text-ink">{msme.score.subScores.compliance}/100</span>
              </div>
              <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${msme.score.subScores.compliance}%` }} />
              </div>
              <p className="text-[10px] text-slate-400">Derived from GSTR-1 & 3B filing delay days and pending taxes.</p>
            </div>

            {/* Stability */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-success" />
                  Workforce & Business Age (EPFO)
                </span>
                <span className="font-mono font-bold text-ink">{msme.score.subScores.stability}/100</span>
              </div>
              <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden">
                <div className="bg-success h-full rounded-full" style={{ width: `${msme.score.subScores.stability}%` }} />
              </div>
              <p className="text-[10px] text-slate-400">Scored based on months of EPFO payment timeliness and employee count stability.</p>
            </div>

            {/* Digital Trust */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-warning" />
                  Digital Footprint & Trust
                </span>
                <span className="font-mono font-bold text-ink">{msme.score.subScores.digitalTrust}/100</span>
              </div>
              <div className="w-full bg-bg h-2.5 rounded-full overflow-hidden">
                <div className="bg-warning h-full rounded-full" style={{ width: `${msme.score.subScores.digitalTrust}%` }} />
              </div>
              <p className="text-[10px] text-slate-400">Assesses supplier counterparty diversity and ONDC/digital payment footprint ratios.</p>
            </div>
          </div>
        </div>

        {/* REVENUE & BASIC STATS (3 columns) */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-3 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 tracking-wider uppercase">Alternate Metrics</h3>
            
            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase">Est. Monthly Revenue</p>
              <p className="text-xl font-extrabold text-ink">₹{msme.monthlyRevenue.toLocaleString()}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase">EPFO Staff Payroll</p>
              <p className="text-xl font-extrabold text-ink">
                {msme.employeeCount > 0 ? `${msme.employeeCount} Enrolled` : 'No Payroll Tracked'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400 uppercase">Avg GSTR Filing Delay</p>
              <p className="text-xl font-extrabold text-ink">
                {msme.gstHistory.length > 0 
                  ? `${Math.round(msme.gstHistory.reduce((sum, g) => sum + g.filingDelayDays, 0) / msme.gstHistory.length)} Days`
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          <div className="bg-bg border border-border p-2.5 rounded-lg text-[11px] text-slate-500 leading-relaxed font-mono">
            <strong>Credit Note:</strong> Real-time feeds indicate stable operating capital ratios. Suitable for OCEN automated limit.
          </div>
        </div>

      </div>

      {/* STRENGTHS AND RISKS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-success/5 border border-success/20 p-5 rounded-2xl space-y-3 shadow-sm">
          <h4 className="text-sm font-bold text-success flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" /> Alternate Credit Strengths
          </h4>
          <ul className="space-y-2 text-xs text-slate-800 leading-relaxed pl-1">
            {msme.score.strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-success font-bold mt-0.5">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div className="bg-danger/5 border border-danger/20 p-5 rounded-2xl space-y-3 shadow-sm">
          <h4 className="text-sm font-bold text-danger flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" /> Risks & Red Flag Alerts
          </h4>
          <ul className="space-y-2 text-xs text-slate-800 leading-relaxed pl-1">
            {msme.score.risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-danger font-bold mt-0.5">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* DETAIL TABS (GST FILING, TRANSACTIONS, EPFO) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Tab Selection Headers */}
        <div className="flex border-b border-border bg-bg/50">
          <button
            onClick={() => setActiveTab('gst')}
            className={`flex-1 py-3 px-4 font-bold text-xs uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'gst' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            <FileText className="h-4 w-4" /> GST tax returns (GSTR-1/3B)
          </button>
          <button
            onClick={() => setActiveTab('cash')}
            className={`flex-1 py-3 px-4 font-bold text-xs uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'cash' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            <IndianRupee className="h-4 w-4" /> UPI & bank transactions (AA)
          </button>
          <button
            onClick={() => setActiveTab('epfo')}
            className={`flex-1 py-3 px-4 font-bold text-xs uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${activeTab === 'epfo' ? 'border-primary text-primary bg-white' : 'border-transparent text-slate-500 hover:text-ink'}`}
          >
            <Users className="h-4 w-4" /> EPFO employee payroll
          </button>
        </div>

        <div className="p-5">
          {/* GST TAB CONTENT */}
          {activeTab === 'gst' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">GST GSTIN Filing Log & Turnover stability</h4>
                <span className="text-xs text-slate-400">Pulled from GSTN Portal under credit consent</span>
              </div>

              {/* Turnover Trend graph (Custom SVG Chart) */}
              <div className="bg-bg p-4 rounded-xl border border-border space-y-2">
                <h5 className="text-xs font-semibold text-ink">Turnover Trends (INR in lakhs)</h5>
                
                <div className="h-32 flex items-end gap-3 pt-4 border-b border-border">
                  {msme.gstHistory.filter(g => g.returnType === 'GSTR-1').map((g, i) => {
                    const valueLakhs = g.turnover / 100000;
                    const maxVal = Math.max(...msme.gstHistory.map(rec => rec.turnover)) / 100000 || 1;
                    const heightPct = (valueLakhs / maxVal) * 85;
                    
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div className="w-full bg-primary rounded-t hover:bg-secondary transition-colors" style={{ height: `${heightPct}%` }} />
                        <span className="text-[10px] text-slate-500 mt-1 font-mono">{g.period}</span>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-ink text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none transition-opacity font-mono z-20">
                          ₹{g.turnover.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table of filings */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-bg border-b border-border text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-3">Filing Period</th>
                      <th className="p-3">Turnover Declared</th>
                      <th className="p-3">Return Type</th>
                      <th className="p-3 text-center">Filing Delay</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {msme.gstHistory.slice().reverse().map((g, i) => (
                      <tr key={i} className="hover:bg-bg/40">
                        <td className="p-3 font-semibold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {g.period}
                        </td>
                        <td className="p-3 font-medium text-slate-700">₹{g.turnover.toLocaleString()}</td>
                        <td className="p-3"><span className="px-2 py-0.5 bg-bg rounded text-slate-600 border border-border">{g.returnType}</span></td>
                        <td className="p-3 text-center">
                          {g.filingDelayDays === 0 ? (
                            <span className="text-success font-medium">On-Time (0 days)</span>
                          ) : g.filingStatus === 'Pending' ? (
                            <span className="text-danger font-bold flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3" /> Pending (Overdue)
                            </span>
                          ) : (
                            <span className="text-warning font-medium">{g.filingDelayDays} Days Delay</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${g.filingStatus === 'Filed' ? 'bg-success/10 text-success' : g.filingStatus === 'Delayed' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                            {g.filingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CASHFLOW / TRANSACTION TAB CONTENT */}
          {activeTab === 'cash' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consent-based bank statement credits & UPI flows</h4>
                <span className="text-xs text-slate-400">Secured through Account Aggregator (AA) schema</span>
              </div>

              {/* Transactions grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Credit count */}
                <div className="bg-success/5 border border-success/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Total Digital Credits</p>
                    <p className="text-xl font-bold text-success mt-1">
                      ₹{msme.transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  </div>
                </div>
                {/* Debit count */}
                <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Total Digital Debits</p>
                    <p className="text-xl font-bold text-danger mt-1">
                      ₹{msme.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center">
                    <ArrowDownLeft className="h-5 w-5 text-danger" />
                  </div>
                </div>
                {/* Net reserve surplus */}
                <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs uppercase">Monthly Cash Surplus</p>
                    <p className="text-xl font-bold text-ink mt-1">
                      ₹{(
                        msme.transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0) -
                        msme.transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-ink">UPI QR & Net Banking Ledger</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg border-b border-border text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="p-3">Value Date</th>
                        <th className="p-3">Reference / Narration</th>
                        <th className="p-3 text-center">Inflow / Outflow</th>
                        <th className="p-3">Counterparty Tag</th>
                        <th className="p-3 text-right">Balance Post-TX</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {msme.transactions.map((t, i) => (
                        <tr key={i} className="hover:bg-bg/40">
                          <td className="p-3 text-slate-500 font-normal">{t.date}</td>
                          <td className="p-3 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5 font-sans">
                              {t.isUpi && <span className="px-1.5 py-0.2 text-[8px] uppercase bg-secondary/10 text-secondary rounded font-bold">UPI QR</span>}
                              <span className="font-mono">{t.description}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-bold font-sans px-2.5 py-0.5 rounded-full text-[10px] ${t.type === 'credit' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              {t.type === 'credit' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-3 font-sans">
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${
                              t.counterpartyCategory === 'Customer' ? 'bg-success/10 text-success border-success/20' :
                              t.counterpartyCategory === 'Supplier' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                              t.counterpartyCategory === 'Payroll' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-bg text-slate-700 border-border'
                            }`}>
                              {t.counterpartyCategory}
                            </span>
                          </td>
                          <td className="p-3 text-right font-semibold text-ink font-mono">₹{t.balanceAfter.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* EPFO PAYROLL CONTENT */}
          {activeTab === 'epfo' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">EPFO Employee Headcount & payroll timelines</h4>
                <span className="text-xs text-slate-400">Verifiable corporate stability metrics</span>
              </div>

              {msme.epfoHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-sans space-y-1">
                  <p className="font-semibold text-sm">No Enrolled EPFO Employee Records Found</p>
                  <p className="text-xs">This MSME may operate as a proprietary micro-unit or partnership without formal EPFO registration.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Custom headcount timeline SVG visualizer */}
                  <div className="bg-bg p-4 rounded-xl border border-border space-y-2">
                    <h5 className="text-xs font-semibold text-ink">EPFO Workforce Trend</h5>
                    
                    <div className="h-32 flex items-end gap-3 pt-4 border-b border-border">
                      {msme.epfoHistory.map((e, i) => {
                        const maxStaff = Math.max(...msme.epfoHistory.map(rec => rec.employeeCount)) || 1;
                        const heightPct = (e.employeeCount / maxStaff) * 80;
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group relative">
                            <div className="w-full bg-success rounded-t hover:bg-success/85 transition-colors" style={{ height: `${heightPct}%` }} />
                            <span className="text-[10px] text-slate-500 mt-1 font-mono">{e.period}</span>
                            
                            {/* Hover Tooltip */}
                            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-ink text-white text-[10px] px-2 py-1 rounded shadow pointer-events-none transition-opacity font-mono z-20">
                              {e.employeeCount} Enrolled Staff
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EPFO Record table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-bg border-b border-border text-slate-500 uppercase tracking-wider font-semibold">
                          <th className="p-3">Contribution Period</th>
                          <th className="p-3">Active Employee Count</th>
                          <th className="p-3">Amount Deposited (INR)</th>
                          <th className="p-3 text-right">EPFO Gateway Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {msme.epfoHistory.slice().reverse().map((e, i) => (
                          <tr key={i} className="hover:bg-bg/40">
                            <td className="p-3 font-semibold text-slate-700">{e.period}</td>
                            <td className="p-3 font-medium text-slate-700 flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-success" />
                              {e.employeeCount} Employees
                            </td>
                            <td className="p-3 font-medium text-slate-700">₹{e.contributionAmount.toLocaleString()}</td>
                            <td className="p-3 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${e.status === 'Paid' ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'}`}>
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
