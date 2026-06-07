/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Globe, Shield, Zap, Briefcase, DollarSign, Award, Target } from "lucide-react";
import { motion } from "motion/react";

interface DashboardIntroProps {
  onLoadSamples: () => void;
  hasLeads: boolean;
}

export default function DashboardIntro({ onLoadSamples, hasLeads }: DashboardIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden shadow-sm"
      id="dashboard-intro-card"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 text-xs font-semibold bg-teal-500/10 text-teal-700 rounded-full border border-teal-500/20 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Elite Workspace
            </span>
            <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-600" /> Global Client Acquisition
            </span>
          </div>
          <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight text-slate-900 mb-3 font-display">
            Syed Shahrukh Anwar <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">Lead Conversion Engine</span>
          </h1>
          <p className="text-slate-600 max-w-2xl text-sm leading-relaxed">
            Revolutionize client outreach by running structural digital audits on raw CSV databases. Programmatically score leads, discover digital presence vulnerabilities, and leverage Gemini's intelligence to compose high-octane multi-channel sales copywriting engineered to sell.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <div className="p-1.5 bg-slate-55 border border-slate-200 rounded text-teal-600">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase">Goal</p>
                <p className="font-semibold text-slate-800">Paying Clients</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <div className="p-1.5 bg-slate-55 border border-slate-200 rounded text-indigo-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase">Services</p>
                <p className="font-semibold text-slate-800">Web + SEO + Auto</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <div className="p-1.5 bg-slate-55 border border-slate-200 rounded text-amber-600">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase">Strategy</p>
                <p className="font-semibold text-slate-800">No-Spam Audits</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <div className="p-1.5 bg-slate-55 border border-slate-200 rounded text-pink-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase">Base Rules</p>
                <p className="font-semibold text-slate-800">Personalized Offer</p>
              </div>
            </div>
          </div>
        </div>

        {!hasLeads && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-shrink-0 bg-slate-55 border border-slate-200 p-5 rounded-xl flex flex-col items-center text-center justify-center gap-3 cursor-pointer self-start md:self-auto w-full md:w-60 hover:border-teal-500/40 transition-colors shadow-sm"
            onClick={onLoadSamples}
            id="load-samples-card"
          >
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 border border-teal-200">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No data loaded yet?</p>
              <p className="text-xs text-slate-500 mt-1">Populate 3 premium global business leads for a test run.</p>
            </div>
            <button
              className="mt-2 w-full py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs rounded transition-colors"
              id="load-samples-btn"
            >
              Load Sample Database
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
