import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, HelpCircle, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onOnboardComplete: (newMsme: any) => void;
}

export default function Onboarding({ onOnboardComplete }: OnboardingProps) {
  
  const [businessName, setBusinessName] = useState('');
  const [pan, setPan] = useState('');
  const [gstin, setGstin] = useState('');
  const [sector, setSector] = useState('Retail');
  const [state, setState] = useState('Maharashtra');
  const [employeeCount, setEmployeeCount] = useState<number>(8);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(600000);
  
  // Consent flags
  const [consentGst, setConsentGst] = useState(true);
  const [consentUpi, setConsentUpi] = useState(true);
  const [consentEpfo, setConsentEpfo] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Form validator
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!businessName.trim()) {
      setError("Business Name is required.");
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase().trim())) {
      setError("Please enter a valid 10-character Indian PAN (e.g., AAAFM1290K).");
      return;
    }

    if (gstin.trim().length !== 15) {
      setError("Please enter a valid 15-character GSTIN.");
      return;
    }

    if (!consentGst || !consentUpi) {
      setError("Alternate credit evaluation requires credit officer consent verification for both GST and Transaction logs.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/msme/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          pan: pan.toUpperCase().trim(),
          gstin: gstin.toUpperCase().trim(),
          sector,
          state,
          employeeCount: consentEpfo ? employeeCount : 0,
          monthlyRevenue,
          consentStatus: {
            gst: consentGst,
            upi: consentUpi,
            epfo: consentEpfo,
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard MSME.");
      }

      setSuccess(true);
      setBusinessName('');
      setPan('');
      setGstin('');
      
      // Notify parent to append MSME and navigate there
      setTimeout(() => {
        onOnboardComplete(data);
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Something went wrong during onboarding.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="msme-onboarding" className="space-y-6">
      
      {/* TITLE */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-success" /> New-to-Bank Enterprise Onboarding Portal
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Initiate near-real-time consent-based pulling of tax records, UPI cash sheets, and EPFO employee rosters for a seamless alternative credit decisioning flow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REGISTRATION FORM (8 columns) */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-border shadow-sm lg:col-span-8 space-y-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Enterprise Ingestion Dossier</h3>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-xs p-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-danger flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success text-xs p-3 rounded-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-success flex-shrink-0 animate-bounce" />
              <span>Enterprise successfully onboarded! Generating dynamic alternate credit score records...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">Registered Enterprise Business Name</label>
              <input
                type="text"
                placeholder="e.g. Vardhaman Textiles, Sai Enterprises"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 bg-white"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                required
              />
            </div>

            {/* PAN */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Permanent Account Number (PAN)</label>
              <input
                type="text"
                maxLength={10}
                placeholder="e.g. AAAFM1290K"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 uppercase bg-white"
                value={pan}
                onChange={e => setPan(e.target.value)}
                required
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">GST Registration Number (GSTIN)</label>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. 24AAAFM1290K1Z9"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 uppercase bg-white"
                value={gstin}
                onChange={e => gstin && setGstin(e.target.value)}
                required
              />
            </div>

            {/* Sector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Industry / Sector</label>
              <select
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 bg-white"
                value={sector}
                onChange={e => setSector(e.target.value)}
              >
                <option value="Retail">Retail & Trade</option>
                <option value="Manufacturing">Manufacturing & Crafts</option>
                <option value="Services">Services & Clinics</option>
                <option value="Agro Processing">Agro Processing & Farming</option>
                <option value="Logistics">Logistics & Transport</option>
                <option value="IT & Services">IT & Digital Solutions</option>
              </select>
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Operating State Location</label>
              <select
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 bg-white"
                value={state}
                onChange={e => setState(e.target.value)}
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Kerala">Kerala</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Delhi">Delhi</option>
              </select>
            </div>

            {/* Approx Monthly Revenue */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Approximate Monthly Revenue (INR)</label>
              <input
                type="number"
                min="50000"
                max="5000000"
                step="50000"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 bg-white"
                value={monthlyRevenue}
                onChange={e => setMonthlyRevenue(Number(e.target.value))}
                required
              />
            </div>

            {/* Employee Count */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">EPFO Enrolled Employees count</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-slate-700 bg-white"
                value={employeeCount}
                onChange={e => setEmployeeCount(Number(e.target.value))}
                disabled={!consentEpfo}
                required
              />
            </div>
          </div>

          {/* CONSENT CHECKBOXES */}
          <div className="bg-bg border border-border p-4 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-success" /> Secure Consent Verification (Account Aggregator protocols)
            </h4>
            
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded accent-primary"
                  checked={consentGst}
                  onChange={e => setConsentGst(e.target.checked)}
                />
                <span>Authorize pulling of GST portal filings GSTR-1 and GSTR-3B trends.</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded accent-primary"
                  checked={consentUpi}
                  onChange={e => setConsentUpi(e.target.checked)}
                />
                <span>Authorize Account Aggregator connection to retrieve consolidated cash flows & UPI QR settlements.</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded accent-primary"
                  checked={consentEpfo}
                  onChange={e => setConsentEpfo(e.target.checked)}
                />
                <span>Authorize EPFO roster connectivity to inspect historical staff payroll payments.</span>
              </label>
            </div>
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-opacity-90 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              {isLoading ? 'Retrieving Alternate Records...' : 'Execute Onboarding Pipeline'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* SIDEBAR TIPS (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-bg border border-border p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400" /> Onboarding Underwriting Guidelines
            </h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              When an enterprise is onboarded, the system initiates simulated API handshakes with Indian alternate registries:
            </p>

            <ul className="space-y-3 text-xs text-slate-600 pl-1">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span><strong>GSTIN:</strong> Checks filings from the last 5 months to construct a historical compliance delay timeline and sales index.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-secondary font-bold">•</span>
                <span><strong>Account Aggregator:</strong> Retrieves the last 30 bank statement records, classifying credits vs debits into customer payments vs expenses.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-success font-bold">•</span>
                <span><strong>EPFO Registry:</strong> Inspects active headcounts to determine payroll compliance regularity.</span>
              </li>
            </ul>

            <div className="bg-success/5 border border-success/15 p-3 rounded-xl text-[11px] text-success leading-relaxed">
              <strong>Instant Assessment:</strong> High turnover consistency combined with on-time GST filing will result in an immediate <strong>Excellent/Good</strong> credit rating.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
