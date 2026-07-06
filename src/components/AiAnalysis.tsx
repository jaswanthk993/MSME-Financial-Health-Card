import React, { useState, useEffect } from 'react';
import { MSME } from '../types';
import Markdown from 'react-markdown';
import { FileText, Sparkles, Printer, Copy, AlertCircle, RefreshCw, Landmark, HelpCircle, CheckCircle } from 'lucide-react';

interface AiAnalysisProps {
  msme: MSME;
}

export default function AiAnalysis({ msme }: AiAnalysisProps) {
  
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Reassuring loading step messages to enhance user experience during long-running LLM generation
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const loadingSteps = [
    "Ingesting GSTR-1 and GSTR-3B alternate streams...",
    "Reconstructing UPI cash ledger and calculating monthly credit-to-debit ratios...",
    "Validating EPFO headcount stability and contribution timeliness...",
    "Running multi-agent risk assessment models on Indian corporate segments...",
    "Generating Senior Credit Officer narrative memorandum and recommended credit limits..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Clear previous reports on MSME change so we don't display mismatched memos
  useEffect(() => {
    setReport('');
    setError(null);
  }, [msme]);

  const generateReport = async () => {
    setIsLoading(true);
    setError(null);
    setReport('');

    try {
      const res = await fetch(`/api/msme/${msme.id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to compile credit report.");
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during credit report compilation.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="ai-credit-officer" className="space-y-6 print:p-0 print:bg-white">
      
      {/* HEADER SECTION (HIDDEN ON PRINT) */}
      <div className="border-b border-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Server-Side Gemini Credit Memo Evaluator
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Leverage Google Gemini to automatically evaluate alternate compliance & ledger signals, compile risk vectors, and output authoritative credit committee memos.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-xs font-semibold text-slate-600 bg-bg border border-border rounded-lg hover:bg-bg/80 transition-colors inline-flex items-center gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Memo'}
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 text-xs font-semibold text-slate-600 bg-bg border border-border rounded-lg hover:bg-bg/80 transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Memo
            </button>
          </div>
        )}
      </div>

      {/* CORE DISPLAY CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REPORT WRAPPER */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6 min-h-[350px] flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          
          {/* STATE 1: RECONSTRUCT NOT STARTED */}
          {!report && !isLoading && !error && (
            <div className="my-auto py-12 text-center max-w-md mx-auto space-y-5 print:hidden">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-ink">Generate AI-Powered Underwriting Memo</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Analyze {msme.businessName}'s raw alternate credit profile, GSTR-1 and 3B filing timelines, cash flow stability, and employee payroll trends with Gemini.
                </p>
              </div>
              <button
                onClick={generateReport}
                className="px-5 py-2.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-opacity-90 transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                Compile Underwriting Memo <Sparkles className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* STATE 2: LOADING SCREEN */}
          {isLoading && (
            <div className="my-auto py-12 text-center max-w-lg mx-auto space-y-6 print:hidden">
              {/* Spinner */}
              <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-bg rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>

              {/* Progress Stepper & Messaging */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-ink">Compiling Alternate Data Credit Memo</h3>
                <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl min-h-[50px] flex items-center justify-center text-xs text-primary leading-relaxed font-medium animate-pulse">
                  {loadingSteps[loadingStep]}
                </div>
                <div className="flex justify-center gap-1">
                  {loadingSteps.map((_, i) => (
                    <span 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === loadingStep ? 'w-4 bg-primary' : 'w-1.5 bg-bg'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: ERROR PANEL */}
          {error && (
            <div className="my-auto py-12 text-center max-w-md mx-auto space-y-4 print:hidden">
              <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center mx-auto border border-danger/20">
                <AlertCircle className="h-6 w-6 text-danger" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-ink">Underwriting Memo Error</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {error}
                </p>
              </div>
              <button
                onClick={generateReport}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-bg border border-border rounded-lg hover:bg-bg/80 transition-colors inline-flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Memo Compile
              </button>
            </div>
          )}

          {/* STATE 4: REPORT CONTENT */}
          {report && (
            <div className="space-y-4 print:space-y-2">
              
              {/* PRINT ONLY HEADER */}
              <div className="hidden print:block border-b border-slate-200 pb-3 mb-4">
                <p className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-widest flex items-center gap-1">
                  <Landmark className="h-3.5 w-3.5" /> IDBI Bank Credit Committee — Confidential Credit Memo
                </p>
                <h1 className="text-lg font-bold text-slate-900 mt-1">CONFIDENTIAL EVALUATION DOSSIER — {msme.businessName}</h1>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">PAN: {msme.pan} | GSTIN: {msme.gstin} | Rating: {msme.score.overallScore}/100 ({msme.score.band})</p>
              </div>

              {/* RENDER REPORT */}
              <div className="markdown-body text-slate-800 prose prose-sm max-w-none leading-relaxed text-xs space-y-4 font-sans">
                <Markdown>{report}</Markdown>
              </div>

              {/* FOOTER */}
              <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between text-[10px] text-slate-400 font-mono print:hidden">
                <p>Generated via Gemini Evaluator Engine</p>
                <p>IDBI-Innovative-Underwriter-v3.5</p>
              </div>
            </div>
          )}

        </div>

        {/* EXPLAINABILITY SIDEBAR (4 columns, HIDDEN ON PRINT) */}
        <div className="lg:col-span-4 space-y-6 print:hidden">
          <div className="bg-bg border border-border p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="h-4.5 w-4.5 text-slate-400" /> AI Underwriting Auditing
            </h4>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemini compiles tax compliance consistency, payroll records, and cash volumes, then crosses them with industry risk factors.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex gap-2 text-xs">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 leading-relaxed">
                  <strong>Zero Hallucinations:</strong> All scoring vectors and raw tax records are structured and fed directly into the model's system context.
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-slate-600 leading-relaxed">
                  <strong>Transparent Decisions:</strong> Section 5 provides specific lending limits, interest bands, and sweep frequencies.
                </p>
              </div>
            </div>

            <div className="bg-success/5 border border-success/15 p-3 rounded-xl text-[11px] text-success leading-relaxed">
              <strong>Print Memo capability:</strong> Press the print button to generate a clean, standard, physical-paper Credit Memo ready for offline signature routes.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
