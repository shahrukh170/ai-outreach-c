/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Clock,
  Briefcase,
  User,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Clipboard,
  Calendar,
  Activity,
  Send,
  Building,
  Check,
  Percent,
  ChevronRight,
  Printer
} from "lucide-react";
import { ProcessedLead, LedgerEntry, ActivityLog } from "../types";
import { motion } from "motion/react";

interface OperationsHubProps {
  leads: ProcessedLead[];
  onUpdateOutreachStatus: (leadId: string, status: ProcessedLead['outreachStatus']) => void;
  ledgerEntries: LedgerEntry[];
  onAddLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'date'>) => void;
  onDeleteLedgerEntry: (id: string) => void;
  activityLogs: ActivityLog[];
  onClearActivityLogs: () => void;
}

export default function OperationsHub({
  leads,
  onUpdateOutreachStatus,
  ledgerEntries,
  onAddLedgerEntry,
  onDeleteLedgerEntry,
  activityLogs,
  onClearActivityLogs
}: OperationsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ledger" | "funnel" | "invoice">("ledger");
  
  // State for manual transaction recording
  const [showManualTxModal, setShowManualTxModal] = useState(false);
  const [manualTx, setManualTx] = useState({
    leadName: "",
    service: "Web Development",
    amount: "299",
    status: "paid" as "paid" | "pending",
    type: "one-time" as "one-time" | "recurring",
    paymentMethod: "Payoneer" as "Payoneer" | "Bank Wire" | "Cash / Other"
  });

  // State for invoice generation
  const [selectedInvoiceLeadId, setSelectedInvoiceLeadId] = useState("");
  const [customInvoiceNo, setCustomInvoiceNo] = useState("INV-2026-1002");
  const [isCopiedInvoice, setIsCopiedInvoice] = useState(false);

  // Stats calculation
  const totalPaidRevenue = ledgerEntries
    .filter(e => e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingAccounts = ledgerEntries
    .filter(e => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  // MRR estimation from active recurring packages
  const activeMrr = ledgerEntries
    .filter(e => e.type === "recurring" && e.status === "paid")
    .reduce((sum, e) => sum + e.amount, 0);

  // Conversion rates
  const totalLeadsCount = leads.length;
  const acceptedStatusCount = leads.filter(l => 
    l.outreachStatus === "accepted" || l.outreachStatus === "invoiced" || l.outreachStatus === "paid"
  ).length;
  const conversionRate = totalLeadsCount > 0 
    ? Math.round((acceptedStatusCount / totalLeadsCount) * 100) 
    : 0;

  // Funnel Stage Statistics
  const funnelStages = [
    { key: "prospect", label: "Prospect", desc: "Lead added", color: "bg-slate-400" },
    { key: "cold_sent", label: "Cold Outreach", desc: "Intimacy initiated", color: "bg-indigo-400" },
    { key: "opened", label: "Message Opened", desc: "Read / Audited", color: "bg-amber-400" },
    { key: "replied", label: "Client Replied", desc: "Under negotiating", color: "bg-sky-400" },
    { key: "accepted", label: "Proposal Accepted", desc: "Contract settled", color: "bg-teal-500" },
    { key: "invoiced", label: "Invoice Sent", desc: "Post billing files", color: "bg-orange-400" },
    { key: "paid", label: "Payment Collected", desc: "Receipt verified", color: "bg-emerald-505 bg-emerald-500" }
  ];

  const getStageCount = (stageKey: string) => {
    return leads.filter(l => (l.outreachStatus || "prospect") === stageKey).length;
  };

  const currentInvoiceLead = leads.find(l => l.id === selectedInvoiceLeadId);

  // Record a Manual transaction handler
  const handleManualTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTx.leadName.trim() || !manualTx.amount) return;

    onAddLedgerEntry({
      leadName: manualTx.leadName,
      service: manualTx.service,
      amount: parseFloat(manualTx.amount),
      status: manualTx.status,
      type: manualTx.type,
      paymentMethod: manualTx.paymentMethod
    });

    setShowManualTxModal(false);
    // Reset manual fields
    setManualTx({
      leadName: "",
      service: "Website Development",
      amount: "299",
      status: "paid",
      type: "one-time",
      paymentMethod: "Payoneer"
    });
  };

  const handleUpdateStatusAndPostLedger = (leadId: string, nextStatus: ProcessedLead['outreachStatus']) => {
    onUpdateOutreachStatus(leadId, nextStatus);
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    const servName = targetLead.analysis?.recommendedService || "Professional BD Services";
    const costAmt = targetLead.analysis?.revenueVal || 299;
    const isRecur = targetLead.analysis?.isRecurring || false;

    if (nextStatus === "invoiced") {
      // Auto-post a pending ledger entry
      onAddLedgerEntry({
        leadId,
        leadName: targetLead.raw.BusinessName || "Client Entity",
        service: servName,
        amount: costAmt,
        status: "pending",
        type: isRecur ? "recurring" : "one-time",
        paymentMethod: "Payoneer"
      });
    } else if (nextStatus === "paid") {
      // Look if there's a pending transaction to promote or add paid one
      onAddLedgerEntry({
        leadId,
        leadName: targetLead.raw.BusinessName || "Client Entity",
        service: servName,
        amount: costAmt,
        status: "paid",
        type: isRecur ? "recurring" : "one-time",
        paymentMethod: "Payoneer"
      });
    }
  };

  // Plain-text Copyable Invoice formatter
  const handleCopyInvoiceText = () => {
    if (!currentInvoiceLead) return;
    
    const clientName = currentInvoiceLead.raw.BusinessName || "Valued Client";
    const category = currentInvoiceLead.raw.Category || "SaaS Services";
    const country = currentInvoiceLead.raw.Country || "US";
    const serviceName = currentInvoiceLead.analysis?.recommendedService || "Website Development Package";
    const exactPriceVal = currentInvoiceLead.analysis?.revenueVal || 299;
    const isRecurringPr = currentInvoiceLead.analysis?.isRecurring || false;

    let txt = `====================================================\n`;
    txt += `OFFICIAL BUSINESS PROPOSAL & INVOICE\n`;
    txt += `Invoice ID: ${customInvoiceNo}\n`;
    txt += `Date Released: ${new Date().toLocaleDateString()}\n`;
    txt += `Maturity Term: On Presentation\n`;
    txt += `====================================================\n\n`;
    
    txt += `ISSUED BY:\n`;
    txt += `Syed Shahrukh Anwar\n`;
    txt += `BD Specialist & Fullstack Developer\n`;
    txt += `Email: shahrukh17070@gmail.com\n`;
    txt += `Location: Abbottabad, Pakistan\n\n`;

    txt += `ISSUED TO:\n`;
    txt += `Company: ${clientName}\n`;
    txt += `Category: ${category}\n`;
    txt += `Location: ${country}\n\n`;

    txt += `PROJECT SPECIFICATIONS & SERVICE DETAIL:\n`;
    txt += `----------------------------------------------------\n`;
    txt += `- Business Presence Audit: Completed & Scored (${currentInvoiceLead.score || 0}/100)\n`;
    txt += `- Solution: ${serviceName}\n`;
    txt += `- Scope Details: Custom SEO tags optimization, mobile layout fixes, SSL security configurations.\n\n`;

    txt += `FINANCIAL BREAKDOWN:\n`;
    txt += `----------------------------------------------------\n`;
    txt += `1. Core Deliverables Setup: USD ${exactPriceVal}.00 (${isRecurringPr ? "Monthly Recurring Plan" : "Single Campaign File"})\n`;
    txt += `----------------------------------------------------\n`;
    txt += `TOTAL BILLABLE BALANCE DUE: USD ${exactPriceVal}.00\n\n`;

    txt += `PAYMENT PORTAL CHANNELS:\n`;
    txt += `----------------------------------------------------\n`;
    txt += `A. Payoneer Account Invoice: shahrukh17070@gmail.com\n`;
    txt += `B. Direct Bank Transfer Wire:\n`;
    txt += `   Bank: Meezan Bank Ltd\n`;
    txt += `   Location Outlet: Abbottabad, Pakistan\n`;
    txt += `   Routing Account No: [Available upon requested direct transmission]\n\n`;

    txt += `====================================================\n`;
    txt += `Thank you for choosing Syed Anwar's BD operations.\n`;
    txt += `====================================================\n`;

    navigator.clipboard.writeText(txt);
    setIsCopiedInvoice(true);
    setTimeout(() => setIsCopiedInvoice(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="operations-master-layout">
      {/* Visual Navigation Column Map */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-4">
            Operations Console
          </h3>

          <div className="flex flex-col gap-1.5" id="operations-navbar-items">
            <button
              onClick={() => setActiveSubTab("ledger")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeSubTab === "ledger"
                  ? "bg-teal-50/45 text-teal-700 border border-teal-200/50 shadow-3xs"
                  : "text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> General Ledger Statement
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveSubTab("funnel")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeSubTab === "funnel"
                  ? "bg-teal-50/45 text-teal-700 border border-teal-200/50 shadow-3xs"
                  : "text-slate-605 text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-500 animate-pulse" /> Outreach Funnel & Board
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveSubTab("invoice")}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                activeSubTab === "invoice"
                  ? "bg-teal-50/45 text-teal-700 border border-teal-200/50 shadow-3xs"
                  : "text-slate-605 text-slate-600 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" /> Proposal & Invoice generator
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Live Operational System Activity logger feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex-grow max-h-[480px] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b pb-2 mb-3 border-slate-100 flex-wrap gap-2">
            <h4 className="text-[10px] font-bold uppercase font-mono tracking-widest text-slate-505 text-slate-500">
              Operational Logs ({activityLogs.length})
            </h4>
            {activityLogs.length > 0 && (
              <button
                onClick={onClearActivityLogs}
                className="text-[9.5px] text-slate-400 hover:text-rose-600 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="overflow-y-auto space-y-2 flex-grow pr-1" id="system-audit-activity-logs">
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-[11px] text-slate-450 italic">
                Logs list empty. Complete steps in workspace to fill telemetry!
              </div>
            ) : (
              activityLogs.map(log => (
                <div key={log.id} className="text-[10.5px] border-b border-slate-100/50 pb-2 bg-slate-50/30 p-2 rounded-lg">
                  <div className="flex items-center justify-between text-slate-400 font-mono text-[9px] mb-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="uppercase font-semibold tracking-wider text-[8px] bg-slate-150 px-1 py-0.5 rounded text-slate-600">
                      {log.type}
                    </span>
                  </div>
                  <p className="font-medium text-slate-700 leading-snug">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="lg:col-span-9" id="operations-detail-viewer">
        {activeSubTab === "ledger" && (
          <div className="space-y-6 animate-fade-in" id="ledger-pane">
            {/* High-precision balances row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Billings Collected */}
              <div className="bg-white border border-slate-201 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-mono tracking-wider">Payments Collected</p>
                  <p className="text-xl font-bold font-mono text-emerald-650 text-emerald-600 mt-1">USD {totalPaidRevenue.toLocaleString()}</p>
                </div>
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Accounts Receivable */}
              <div className="bg-white border border-slate-201 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-mono tracking-wider">Outbox Receivables</p>
                  <p className="text-xl font-bold font-mono text-orange-655 text-orange-600 mt-1">USD {totalPendingAccounts.toLocaleString()}</p>
                </div>
                <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center border border-orange-200">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* Active MRR */}
              <div className="bg-white border border-slate-201 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-mono tracking-wider">Active MRR Base</p>
                  <p className="text-xl font-bold font-mono text-indigo-650 text-indigo-650 mt-1">USD {activeMrr.toLocaleString()}/mo</p>
                </div>
                <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              {/* Net Profit Margin Margin */}
              <div className="bg-white border border-slate-201 border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-slate-500 uppercase text-[9px] font-mono tracking-wider">Outreach Conversion</p>
                  <p className="text-xl font-bold font-mono text-slate-900 mt-1">{conversionRate}%</p>
                </div>
                <div className="w-9 h-9 bg-slate-50 text-slate-500 rounded-lg flex items-center justify-center border border-slate-200 animate-pulse">
                  <Percent className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            {/* General Ledger Balances Statement Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">General Ledger Accounts</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Dual-entry transaction sheets recorded dynamically from outreach conversions.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManualTxModal(true)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
                    id="record-manual-tx-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Outlay / Expense</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase font-mono border-b border-slate-200/80">
                    <tr>
                      <th className="px-5 py-3.5">Posting Date</th>
                      <th className="px-4 py-3.5">Client Entity / Memo</th>
                      <th className="px-4 py-3.5">Service Sector</th>
                      <th className="px-4 py-3.5 text-right">Debit / Credit Value</th>
                      <th className="px-4 py-3.5">Terms</th>
                      <th className="px-4 py-3.5">Route</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-16 text-slate-455 text-slate-500 italic">
                          Balance sheet contains zero compiled statements. Complete a conversion outreach status to post invoices automatically!
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50/40">
                          <td className="px-5 py-3.5 text-slate-450 font-mono text-[10.5px]">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {entry.leadName}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-500">
                            {entry.service}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                            USD {entry.amount}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono uppercase ${
                              entry.type === 'recurring' 
                                ? "bg-indigo-50 border border-indigo-150 text-indigo-700"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-450 text-[10.5px] font-mono">
                            {entry.paymentMethod}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1 w-max ${
                              entry.status === 'paid'
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-250 animate-pulse"
                                : "bg-orange-50 text-orange-800 border border-orange-200"
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${entry.status === 'paid' ? "bg-emerald-700" : "bg-orange-700"}`} />
                              {entry.status === 'paid' ? "Paid" : "Pending invoice"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => onDeleteLedgerEntry(entry.id)}
                              className="p-1 hover:text-rose-600 text-slate-400 rounded cursor-pointer transition-colors"
                              title="Void Transaction Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "funnel" && (
          <div className="space-y-6 animate-fade-in" id="funnel-pane">
            {/* Visual Funnel Stack chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-3xs">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Outreach & Communications Funnel</h3>
              <p className="text-xs text-slate-550 leading-relaxed mb-6">
                Direct visual layout tracing read statuses, client responses, and accepted propositions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-3" id="visual-funnel-grid">
                {funnelStages.map((stage, idx) => {
                  const count = getStageCount(stage.key);
                  const total = leads.length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={stage.key} className="bg-slate-50 border border-slate-201 border-slate-200 rounded-xl p-3 flex flex-col justify-between items-center text-center relative group shadow-3xs">
                      <div>
                        {/* Connecting Arrow */}
                        {idx < 6 && (
                          <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 bg-white border border-slate-205 rounded-full p-0.5 z-10">
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        <span className={`w-3.5 h-3.5 rounded-full ${stage.color} block mx-auto mb-2 shadow-2xs`} />
                        <p className="font-extrabold text-[11px] text-slate-900 tracking-tight leading-tight">{stage.label}</p>
                        <p className="text-[9px] text-slate-450 mt-0.5 truncate leading-none">{stage.desc}</p>
                      </div>

                      <div className="mt-4 w-full">
                        <p className="text-md font-black text-slate-900 font-mono leading-none">{count} leads</p>
                        <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden flex">
                          <div className={`h-full ${stage.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9.5px] text-slate-450 mt-1 block font-mono">
                          {pct}% weight
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage Transition Control Board */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
              <h3 className="text-sm font-bold text-slate-900">Outreach Stage Board Controller</h3>
              <p className="text-xs text-slate-550 mt-1 leading-relaxed">
                Manually transition prospects through customer acquisition events. Moving a lead to <strong>Invoice Raised</strong> or <strong>Payment Collected</strong> instantly updates the General Ledger ledger accounts dynamically!
              </p>

              <div className="mt-5 space-y-3 max-h-[460px] overflow-y-auto pr-1" id="lead-status-list-grid">
                {leads.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 italic">
                    Propositions list empty. Load sample database or upload scrapers files to configure outreach statuses.
                  </div>
                ) : (
                  leads.map(lead => {
                    const currentStatus = lead.outreachStatus || "prospect";
                    
                    return (
                      <div key={lead.id} className="bg-slate-50/70 border border-slate-205 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
                            {lead.raw.BusinessName?.substring(0, 1) || "L"}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 leading-tight">{lead.raw.BusinessName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9.5px] text-slate-450 font-mono">
                                Type: {lead.raw.Category || "SaaS prospect"}
                              </span>
                              <span className="text-slate-300">|</span>
                              <span className="text-[9.5px] text-[10px] font-mono text-indigo-700 font-bold">
                                Recommended Plan: {lead.analysis?.expectedRevenue || "USD 299"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Dropdown status modifier */}
                        <div className="flex items-center gap-3">
                          <label className="text-[10px] uppercase font-mono text-slate-500 whitespace-nowrap">Relationship Stage:</label>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateStatusAndPostLedger(lead.id, e.target.value as any)}
                            className="bg-white border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-700 cursor-pointer"
                          >
                            <option value="prospect">🎯 Dynamic Prospect</option>
                            <option value="cold_sent">📧 Cold Email Sent</option>
                            <option value="opened">👀 Email Opened</option>
                            <option value="replied">💬 Client Replied</option>
                            <option value="accepted">🤝 Proposal Accepted</option>
                            <option value="invoiced">📄 Invoice Raised</option>
                            <option value="paid">💰 Payment Collected</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "invoice" && (
          <div className="space-y-6 animate-fade-in" id="invoice-pane">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
              <h3 className="text-sm font-bold text-slate-900">Custom Invoice Document Creator</h3>
              <p className="text-xs text-slate-550 mt-1 leading-relaxed">
                Render polished visual estimates and formal invoice documents using Syed Anwar's local Abbottabad Meezan Bank transfer codes and Payoneer email placeholders directly.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4" id="invoice-builder-fields">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Target Billable Client:</label>
                  <select
                    value={selectedInvoiceLeadId}
                    onChange={(e) => setSelectedInvoiceLeadId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="">[ Choose an Audited Client ]</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.raw.BusinessName} ({l.analysis?.expectedRevenue || "Estimate Pending"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Document Invoice Reference No:</label>
                  <input
                    type="text"
                    value={customInvoiceNo}
                    onChange={(e) => setCustomInvoiceNo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-505"
                  />
                </div>
              </div>
            </div>

            {currentInvoiceLead ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative" id="official-printed-invoice-paper">
                {/* Print Emitter watermark */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={handleCopyInvoiceText}
                    className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-650 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    id="copy-invoice-text-trigger"
                  >
                    {isCopiedInvoice ? (
                      <>
                        <Check className="w-4 h-4 text-teal-600 animate-bounce" />
                        <span className="text-teal-700 font-bold">Invoice Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4" />
                        <span>Copy Invoice Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                    id="print-invoice-action"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print PDF</span>
                  </button>
                </div>

                {/* Sender Branding Header */}
                <div className="flex flex-col sm:flex-row justify-between border-b pb-6 border-slate-100" id="invoice-sender">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-teal-50 border-2 border-teal-600 text-teal-650 font-black text-xs rounded-lg flex items-center justify-center">S</div>
                      <span className="font-extrabold text-slate-900 tracking-tight">Syed Shahrukh Anwar</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 whitespace-pre-line leading-relaxed font-semibold">
                      Consultant, Developer & Growth Hacker<br/>
                      Abbottabad, Pakistan<br/>
                      shahrukh17070@gmail.com
                    </p>
                  </div>

                  <div className="text-slate-500 text-right sm:text-right mt-4 sm:mt-0 font-mono text-[11px]" id="invoice-metadata">
                    <p className="font-bold text-slate-900 text-sm">PROPOSAL INVOICE</p>
                    <p className="mt-1">Date: <span className="text-slate-800 font-bold">{new Date().toLocaleDateString()}</span></p>
                    <p>Reference: <span className="text-slate-800 font-bold">{customInvoiceNo}</span></p>
                    <p>Terms: Due on Presentation</p>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100" id="invoice-bill-to">
                  <div>
                    <span className="text-[10px] font-bold font-mono uppercase text-slate-400">Billable Target entity</span>
                    <h5 className="font-extrabold text-slate-850 text-slate-900 mt-1">{currentInvoiceLead.raw.BusinessName}</h5>
                    <p className="text-[11px] text-slate-505 text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
                      Niche sector: {currentInvoiceLead.raw.Category || "Local Store"}<br/>
                      Location: {currentInvoiceLead.raw.City || "City Branch"}, {currentInvoiceLead.raw.Country || "US"}<br/>
                      Website: {currentInvoiceLead.raw.Website || "Offline Entity"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-205">
                    <span className="text-[10px] font-bold font-mono uppercase text-slate-450 text-slate-500">Core BD Audit Results</span>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-[10.5px]">
                      <div>
                        <p className="text-slate-400">CRM Audit Score:</p>
                        <p className="font-bold text-slate-800 font-mono text-sm">{currentInvoiceLead.score || 0}/100</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Vulnerabilities:</p>
                        <p className="font-bold text-slate-800 text-sm">{currentInvoiceLead.analysis?.problemsFound?.length || 0} gaps</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Statement */}
                <div className="py-6" id="invoice-bill-items-table">
                  <table className="w-full text-xs text-left text-slate-650">
                    <thead className="text-[10px] text-slate-450 uppercase font-mono text-slate-550 border-b border-slate-150">
                      <tr>
                        <th className="py-2.5">Service Specifications Outlined</th>
                        <th className="py-2.5 text-center">Billing Type</th>
                        <th className="py-2.5 text-right">Sum Amount (USD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr>
                        <td className="py-4">
                          <p className="font-bold text-slate-900">{currentInvoiceLead.analysis?.recommendedService || "Professional Website Auditing Services"}</p>
                          <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed max-w-lg">
                            Correction of SSL certificate validation gaps, loading performance acceleration, SEO search meta setup, and mobile-friendly layouts. Includes 9-channel copywriting sequence drafting completed.
                          </p>
                        </td>
                        <td className="py-4 text-center font-mono uppercase bg-slate-50/20">
                          {currentInvoiceLead.analysis?.isRecurring ? "Recurring Plan" : "One-Time Project"}
                        </td>
                        <td className="py-4 text-right font-mono font-bold text-slate-905 text-slate-900">
                          ${currentInvoiceLead.analysis?.revenueVal || 299}.00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Invoicing Totals Box */}
                <div className="border-t border-slate-200 py-4 flex justify-end flex-wrap" id="invoice-bill-totals">
                  <div className="w-full sm:w-64 text-right text-xs space-y-1.5 font-sans font-medium">
                    <div className="flex justify-between text-slate-500">
                      <span>Service Net Value:</span>
                      <span className="font-mono text-slate-800 font-bold">${currentInvoiceLead.analysis?.revenueVal || 299}.00</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Audit & Outbound setup (Syllabus Promo):</span>
                      <span className="font-mono text-emerald-600 font-bold">-$00.00</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-205 pt-2 text-sm font-bold text-slate-900">
                      <span>Total Invoice Due (USD):</span>
                      <span className="font-mono text-emerald-700 font-bold">${currentInvoiceLead.analysis?.revenueVal || 299}.00</span>
                    </div>
                  </div>
                </div>

                {/* Wire Bank Account code instructions */}
                <div className="bg-slate-50 rounded-xl border border-slate-150 p-4 mt-8" id="invoice-bill-wire-instructions">
                  <h6 className="text-[10px] uppercase font-bold font-mono tracking-wider text-slate-600 mb-2">
                    Authorized Remittance Channels (Receivables portal)
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10.5px] text-slate-655 font-medium leading-relaxed">
                    <div>
                      <p className="font-semibold text-slate-800">1. Instant digital Payoneer (Credit Card/Account):</p>
                      <p className="font-bold text-teal-700 font-mono mt-0.5">shahrukh17070@gmail.com</p>
                      <p className="text-[10px] text-slate-450 mt-1">Accepts USD, EUR, GBP, and credit cards securely.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">2. Alternative International bank Wire Transfer:</p>
                      <p className="font-mono text-slate-700 mt-0.5 mt-1 font-semibold">Meezan Bank Ltd, Abbottabad Outlets, Pakistan</p>
                      <p className="text-[10px] text-slate-450 mt-1">Contact Syed Anwar directly at <code className="bg-slate-100 font-bold">shahrukh17070@gmail.com</code> for transit codes details.</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl py-24 px-6 text-center text-slate-500 text-xs font-semibold shadow-3xs">
                Select an audited client on the dropdown above to auto-compile a PDF-printable commercial proposal invoice!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Transaction Outlay Dialog */}
      {showManualTxModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="record-manual-tx-overlay">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-md font-extrabold text-slate-900 mb-1">Record Financial Outlay</h3>
            <p className="text-xs text-slate-550 mb-5 font-medium">
              Record manual hosting, subscriptions, client payments, or other outbound transaction lines.
            </p>

            <form onSubmit={handleManualTxSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Client Entity or Description Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Hosting / Server fees"
                  value={manualTx.leadName}
                  onChange={(e) => setManualTx({ ...manualTx, leadName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Service Sector</label>
                  <select
                    value={manualTx.service}
                    onChange={(e) => setManualTx({ ...manualTx, service: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-700 font-semibold focus:outline-none focus:border-teal-500"
                  >
                    <option value="Website Development">Website Development</option>
                    <option value="SEO Services">SEO Services</option>
                    <option value="Social Media Management">Social Media</option>
                    <option value="AI Automation">AI Automation</option>
                    <option value="Hosting Outlay / Expense">Hosting Outlay / Expense</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-505 text-slate-500 font-mono uppercase block mb-1 font-bold">Sum Amount (USD) *</label>
                  <input
                    type="number"
                    required
                    value={manualTx.amount}
                    onChange={(e) => setManualTx({ ...manualTx, amount: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-teal-505"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Status</label>
                  <select
                    value={manualTx.status}
                    onChange={(e) => setManualTx({ ...manualTx, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-teal-505"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Invoice Cycle</label>
                  <select
                    value={manualTx.type}
                    onChange={(e) => setManualTx({ ...manualTx, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-teal-505"
                  >
                    <option value="one-time">One-Time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold font-semibold">Payment Route</label>
                  <select
                    value={manualTx.paymentMethod}
                    onChange={(e) => setManualTx({ ...manualTx, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-705 font-semibold focus:outline-none focus:border-teal-505"
                  >
                    <option value="Payoneer">Payoneer</option>
                    <option value="Bank Wire">Bank Wire</option>
                    <option value="Cash / Other">Cash Cash / Out</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-150 flex justify-end gap-3 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowManualTxModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer shadow-xs font-bold"
                >
                  Save Outlay Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
