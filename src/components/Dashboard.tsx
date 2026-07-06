import React, { useMemo } from 'react';
import { MSME } from '../types';
import { Search, Filter, ShieldAlert, CheckCircle2, TrendingUp, HelpCircle, ArrowRight, Building, Award, Landmark } from 'lucide-react';

interface DashboardProps {
  msmes: MSME[];
  onSelectMsme: (msme: MSME) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedBand: string;
  setSelectedBand: (band: string) => void;
}

export default function Dashboard({
  msmes,
  onSelectMsme,
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  selectedBand,
  setSelectedBand,
}: DashboardProps) {
  
  // Calculate Statistics dynamically
  const stats = useMemo(() => {
    if (msmes.length === 0) return {
      avgScore: 0,
      totalCount: 0,
      delinquentCount: 0,
      avgGstCompliance: 0,
      avgCashFlow: 0,
      bandCounts: { Excellent: 0, Good: 0, Average: 0, Poor: 0 }
    };

    const totalCount = msmes.length;
    const sumScore = msmes.reduce((sum, m) => sum + m.score.overallScore, 0);
    const avgScore = Math.round(sumScore / totalCount);

    const delinquentCount = msmes.filter(m => m.score.overallScore < 50).length;
    
    const sumGst = msmes.reduce((sum, m) => sum + m.score.subScores.compliance, 0);
    const avgGstCompliance = Math.round(sumGst / totalCount);

    const sumCash = msmes.reduce((sum, m) => sum + m.score.subScores.cashFlow, 0);
    const avgCashFlow = Math.round(sumCash / totalCount);

    const bandCounts = { Excellent: 0, Good: 0, Average: 0, Poor: 0 };
    msmes.forEach(m => {
      bandCounts[m.score.band]++;
    });

    return {
      avgScore,
      totalCount,
      delinquentCount,
      avgGstCompliance,
      avgCashFlow,
      bandCounts
    };
  }, [msmes]);

  // Extract unique sectors
  const sectors = useMemo(() => {
    const list = new Set(msmes.map(m => m.sector));
    return ['All', ...Array.from(list)];
  }, [msmes]);

  // Filter MSMEs
  const filteredMsmes = useMemo(() => {
    return msmes.filter(m => {
      const matchesSearch = 
        m.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.pan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.gstin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSector = selectedSector === 'All' || m.sector === selectedSector;
      const matchesBand = selectedBand === 'All' || m.score.band === selectedBand;

      return matchesSearch && matchesSector && matchesBand;
    });
  }, [msmes, searchQuery, selectedSector, selectedBand]);

  // Color mapper for bands
  const getBandBadgeClass = (band: string) => {
    switch (band) {
      case 'Excellent': return 'bg-success/10 text-success border-success/20';
      case 'Good': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Average': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-danger/10 text-danger border-danger/20';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-success bg-success/10';
    if (score >= 70) return 'text-secondary bg-secondary/10';
    if (score >= 50) return 'text-warning bg-warning/10';
    return 'text-danger bg-danger/10';
  };

  return (
    <div id="portfolio-dashboard" className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" /> IDBI Innovate 2026 — Alternate Credit Risk Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unified assessment panel evaluating New-to-Credit (NTC) & New-to-Bank (NTB) MSMEs via GST Compliance, UPI QR Inflows, and EPFO Payrolls.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-lg border border-border text-xs font-mono text-slate-600">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
          ULI/OCEN DATA PIPELINE: ACTIVE
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total MSMEs */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Onboarded MSMEs</p>
            <h3 className="text-3xl font-bold text-ink">{stats.totalCount}</h3>
            <p className="text-xs text-slate-400">Consent Verified</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-bg flex items-center justify-center border border-border">
            <Building className="h-6 w-6 text-slate-500" />
          </div>
        </div>

        {/* Avg Credit Score */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average Health Score</p>
            <h3 className="text-3xl font-bold text-ink">{stats.avgScore}<span className="text-xs text-slate-400 font-normal">/100</span></h3>
            <p className="text-xs text-success font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Alternate Data Ingestion
            </p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center border border-success/20">
            <Award className="h-6 w-6 text-success" />
          </div>
        </div>

        {/* GST Filing Compliance Index */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Compliance Index</p>
            <h3 className="text-3xl font-bold text-ink">{stats.avgGstCompliance}<span className="text-xs text-slate-400 font-normal">%</span></h3>
            <p className="text-xs text-slate-400">On-time filing consistency</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
            <CheckCircle2 className="h-6 w-6 text-secondary" />
          </div>
        </div>

        {/* Delinquency / Under Audit Alert */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delinquency/Risk Rate</p>
            <h3 className="text-3xl font-bold text-danger">
              {stats.totalCount > 0 ? Math.round((stats.delinquentCount / stats.totalCount) * 100) : 0}
              <span className="text-xs text-danger/70 font-normal">%</span>
            </h3>
            <p className="text-xs text-slate-400">{stats.delinquentCount} MSMEs in Poor score band</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-danger/10 flex items-center justify-center border border-danger/20">
            <ShieldAlert className="h-6 w-6 text-danger" />
          </div>
        </div>
      </div>

      {/* SCORE BAND DISTRIBUTION & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Distribution Visual Graph (Custom SVG/CSS bar graph for 100% control) */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm lg:col-span-8 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-ink mb-4">Portfolio Score Band Distribution</h4>
            <div className="grid grid-cols-4 gap-4 pt-4">
              {(['Excellent', 'Good', 'Average', 'Poor'] as const).map(band => {
                const count = stats.bandCounts[band];
                const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
                let barColor = 'bg-success';
                if (band === 'Good') barColor = 'bg-secondary';
                if (band === 'Average') barColor = 'bg-warning';
                if (band === 'Poor') barColor = 'bg-danger';

                return (
                  <div key={band} className="flex flex-col items-center space-y-2">
                    <div className="w-full bg-bg rounded-lg h-36 flex flex-col justify-end border border-border p-1">
                      <div 
                        className={`w-full ${barColor} rounded-md transition-all duration-1000`} 
                        style={{ height: `${Math.max(4, pct)}%` }}
                        title={`${count} MSMEs (${Math.round(pct)}%)`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-ink">{band}</p>
                      <p className="text-[10px] text-slate-500">{count} MSMEs ({Math.round(pct)}%)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-slate-500">
            <p className="flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              Credit score limits: Excellent (85+), Good (70-84), Average (50-69), Poor (&lt;50).
            </p>
          </div>
        </div>

        {/* Alternate Data Signal Weighting Explainability */}
        <div className="bg-white p-5 rounded-xl border border-border shadow-sm lg:col-span-4 space-y-4">
          <h4 className="text-sm font-semibold text-ink">Scoring Agent Framework Weighting</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Unlike traditional bureau checks (CIBIL), this scoring engine dynamically computes scores across four digital trails:
          </p>
          <div className="space-y-3 pt-2">
            {/* Cash Flow */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">1. Cash Flow Liquidity (UPI/AA)</span>
                <span className="text-ink font-bold">35%</span>
              </div>
              <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
            {/* Compliance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">2. Tax Compliance Discipline (GST)</span>
                <span className="text-ink font-bold">30%</span>
              </div>
              <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            {/* Stability */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">3. Payroll & Business Stability (EPFO)</span>
                <span className="text-ink font-bold">20%</span>
              </div>
              <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                <div className="bg-success h-full rounded-full" style={{ width: '20%' }} />
              </div>
            </div>
            {/* Digital Trust */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">4. Digital Fingerprint Diversity</span>
                <span className="text-ink font-bold">15%</span>
              </div>
              <div className="w-full bg-bg h-2 rounded-full overflow-hidden">
                <div className="bg-warning h-full rounded-full" style={{ width: '15%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & INTERACTIVE MSME LIST SECTION */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        
        {/* Search and Filters Bar */}
        <div className="p-4 border-b border-border bg-bg/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Business Name, PAN, or GSTIN..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-ink placeholder:text-slate-400"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Sector filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> Sector:
              <select
                className="bg-white border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
              >
                {sectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Score Band filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Award className="h-3.5 w-3.5 text-slate-400" /> Band:
              <select
                className="bg-white border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                value={selectedBand}
                onChange={e => setSelectedBand(e.target.value)}
              >
                <option value="All">All Scores</option>
                <option value="Excellent">Excellent (85+)</option>
                <option value="Good">Good (70-84)</option>
                <option value="Average">Average (50-69)</option>
                <option value="Poor">Poor (&lt;50)</option>
              </select>
            </div>
          </div>
        </div>

        {/* MSME List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-bg border-b border-border text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3 px-5">Enterprise Name & IDs</th>
                <th className="py-3 px-5">Sector & Location</th>
                <th className="py-3 px-5">Emp Count</th>
                <th className="py-3 px-5">Est. Monthly Revenue</th>
                <th className="py-3 px-5 text-center">GST Compliance</th>
                <th className="py-3 px-5 text-center">UPI Cash Flow</th>
                <th className="py-3 px-5 text-center">Credit Health Score</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMsmes.length > 0 ? (
                filteredMsmes.map(m => (
                  <tr 
                    key={m.id} 
                    className="hover:bg-bg/40 transition-colors cursor-pointer group"
                    onClick={() => onSelectMsme(m)}
                  >
                    {/* Enterprise Name & IDs */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-ink group-hover:text-primary transition-colors">{m.businessName}</div>
                      <div className="flex gap-2 mt-1 text-xs text-slate-500 font-mono">
                        <span>PAN: {m.pan}</span>
                        <span className="text-slate-300">|</span>
                        <span>GST: {m.gstin}</span>
                      </div>
                    </td>

                    {/* Sector & State */}
                    <td className="py-4 px-5">
                      <div className="text-slate-700 font-medium">{m.sector}</div>
                      <div className="text-xs text-slate-500">{m.state}</div>
                    </td>

                    {/* Employee Count */}
                    <td className="py-4 px-5 text-slate-700">
                      {m.employeeCount > 0 ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                          {m.employeeCount} <span className="text-xs text-slate-400 font-normal">EPFO</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No EPFO Records</span>
                      )}
                    </td>

                    {/* Estimated Monthly Revenue */}
                    <td className="py-4 px-5 font-medium text-slate-750">
                      ₹{m.monthlyRevenue.toLocaleString()}
                    </td>

                    {/* GST Compliance Subscore */}
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-semibold text-ink">{m.score.subScores.compliance}%</span>
                        <div className="w-16 bg-bg h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${m.score.subScores.compliance >= 80 ? 'bg-success' : m.score.subScores.compliance >= 60 ? 'bg-secondary' : m.score.subScores.compliance >= 40 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${m.score.subScores.compliance}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* UPI Cashflow Subscore */}
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-semibold text-ink">{m.score.subScores.cashFlow}%</span>
                        <div className="w-16 bg-bg h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${m.score.subScores.cashFlow >= 80 ? 'bg-success' : m.score.subScores.cashFlow >= 60 ? 'bg-secondary' : m.score.subScores.cashFlow >= 40 ? 'bg-warning' : 'bg-danger'}`} 
                            style={{ width: `${m.score.subScores.cashFlow}%` }} 
                          />
                        </div>
                      </div>
                    </td>

                    {/* Overall Credit Score & Band */}
                    <td className="py-4 px-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${getBandBadgeClass(m.score.band)}`}>
                          {m.score.band}
                        </span>
                        <span className={`text-base font-bold mt-1 px-2 py-0.5 rounded ${getScoreColorClass(m.score.overallScore)}`}>
                          {m.score.overallScore}
                        </span>
                      </div>
                    </td>

                    {/* Select Actions button */}
                    <td className="py-4 px-5 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onSelectMsme(m); }}
                        className="p-1.5 hover:bg-bg rounded-lg text-slate-500 hover:text-primary transition-all inline-flex items-center gap-1 text-xs font-medium"
                      >
                        Evaluate <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-secondary" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="text-slate-400 font-semibold mb-1 text-base">No MSMEs found matching the filter</div>
                    <div className="text-xs text-slate-400">Try adjusting your query or filters above.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footnote bar */}
        <div className="p-4 bg-bg/50 border-t border-border text-xs text-slate-500 flex justify-between items-center">
          <p>Showing {filteredMsmes.length} of {msmes.length} registered MSME enterprises.</p>
          <p className="font-mono text-[10px] text-slate-400">Dossiers secured via 256-bit AA architecture consent protocols</p>
        </div>

      </div>

    </div>
  );
}
