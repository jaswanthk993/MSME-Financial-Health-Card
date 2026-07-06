/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MSME, ScoreRecord } from './types';
import Dashboard from './components/Dashboard';
import HealthCard from './components/HealthCard';
import Simulator from './components/Simulator';
import Onboarding from './components/Onboarding';
import AiAnalysis from './components/AiAnalysis';
import { 
  Building2, Users, FileText, QrCode, Sliders, Sparkles, 
  UserPlus, RefreshCw, Landmark, ChevronDown, CheckCircle2 
} from 'lucide-react';

export default function App() {
  
  // App States
  const [msmes, setMsmes] = useState<MSME[]>([]);
  const [selectedMsme, setSelectedMsme] = useState<MSME | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'health' | 'simulator' | 'ai' | 'onboard'>('dashboard');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedBand, setSelectedBand] = useState('All');

  // Load state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);

  // Fetch initial MSMEs on mount
  useEffect(() => {
    const loadMSMEs = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/msmes');
        const data = await res.json();
        setMsmes(data);
        if (data.length > 0) {
          setSelectedMsme(data[0]); // default active selected
        }
      } catch (err) {
        console.error("Failed to fetch initial MSMEs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMSMEs();
  }, []);

  // Near real-time trigger handler
  const handleRefreshAlternateData = async (id: string) => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/msme/${id}/refresh`, { method: 'POST' });
      const data = await res.json();
      
      if (data.refreshed && data.msme) {
        // Update in list
        setMsmes(prev => prev.map(m => m.id === id ? data.msme : m));
        // Update current selected
        setSelectedMsme(data.msme);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // What-if simulator calculations
  const handleSimulateScore = async (id: string, params: {
    gstFilingDelayReduction: number;
    cashFlowGrowth: number;
    employeeGrowth: number;
    digitalInflowRatio: number;
  }) => {
    const res = await fetch(`/api/msme/${id}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data;
  };

  // Onboarding completed handler
  const handleOnboardComplete = (newMsme: MSME) => {
    setMsmes(prev => [newMsme, ...prev]);
    setSelectedMsme(newMsme);
    setActiveTab('health'); // automatically view the health card of newly onboarded MSME
  };

  // Select switch handler
  const handleSwitchMsme = (m: MSME) => {
    setSelectedMsme(m);
    setIsSelectOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 space-y-4">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-border rounded-full" />
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">IDBI Alternative credit Engine booting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row font-sans text-ink">
      
      {/* LEFT NAVIGATION RAIL (SIDEBAR) - HIDDEN ON PRINT */}
      <aside className="w-full md:w-64 bg-ink text-white flex flex-col justify-between p-5 border-r border-border print:hidden shrink-0">
        <div className="space-y-6">
          
          {/* Logo & IDBI Innovative Portal Identity */}
          <div className="flex items-center gap-2.5 border-b border-slate-850 pb-5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider leading-none text-white uppercase">
                IDBI <span className="text-secondary">Innovate</span>
              </h1>
              <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1 block">Credit Health Card</span>
            </div>
          </div>

          {/* ACTIVE MERCHANT SELECTOR DROPDOWN */}
          {selectedMsme && (
            <div className="relative">
              <button 
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="w-full bg-white/10 border border-white/5 hover:bg-white/15 rounded-xl px-3 py-2.5 flex items-center justify-between text-left transition-colors text-xs font-medium"
              >
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-slate-400">Evaluating Enterprise</p>
                  <p className="text-xs font-bold text-white mt-0.5 truncate">{selectedMsme.businessName}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {isSelectOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-ink border border-slate-750 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto z-40 text-xs text-slate-300 divide-y divide-slate-800">
                  {msmes.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleSwitchMsme(m)}
                      className={`w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${m.id === selectedMsme.id ? 'bg-white/10 text-secondary font-semibold' : ''}`}
                    >
                      <span className="truncate">{m.businessName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900">{m.score.overallScore}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NAVIGATION ITEMS */}
          <nav className="space-y-1.5">
            {/* Dashboard tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${activeTab === 'dashboard' ? 'bg-white/10 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Landmark className="h-4.5 w-4.5 text-secondary" />
              🏛️ Portfolio Panel
            </button>

            {/* Health Card View */}
            <button
              onClick={() => setActiveTab('health')}
              className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${activeTab === 'health' ? 'bg-white/10 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <FileText className="h-4.5 w-4.5 text-secondary" />
              📋 Financial Health
            </button>

            {/* What If simulator */}
            <button
              onClick={() => setActiveTab('simulator')}
              className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${activeTab === 'simulator' ? 'bg-white/10 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Sliders className="h-4.5 w-4.5 text-secondary" />
              🧪 Sandbox Simulator
            </button>

            {/* Gemini AI Evaluator */}
            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${activeTab === 'ai' ? 'bg-white/10 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Sparkles className="h-4.5 w-4.5 text-secondary" />
              🤖 Underwrite AI
            </button>

            {/* Onboard Enterprise */}
            <button
              onClick={() => setActiveTab('onboard')}
              className={`w-full py-2.5 px-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all ${activeTab === 'onboard' ? 'bg-white/10 text-white font-bold shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <UserPlus className="h-4.5 w-4.5 text-secondary" />
              ➕ Register MSME
            </button>
          </nav>

        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 pt-4 text-[10px] text-slate-500 font-mono tracking-wider space-y-1">
          <p>© IDBI INNOVATE 2026</p>
          <p>PROBLEM STATEMENT 3</p>
        </div>
      </aside>

      {/* MAIN SCREEN WRAPPER */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        
        {/* TAB 1: PORTFOLIO DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard
            msmes={msmes}
            onSelectMsme={(m) => {
              setSelectedMsme(m);
              setActiveTab('health');
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedSector={selectedSector}
            setSelectedSector={setSelectedSector}
            selectedBand={selectedBand}
            setSelectedBand={setSelectedBand}
          />
        )}

        {/* TAB 2: DETAILED HEALTH CARD VIEW */}
        {activeTab === 'health' && selectedMsme && (
          <HealthCard
            msme={selectedMsme}
            onBack={() => setActiveTab('dashboard')}
            onRefreshData={handleRefreshAlternateData}
            isRefreshing={isRefreshing}
          />
        )}

        {/* TAB 3: SANDBOX SIMULATOR */}
        {activeTab === 'simulator' && selectedMsme && (
          <Simulator
            msme={selectedMsme}
            onSimulate={handleSimulateScore}
          />
        )}

        {/* TAB 4: AI UNDERWRITER REPORT */}
        {activeTab === 'ai' && selectedMsme && (
          <AiAnalysis
            msme={selectedMsme}
          />
        )}

        {/* TAB 5: ONBOARD MSME */}
        {activeTab === 'onboard' && (
          <Onboarding
            onOnboardComplete={handleOnboardComplete}
          />
        )}

      </main>

    </div>
  );
}
