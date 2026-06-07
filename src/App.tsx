/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Database,
  Mail,
  Phone,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Globe,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Settings,
  DollarSign,
  Calendar,
  MessageSquare,
  ArrowUpRight,
  RefreshCw,
  Layers,
  MapPin,
  Search,
  Filter,
  Plus,
  Share2,
  AlertTriangle,
  Info,
  Clock,
  User,
  Activity,
  FileSpreadsheet,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LeadRaw, LeadAnalysis, ProcessedLead, UserConfig } from "./types";
import {
  DEFAULT_USER_CONFIG,
  parseCSV,
  computeLeadScore,
  extractInitialFlags,
  generateCSVExportString
} from "./utils";
import DashboardIntro from "./components/DashboardIntro";
import B2BLeadImporter from "./components/B2BLeadImporter";
import OperationsHub from "./components/OperationsHub";
import { LedgerEntry, ActivityLog } from "./types";
import { TrendingUp, FileText, Percent } from "lucide-react";

export default function App() {
  // Authentication State
  const [adminUser, setAdminUser] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");

  // Application State
  const [leads, setLeads] = useState<ProcessedLead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [activeOutreachTab, setActiveOutreachTab] = useState<string>("coldEmail");
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  
  // Workspace Tab State
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"crm" | "importer" | "operations">("crm");

  // General Ledger and Activity Records
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // UI Panels
  const [showConfigPanel, setShowConfigPanel] = useState<boolean>(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState<boolean>(false);
  const [isDraggingCSV, setIsDraggingCSV] = useState<boolean>(false);
  const [isVerifyingEnv, setIsVerifyingEnv] = useState<boolean>(true);
  const [isEnvConfigured, setIsEnvConfigured] = useState<boolean>(false);
  
  // Active editing of outreach messages
  const [isEditingOutreach, setIsEditingOutreach] = useState<boolean>(false);
  const [editedOutreachTexts, setEditedOutreachTexts] = useState<Record<string, string>>({});

  // Input forms state
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [newLeadInput, setNewLeadInput] = useState<Partial<LeadRaw>>({
    BusinessName: "",
    Category: "",
    Country: "United States",
    City: "",
    Website: "",
    OwnerName: "",
    Email: "",
    Phone: "",
    WhatsApp: "",
    FacebookURL: "",
    InstagramURL: "",
    LinkedInURL: "",
    YouTubeURL: "",
    GoogleMapsURL: "",
    Reviews: "0",
    Rating: "5.0",
    Notes: ""
  });

  // Reference for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load configuration from localStorage on mount
  useEffect(() => {
    // Check saved administrator login session
    const savedAdmin = localStorage.getItem("syed_admin_email");
    if (savedAdmin && (savedAdmin === "anwar17070@gmail.com" || savedAdmin === "shahrukh17070@gmail.com")) {
      setAdminUser(savedAdmin);
    }

    const savedConfig = localStorage.getItem("syed_bd_config");
    if (savedConfig) {
      try {
        setUserConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }

    const savedLeads = localStorage.getItem("syed_leads");
    if (savedLeads) {
      try {
        setLeads(JSON.parse(savedLeads));
      } catch (e) {
        console.error("Failed to parse saved leads", e);
      }
    }

    // Load ledger entries
    const savedLedger = localStorage.getItem("syed_ledger");
    if (savedLedger) {
      try {
        setLedgerEntries(JSON.parse(savedLedger));
      } catch (e) {
        console.error("Failed to parse saved ledger", e);
      }
    } else {
      const initialLedger: LedgerEntry[] = [
        {
          id: "tx-init-1",
          leadName: "Greenfield Dental Care",
          service: "Professional Website + Responsive Layout Reconstruction",
          amount: 500,
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          status: "paid",
          type: "one-time",
          paymentMethod: "Payoneer"
        },
        {
          id: "tx-init-2",
          leadName: "Metro Dry Cleaners",
          service: "SEO Search Optimization Package & Title Tag Rectification",
          amount: 299,
          date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          status: "pending",
          type: "recurring",
          paymentMethod: "Payoneer"
        }
      ];
      setLedgerEntries(initialLedger);
      localStorage.setItem("syed_ledger", JSON.stringify(initialLedger));
    }

    // Load activity logs
    const savedLogs = localStorage.getItem("syed_logs");
    if (savedLogs) {
      try {
        setActivityLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed to parse saved logs", e);
      }
    } else {
      const initialLogs: ActivityLog[] = [
        {
          id: "log-init-1",
          message: "CRM Lead acquired: Syed's BD Engine initiated gracefully.",
          timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
          type: "system"
        },
        {
          id: "log-init-2",
          message: "Preloaded sample databases of 3 international clinics and cafes correctly.",
          timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          type: "system"
        }
      ];
      setActivityLogs(initialLogs);
      localStorage.setItem("syed_logs", JSON.stringify(initialLogs));
    }

    // Verify Backend Environment Status
    fetch("/api/env-check")
      .then(res => res.json())
      .then(data => {
        setIsEnvConfigured(data.geminiApiKeyConfigured);
        setIsVerifyingEnv(false);
      })
      .catch(err => {
        console.error("Failed to check environment check", err);
        setIsVerifyingEnv(false);
      });
  }, []);

  // Admin login submission handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = loginEmail.trim().toLowerCase();
    
    if (targetEmail === "anwar17070@gmail.com" || targetEmail === "shahrukh17070@gmail.com") {
      setAdminUser(targetEmail);
      localStorage.setItem("syed_admin_email", targetEmail);
      setLoginError("");
      addActivityLog(`Security Authentication Success - Logged in as: ${targetEmail}`, "system");
    } else {
      setLoginError("Access Denied: Only anwar17070@gmail.com and shahrukh17070@gmail.com are authorized to access this system.");
    }
  };

  // Sign out handler
  const handleSignOut = () => {
    addActivityLog(`Security Session Closed - Logged out`, "system");
    setAdminUser(null);
    localStorage.removeItem("syed_admin_email");
    setLoginEmail("");
    setLoginPassword("");
  };

  // Save Config to local storage when changed
  const handleSaveConfig = (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    localStorage.setItem("syed_bd_config", JSON.stringify(newConfig));
    setShowConfigPanel(false);
    addActivityLog("Updated Outreach Config Details & Pricing guidelines.", "system");
  };

  // Helper to persist leads
  const persistLeads = (updatedLeads: ProcessedLead[]) => {
    setLeads(updatedLeads);
    localStorage.setItem("syed_leads", JSON.stringify(updatedLeads));
  };

  // Helper to persist Ledger and Activity Logs
  const persistLedger = (updatedLedger: LedgerEntry[]) => {
    setLedgerEntries(updatedLedger);
    localStorage.setItem("syed_ledger", JSON.stringify(updatedLedger));
  };

  const persistLogs = (updatedLogs: ActivityLog[]) => {
    setActivityLogs(updatedLogs);
    localStorage.setItem("syed_logs", JSON.stringify(updatedLogs));
  };

  const addActivityLog = (message: string, type: ActivityLog['type'] = 'system') => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      message,
      timestamp: new Date().toISOString(),
      type
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem("syed_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddLedgerEntry = (entry: Omit<LedgerEntry, 'id' | 'date'>) => {
    const newEntry: LedgerEntry = {
      ...entry,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: new Date().toISOString()
    };
    const updated = [newEntry, ...ledgerEntries];
    persistLedger(updated);
    addActivityLog(`Recorded ledger item: "${entry.leadName}" - ${entry.service} for $${entry.amount}`, 'ledger');
  };

  const handleDeleteLedgerEntry = (id: string) => {
    const updated = ledgerEntries.filter(e => e.id !== id);
    persistLedger(updated);
    addActivityLog(`Voided ledger transaction ID: ${id}`, 'ledger');
  };

  const handleClearLogs = () => {
    persistLogs([]);
  };

  const handleImportLeadsFromB2B = (newLeads: ProcessedLead[]) => {
    const merged = [...newLeads, ...leads];
    persistLeads(merged);
    setActiveWorkspaceTab("crm");
  };

  const handleUpdateOutreachStatusInCRM = (leadId: string, status: ProcessedLead['outreachStatus'] = 'prospect') => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        addActivityLog(`Transitioned outreach status of "${l.raw.BusinessName}" to: ${status.toUpperCase()}`, 'outreach');
        return {
          ...l,
          outreachStatus: status,
          outreachStatusChangedAt: new Date().toISOString()
        };
      }
      return l;
    });
    persistLeads(updated);
  };

  // Populate dynamic pre-baked premium business leads
  const handleLoadSamples = () => {
    const sampleRaws: LeadRaw[] = [
      {
        id: "sample-dental",
        BusinessName: "Greenfield Dental Care",
        Category: "Dentistry & Orthodontics",
        Country: "United States",
        City: "Chicago",
        Website: "http://greenfielddentalchi.com",
        Reviews: "142",
        Rating: "4.2",
        Notes: "Website design looks extremely old-fashioned compared to competitors, images aren't loading correctly, says 'Copyright 2018'. They have a second clinic listed in Peoria. Reviews: 142 total on Google."
      },
      {
        id: "sample-woodoven",
        BusinessName: "The Artisan Wood Oven",
        Category: "Restaurant & Bakery",
        Country: "Canada",
        City: "Toronto",
        Website: "",
        FacebookURL: "https://facebook.com/artisanwoodoven",
        InstagramURL: "https://instagram.com/artisanwoodoven",
        Reviews: "235",
        Rating: "4.8",
        Notes: "Highly popular local sourdough and artisan pizza place. Incredible reviews, very active Instagram with 5,000+ followers, but they have no website to take direct bookings or orders. Customers complain about having to call them."
      },
      {
        id: "sample-cleaners",
        BusinessName: "Metro Dry Cleaners",
        Category: "Dry Cleaning & Laundry",
        Country: "United Kingdom",
        City: "London",
        Website: "https://metrolaundryclean.co.uk",
        Reviews: "32",
        Rating: "3.5",
        Notes: "Website is unresponsive on mobile devices - text overflows the borders. Facebook link is broken (404 page). No updates on social media since October 2022."
      }
    ];

    const processed = sampleRaws.map(raw => {
      const flags = extractInitialFlags(raw);
      const { score, priority } = computeLeadScore(flags);
      return {
        id: raw.id,
        raw,
        status: "pending" as const,
        score,
        priority
      };
    });

    persistLeads(processed);
    if (processed.length > 0) {
      setSelectedLeadId(processed[0].id);
    }
  };

  // Parse CSV text and append to state
  const handleCSVTextToLeads = (text: string) => {
    try {
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        alert("Failed to parse CSV. Please optimize format headers of BusinessName, Website, Category, etc.");
        return;
      }

      const newProcessedLeads = parsed.map((item, index) => {
        const raw: LeadRaw = {
          id: `lead-${Date.now()}-${index}`,
          BusinessName: item.BusinessName || item.Business_Name || item.businessName || "Unnamed Business",
          OwnerName: item.OwnerName || item.Owner_Name || item.Owner || "",
          ContactName: item.ContactName || item.Contact_Name || "",
          Category: item.Category || item.category || "General Business",
          Country: item.Country || item.country || "United States",
          City: item.City || item.city || "",
          Address: item.Address || item.address || "",
          Website: item.Website || item.website || "",
          Email: item.Email || item.email || "",
          Phone: item.Phone || item.phone || "",
          WhatsApp: item.WhatsApp || item.whatsapp || "",
          FacebookURL: item.FacebookURL || item.Facebook_URL || item.Facebook || "",
          InstagramURL: item.InstagramURL || item.Instagram_URL || item.Instagram || "",
          LinkedInURL: item.LinkedInURL || item.LinkedIn_URL || item.LinkedIn || "",
          YouTubeURL: item.YouTubeURL || item.YouTube_URL || "",
          GoogleMapsURL: item.GoogleMapsURL || item.Google_Maps || "",
          Rating: item.Rating || item.rating || "",
          Reviews: item.Reviews || item.reviews || "",
          LastSocialActivity: item.LastSocialActivity || item.Last_Social_Activity || "",
          Notes: item.Notes || item.notes || "",
          
          websiteOutdated: item.websiteOutdated || item.OutdatedWebsite || "",
          websiteBrokenLinks: item.websiteBrokenLinks || item.BrokenLinks || "",
          websiteUnresponsive: item.websiteUnresponsive || item.UnresponsiveWebsite || "",
          noFacebook: item.noFacebook || item.NoFacebook || "",
          noInstagram: item.noInstagram || item.NoInstagram || "",
          noSEO: item.noSEO || item.NoSEO || "",
          noSSL: item.noSSL || item.NoSSL || "",
          inactiveSocialMedia: item.inactiveSocialMedia || item.InactiveSocial || "",
          multipleLocations: item.multipleLocations || item.MultipleLocations || ""
        };

        const flags = extractInitialFlags(raw);
        const { score, priority } = computeLeadScore(flags);

        return {
          id: raw.id,
          raw,
          status: "pending" as const,
          score,
          priority
        };
      });

      const mergedLeads = [...leads, ...newProcessedLeads];
      persistLeads(mergedLeads);
      if (newProcessedLeads.length > 0 && !selectedLeadId) {
        setSelectedLeadId(newProcessedLeads[0].id);
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing CSV data. Please check files and retry.");
    }
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvStr = event.target?.result as string;
      handleCSVTextToLeads(csvStr);
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCSV(true);
  };

  const handleDragLeave = () => {
    setIsDraggingCSV(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingCSV(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvStr = event.target?.result as string;
      handleCSVTextToLeads(csvStr);
    };
    reader.readAsText(file);
  };

  // Interactive Live Scoring Switch Toggles
  const handleFlagToggle = (leadId: string, flagKey: keyof ReturnType<typeof extractInitialFlags>) => {
    const updated = leads.map(l => {
      if (l.id !== leadId) return l;

      // Extract current state representation
      const currentFlags = extractInitialFlags(l.raw);
      // Flip specific flag
      const nextFlags = {
        ...currentFlags,
        [flagKey]: !currentFlags[flagKey]
      };

      // Map back to LeadRaw fields
      const mapVal = (v: boolean) => v ? "yes" : "no";
      const updatedRaw = {
        ...l.raw,
        websiteOutdated: flagKey === "websiteOutdated" ? mapVal(nextFlags.websiteOutdated) : l.raw.websiteOutdated,
        websiteBrokenLinks: flagKey === "websiteBrokenLinks" ? mapVal(nextFlags.websiteBrokenLinks) : l.raw.websiteBrokenLinks,
        websiteUnresponsive: flagKey === "websiteUnresponsive" ? mapVal(nextFlags.websiteUnresponsive) : l.raw.websiteUnresponsive,
        noFacebook: flagKey === "noFacebook" ? mapVal(nextFlags.noFacebook) : l.raw.noFacebook,
        noInstagram: flagKey === "noInstagram" ? mapVal(nextFlags.noInstagram) : l.raw.noInstagram,
        noSEO: flagKey === "noSEO" ? mapVal(nextFlags.noSEO) : l.raw.noSEO,
        noSSL: flagKey === "noSSL" ? mapVal(nextFlags.noSSL) : l.raw.noSSL,
        inactiveSocialMedia: flagKey === "inactiveSocialMedia" ? mapVal(nextFlags.inactiveSocialMedia) : l.raw.inactiveSocialMedia,
        multipleLocations: flagKey === "multipleLocations" ? mapVal(nextFlags.multipleLocations) : l.raw.multipleLocations,
        // For reviews cap, we can edit Reviews count in Raw directly
        Reviews: flagKey === "reviewsExceed100" ? (nextFlags.reviewsExceed100 ? "101" : "0") : l.raw.Reviews,
        // Override Note trigger
        Notes: flagKey === "businessAppearsAbandoned" 
          ? (nextFlags.businessAppearsAbandoned ? "This business appears abandoned and inactive." : "")
          : l.raw.Notes
      };

      const recalculate = computeLeadScore(nextFlags);

      return {
        ...l,
        raw: updatedRaw,
        score: recalculate.score,
        priority: recalculate.priority
      };
    });

    persistLeads(updated);
  };

  // Add a Custom Single Lead Manually
  const handleAddSingleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadInput.BusinessName) {
      alert("Business Name is required.");
      return;
    }

    const raw: LeadRaw = {
      id: `lead-manual-${Date.now()}`,
      BusinessName: newLeadInput.BusinessName,
      Category: newLeadInput.Category || "Local Business",
      Country: newLeadInput.Country || "United States",
      City: newLeadInput.City || "",
      Website: newLeadInput.Website || "",
      OwnerName: newLeadInput.OwnerName || "",
      Email: newLeadInput.Email || "",
      Phone: newLeadInput.Phone || "",
      WhatsApp: newLeadInput.WhatsApp || "",
      FacebookURL: newLeadInput.FacebookURL || "",
      InstagramURL: newLeadInput.InstagramURL || "",
      LinkedInURL: newLeadInput.LinkedInURL || "",
      YouTubeURL: newLeadInput.YouTubeURL || "",
      GoogleMapsURL: newLeadInput.GoogleMapsURL || "",
      Reviews: newLeadInput.Reviews || "0",
      Rating: newLeadInput.Rating || "5.0",
      Notes: newLeadInput.Notes || ""
    };

    const flags = extractInitialFlags(raw);
    const { score, priority } = computeLeadScore(flags);

    const merged = [{ id: raw.id, raw, status: "pending" as const, score, priority }, ...leads];
    persistLeads(merged);
    setSelectedLeadId(raw.id);
    setShowAddLeadModal(false);

    // Reset Form Input
    setNewLeadInput({
      BusinessName: "",
      Category: "",
      Country: "United States",
      City: "",
      Website: "",
      OwnerName: "",
      Email: "",
      Phone: "",
      WhatsApp: "",
      FacebookURL: "",
      InstagramURL: "",
      LinkedInURL: "",
      YouTubeURL: "",
      GoogleMapsURL: "",
      Reviews: "0",
      Rating: "5.0",
      Notes: ""
    });
  };

  // Delete Lead
  const handleDeleteLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = leads.filter(l => l.id !== id);
    persistLeads(updated);
    if (selectedLeadId === id) {
      setSelectedLeadId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // Call server to Run Deep Audit on Gemini 3.5 API
  const handleAnalyzeLeadWithGemini = async (leadId: string) => {
    const targetLead = leads.find(l => l.id === leadId);
    if (!targetLead) return;

    // Update status to processing
    const processingLeads = leads.map(l => l.id === leadId ? { ...l, status: "processing" as const } : l);
    persistLeads(processingLeads);

    try {
      const flags = extractInitialFlags(targetLead.raw);
      const res = await fetch("/api/analyze-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: targetLead.raw,
          flags,
          userConfig
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const analysis: LeadAnalysis = await res.json();

      const doneLeads = leads.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            status: "done" as const,
            analysis
          };
        }
        return l;
      });

      persistLeads(doneLeads);

      // Populate edit text fields with copy for direct editor modifications
      if (selectedLeadId === leadId) {
        const initialEdits: Record<string, string> = {
          coldEmail: analysis.coldEmail,
          followUp1: analysis.followUp1,
          followUp2: analysis.followUp2,
          whatsApp: analysis.whatsApp,
          facebook: analysis.facebook,
          linkedIn: analysis.linkedIn,
          youtubeCreator: analysis.youtubeCreator,
          proposalSummary: analysis.proposalSummary,
          meetingRequest: analysis.meetingRequest
        };
        setEditedOutreachTexts(initialEdits);
      }
    } catch (err: any) {
      console.error(err);
      const failedLeads = leads.map(l => {
        if (l.id === leadId) {
          return {
            ...l,
            status: "failed" as const,
            error: err?.message || "Failed to analyze. Verify your Gemini Secret config API Key."
          };
        }
        return l;
      });
      persistLeads(failedLeads);
    }
  };

  // Save customizations done inside the visual textareas of message editor
  const handleEditOutreachSave = () => {
    if (!selectedLeadId) return;
    const currentLead = leads.find(l => l.id === selectedLeadId);
    if (!currentLead || !currentLead.analysis) return;

    const updatedAnalysis: LeadAnalysis = {
      ...currentLead.analysis,
      coldEmail: editedOutreachTexts.coldEmail || currentLead.analysis.coldEmail,
      followUp1: editedOutreachTexts.followUp1 || currentLead.analysis.followUp1,
      followUp2: editedOutreachTexts.followUp2 || currentLead.analysis.followUp2,
      whatsApp: editedOutreachTexts.whatsApp || currentLead.analysis.whatsApp,
      facebook: editedOutreachTexts.facebook || currentLead.analysis.facebook,
      linkedIn: editedOutreachTexts.linkedIn || currentLead.analysis.linkedIn,
      youtubeCreator: editedOutreachTexts.youtubeCreator || currentLead.analysis.youtubeCreator,
      proposalSummary: editedOutreachTexts.proposalSummary || currentLead.analysis.proposalSummary,
      meetingRequest: editedOutreachTexts.meetingRequest || currentLead.analysis.meetingRequest
    };

    const updated = leads.map(l => l.id === selectedLeadId ? { ...l, analysis: updatedAnalysis } : l);
    persistLeads(updated);
    setIsEditingOutreach(false);
  };

  // Sync edit buffer if the active lead changes
  useEffect(() => {
    if (!selectedLeadId) return;
    const currentLead = leads.find(l => l.id === selectedLeadId);
    if (currentLead && currentLead.analysis) {
      const a = currentLead.analysis;
      setEditedOutreachTexts({
        coldEmail: a.coldEmail,
        followUp1: a.followUp1,
        followUp2: a.followUp2,
        whatsApp: a.whatsApp,
        facebook: a.facebook,
        linkedIn: a.linkedIn,
        youtubeCreator: a.youtubeCreator,
        proposalSummary: a.proposalSummary,
        meetingRequest: a.meetingRequest
      });
    } else {
      setEditedOutreachTexts({});
    }
    setIsEditingOutreach(false);
  }, [selectedLeadId, leads]);

  // Copy helper
  const handleCopyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Compile detailed custom report representation matching the exact OUTLETS/MESSAGING specification
  // to feed on-demand into bulk message tools.
  const handleCopyFullMarkdownReport = () => {
    if (leads.length === 0) return;
    
    let report = `====================================================\n`;
    report += `LEAD ACQUISITION & OUTREACH SEQUENCE REPORT\n`;
    report += `Prepared for Syed Shahrukh Anwar - Abbottabad, Pakistan\n`;
    report += `Compiled: ${new Date().toLocaleDateString()}\n`;
    report += `====================================================\n\n`;

    leads.forEach((lead, idx) => {
      const isAuditedAlready = lead.analysis !== undefined;
      const analysis = lead.analysis;
      const flags = extractInitialFlags(lead.raw);
      
      report += `Lead #${idx + 1}\n\n`;
      report += `Business: ${lead.raw.BusinessName || "N/A"}\n`;
      report += `Category: ${lead.raw.Category || "N/A"}\n`;
      report += `Country: ${lead.raw.Country || "N/A"}\n\n`;
      
      report += `Lead Score: ${lead.score}/100\n`;
      report += `Priority: ${lead.priority}\n\n`;
      
      // Problems Found
      const problems: string[] = [];
      if (flags.websiteOutdated) problems.push("Outdated Website");
      if (flags.websiteBrokenLinks) problems.push("Broken Links on site");
      if (flags.websiteUnresponsive) problems.push("Website not responsive/mobile friendly");
      if (flags.noFacebook) problems.push("No/unlinked Facebook layout");
      if (flags.noInstagram) problems.push("No/unlinked Instagram");
      if (flags.noSEO) problems.push("No search (SEO) indexing tags");
      if (flags.noSSL) problems.push("Insecured platform (HTTP instead of HTTPS)");
      if (flags.inactiveSocialMedia) problems.push("Inactive Social accounts activity");
      if (flags.multipleLocations) problems.push("Multiple branch offices listed");
      if (flags.businessAppearsAbandoned) problems.push("Business appears closed or long-term stagnant");
      
      report += `Problems Found:\n`;
      if (problems.length > 0) {
        problems.forEach(p => {
          report += `- ${p}\n`;
        });
      } else {
        report += `- Perfect existing presence (Recommend chatbot or programmer assistant packages)\n`;
      }
      report += `\n`;
      
      if (isAuditedAlready && analysis) {
        report += `Recommended Service: ${analysis.recommendedService}\n`;
        report += `Recommended Package: ${analysis.recommendedPackage}\n`;
        report += `Expected Monthly Revenue: ${analysis.expectedRevenue}\n\n`;
        
        report += `Cold Email:\n`;
        report += `${analysis.coldEmail}\n\n`;
        
        report += `WhatsApp:\n`;
        report += `${analysis.whatsApp}\n\n`;
        
        report += `Facebook:\n`;
        report += `${analysis.facebook}\n\n`;
        
        report += `LinkedIn:\n`;
        report += `${analysis.linkedIn}\n\n`;
        
        report += `Follow-Up 1:\n`;
        report += `${analysis.followUp1}\n\n`;
        
        report += `Follow-Up 2:\n`;
        report += `${analysis.followUp2}\n\n`;
        
        report += `YouTube Creator Outreach Message:\n`;
        report += `${analysis.youtubeCreator}\n\n`;
        
        report += `Proposal Summary:\n`;
        report += `${analysis.proposalSummary}\n\n`;
        
        report += `Meeting Appointment Request:\n`;
        report += `${analysis.meetingRequest}\n`;
      } else {
        report += `[Audit pending. Please trigger the 'Analyze with Gemini' tool sequentially inside the live workspace.]\n`;
      }
      report += `\n--------------------------------\n\n`;
    });

    handleCopyToClipboard(report, "markdown_report");
  };

  // Handle Export CSV action
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const csvContent = generateCSVExportString(leads);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Shahrukh_Anwar_Lead_Acquisition_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Leads
  const filteredLeads = leads.filter(lead => {
    // Search query matching Business, City, Country, or Category
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (lead.raw.BusinessName?.toLowerCase().includes(query) || false) ||
      (lead.raw.Category?.toLowerCase().includes(query) || false) ||
      (lead.raw.City?.toLowerCase().includes(query) || false) ||
      (lead.raw.Country?.toLowerCase().includes(query) || false);

    const matchesPriority = priorityFilter === "all" || lead.priority?.toLowerCase() === priorityFilter.toLowerCase();
    
    const matchesService = serviceFilter === "all" || 
      (lead.analysis?.recommendedService?.toLowerCase().replace(/\s+/g, "") === serviceFilter.toLowerCase());

    return matchesSearch && matchesPriority && matchesService;
  });

  const selectedLead = leads.find(l => l.id === selectedLeadId);

  // Core visual metadata aggregate calculations
  const totalAnalyzed = leads.filter(l => l.status === "done").length;
  const hotLeadsCount = leads.filter(l => l.priority === "HOT").length;
  
  // Pipeline value formula: calculate sum of USD values extracted during Gemini structured schema
  const projectedPipelineVal = leads.reduce((sum, item) => {
    if (item.status === "done" && item.analysis) {
      return sum + (item.analysis.revenueVal || 0);
    }
    return sum;
  }, 0);

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans" id="login-screen-layout">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden" id="login-container">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-55 bg-teal-50 border-2 border-teal-600 rounded-xl flex items-center justify-center text-teal-600 font-extrabold text-lg select-none">
                S
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-lg tracking-tight">Syed Shahrukh Anwar</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Elite CRM Operations</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Admin Access</h1>
              <p className="text-slate-500 text-xs mt-1">Authorized login gateway for Lead Conversion operations</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Administrative Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anwar17070@gmail.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
                  id="admin-login-email-input"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Security Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-teal-500 rounded-xl p-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors"
                  id="admin-login-password-input"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5" id="login-error-alert">
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-semibold">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-teal-600/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                id="login-submit-button"
              >
                <span>Authenticate Platform</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-[11px] text-slate-500 mt-4 leading-relaxed">
                Registered admins: <br/>
                <code className="text-teal-700 font-semibold font-mono">anwar17070@gmail.com</code> or <br/>
                <code className="text-teal-700 font-semibold font-mono">shahrukh17070@gmail.com</code>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800" id="app-root-layout">
      {/* Upper Navigation Rail */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-40 shadow-xs" id="header-rail">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-teal-50 border-2 border-teal-600 rounded-xl flex items-center justify-center text-teal-650 font-extrabold text-lg select-none">
                <Sparkles className="w-5 h-5 absolute animate-ping opacity-20 text-teal-555" />
                S
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-slate-900 text-md tracking-tight">AI Lead Outreach & Audit System</p>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-semibold px-2 py-0.5 rounded border border-indigo-150">
                  Global BD Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Executive consultant console: <span className="text-slate-850 font-bold">Syed Shahrukh Anwar</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* System Status */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center gap-2 ${
              isVerifyingEnv 
                ? "bg-slate-100 border-slate-200 text-slate-500" 
                : isEnvConfigured 
                  ? "bg-teal-50 border-teal-200 text-teal-700" 
                  : "bg-red-50 border-red-200 text-red-600"
            }`} id="api-status-pill">
              <Activity className={`w-3.5 h-3.5 ${isVerifyingEnv ? "animate-spin" : ""}`} />
              <span>
                Gemini Key: {isVerifyingEnv ? "Verifying Context..." : isEnvConfigured ? "CONNECTED" : "MISSING"}
              </span>
            </div>

            {/* Profile configuration button */}
            <button
              onClick={() => setShowConfigPanel(true)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
              id="configure-profile-btn"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Outreach Settings</span>
            </button>

            {/* Sign Out Trigger */}
            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-900 active:bg-rose-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-3xs"
              id="sign-out-btn"
            >
              <User className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6" id="main-content-area">
        {/* Intro Info Banner block */}
        <DashboardIntro onLoadSamples={handleLoadSamples} hasLeads={leads.length > 0} />

        {/* Environmental Warning Notification if Keys not set in Secrets Dashboard */}
        {!isEnvConfigured && !isVerifyingEnv && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex flex-col sm:flex-row items-start gap-3 text-xs shadow-3xs"
            id="key-warning-notification"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold underline text-amber-900">Missing API Credentials Warning</p>
              <p className="mt-1 leading-relaxed text-slate-650">
                The Gemini AI Engine is currently operating without an active <code className="bg-amber-100/60 text-amber-850 px-1 py-0.5 rounded font-mono font-bold text-[11px]">GEMINI_API_KEY</code>. You can fully browse, toggle target audit parameters, and recalculate priorities locally in real-time, but generating deep outreach copywriting via Gemini requires establishing your token. Paste your secret key securely within the **Secrets Panel** (Settings symbol at the top right of the Google AI Studio console sidebar) to unblock deep audits.
              </p>
            </div>
          </motion.div>
        )}

        {/* Aggregate Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" id="dashboard-aggregates-row">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">Total Active Leads</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{leads.length}</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">High Priority (HOT)</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">{hotLeadsCount}</p>
            </div>
            <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center border border-teal-200">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">Audited with AI</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {totalAnalyzed} <span className="text-[11px] text-slate-500 font-mono">({leads.length > 0 ? Math.round((totalAnalyzed / leads.length) * 100) : 0}%)</span>
              </p>
            </div>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center border border-indigo-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px] font-mono tracking-wider">Pipeline Projection Value</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                USD {projectedPipelineVal.toLocaleString()}
              </p>
            </div>
            <div className="w-9 h-9 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center border border-amber-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Cockpit Workspace Tab Switcher */}
        <div className="flex flex-col md:flex-row bg-white border border-slate-200 p-1 rounded-2xl text-xs font-bold font-sans mb-6 gap-2 shadow-xs" id="workspace-cockpit-tabs">
          <button
            onClick={() => setActiveWorkspaceTab("crm")}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "crm"
                ? "bg-slate-900 text-white shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span>🎯 Prospect & Outreach CRM Workbench</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("importer")}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "importer"
                ? "bg-slate-900 text-white shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>🔌 B2BLead Software Direct Importer</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab("operations")}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeWorkspaceTab === "operations"
                ? "bg-slate-900 text-white shadow-xs font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>📊 Accounts Ledger & Operations Hub</span>
          </button>
        </div>

        {/* Dynamic Workspace Selected View */}
        {activeWorkspaceTab === "crm" && (
          <>
            {/* Database Toolbar & Upload Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs" id="workflow-toolbar">
          <div className="flex flex-wrap items-center gap-3">
            {/* Click/Drag file upload component */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`px-4 py-2.5 bg-slate-50 border rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors text-xs font-semibold ${
                isDraggingCSV
                  ? "border-teal-600 text-teal-700 bg-teal-50"
                  : "border-slate-200 text-slate-650 hover:border-slate-350 hover:bg-slate-100/50 hover:text-slate-900"
              }`}
              id="csv-drop-emitter"
            >
              <Upload className="w-4 h-4 text-slate-55" />
              <span>Import Prospect CSV</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv"
                className="hidden"
                id="file-element-import"
              />
            </div>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-3xs"
              id="new-lead-modal-opener"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </button>

            {leads.length > 0 && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-3xs"
                  id="bulk-csv-export-btn"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export CSV Package</span>
                </button>

                <button
                  onClick={handleCopyFullMarkdownReport}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-3xs"
                  id="markdown-report-copy-btn"
                >
                  {copiedStates.markdown_report ? (
                    <>
                      <Check className="w-4 h-4 text-teal-600" />
                      <span className="text-teal-700">Sequence Report Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-45" />
                      <span>Copy Structured CRM Report</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>Location: <span className="text-slate-800 font-bold">Abbottabad, PK</span></span>
            <span className="text-slate-350">|</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>PKT: <span className="text-slate-800 font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></span>
          </div>
        </div>

        {/* Dynamic Data Grid & Control Split screen */}
        {leads.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-xs" id="empty-workspace-state">
            <div className="w-16 h-16 bg-slate-50 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-3xs">
              <Database className="w-8 h-8 opacity-70" />
            </div>
            <p className="text-lg font-bold text-slate-900 mb-2">No Leads Loaded</p>
            <p className="text-slate-600 max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Start by loading our high-potential sample business leads to preview Syed's automated outreach copywriting engine, or import a cold CSV folder.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleLoadSamples}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-705 active:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-500/10"
                id="load-samples-splash-btn"
              >
                <Sparkles className="w-4 h-4 text-teal-100" />
                <span>Load Sample Database</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-150 text-slate-850 text-xs font-bold rounded-xl transition-all cursor-pointer"
                id="empty-state-file-picker"
              >
                Upload CSV File
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-crm-grid">
            {/* Left sidebar - Leads list selection panel */}
            <div className="lg:col-span-5 flex flex-col gap-4" id="leads-sidebar-selector">
              {/* Filter controller box */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs">
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute top-3 left-3" />
                  <input
                    type="text"
                    placeholder="Search name, category, country..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-205 text-xs font-medium text-slate-800 placeholder-slate-450 rounded-lg focus:outline-none focus:border-teal-500 focus:bg-white transition-colors"
                    id="lead-search-box"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2" id="filter-dropdowns-block">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Priority</label>
                    <div className="relative">
                      <Filter className="w-3 h-3 text-slate-400 absolute top-2.5 left-2 pointer-events-none" />
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-705 font-medium font-sans focus:outline-none focus:border-teal-505 focus:bg-white appearance-none cursor-pointer"
                        id="priority-select-filter"
                      >
                        <option value="all">All Priorities</option>
                        <option value="hot">🔥 HOT</option>
                        <option value="warm">⚡ WARM</option>
                        <option value="cold">❄️ COLD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Service Type</label>
                    <div className="relative">
                      <Layers className="w-3 h-3 text-slate-400 absolute top-2.5 left-2 pointer-events-none" />
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-705 font-medium font-sans focus:outline-none focus:border-teal-505 focus:bg-white appearance-none cursor-pointer"
                        id="service-select-filter"
                      >
                        <option value="all">All Services</option>
                        <option value="websitedevelopment">Web Design</option>
                        <option value="seo">SEO Optimization</option>
                        <option value="socialmediamanagement">Social Media</option>
                        <option value="aiautomation">AI Automation</option>
                        <option value="virtualprogrammingassistant">Assistant Tech</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leads Listing scroll block */}
              <div className="max-h-[640px] overflow-y-auto flex flex-col gap-2 rounded-xl pr-1" id="leads-scroll-block">
                {filteredLeads.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs font-medium shadow-3xs">
                    No leads match selected filter scope.
                  </div>
                ) : (
                  filteredLeads.map(lead => {
                    const isSelected = lead.id === selectedLeadId;
                    const flags = extractInitialFlags(lead.raw);
                    
                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`p-4 border rounded-xl transition-all cursor-pointer relative group ${
                          isSelected
                            ? "bg-teal-50/30 border-teal-500/40 shadow-xs text-slate-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-3xs"
                        }`}
                        id={`lead-card-${lead.id}`}
                      >
                        {/* Selector Glow Pillar */}
                        {isSelected && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-teal-650 rounded-r" />
                        )}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow min-w-0">
                            <p className="font-bold text-sm tracking-tight truncate text-slate-900 group-hover:text-teal-600 transition-colors">
                              {lead.raw.BusinessName || "N/A"}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                                <Building2 className="w-2.5 h-2.5 text-slate-400" />
                                {lead.raw.Category || "Local"}
                              </span>
                              {lead.raw.Country && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400" />
                                  {lead.raw.Country}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Priority Circle Progress Meter */}
                          <div className="flex-shrink-0 text-right">
                            <div className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded border ${
                              lead.priority === "HOT"
                                ? "bg-teal-50 border-teal-200 text-teal-700"
                                : lead.priority === "WARM"
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-slate-100 border-slate-205 text-slate-550"
                            }`}>
                              {lead.priority}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                              Score: <strong className="text-slate-800">{lead.score}</strong>/100
                            </span>
                          </div>
                        </div>

                        {/* Audit status flags icon sequence preview */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/80 text-[10px] text-slate-500 font-mono">
                          <span className={`px-1 rounded ${flags.noSSL ? "text-amber-805 bg-amber-50 border border-amber-100" : "text-slate-450 bg-slate-105"}`} title="Insecure HTTP">HTTP</span>
                          <span className={`px-1 rounded ${flags.websiteOutdated ? "text-indigo-805 bg-indigo-50 border border-indigo-100" : "text-slate-450 bg-slate-105"}`} title="Outdated Platform">OLD_WEB</span>
                          <span className={`px-1 rounded ${flags.websiteUnresponsive ? "text-rose-700 bg-rose-50 border border-rose-100" : "text-slate-450 bg-slate-105"}`} title="Responsive Issues">MOBILE</span>
                          <span className={`px-1 rounded ${flags.noSEO ? "text-amber-805 bg-amber-50 border border-amber-100" : "text-slate-450 bg-slate-105"}`} title="No Search Meta">NO_SEO</span>
                          <span className={`px-1 rounded ${flags.inactiveSocialMedia ? "text-amber-705 bg-amber-50/50 border border-amber-100/50" : "text-slate-450 bg-slate-105"}`} title="Inactive socials">INACTIVE_SOC</span>
                        </div>

                        {/* Analysis service outcome badge if audited */}
                        {lead.status === "done" && lead.analysis && (
                          <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-200/60">
                            <span className="text-indigo-700 font-extrabold flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3.5 h-3.5" /> {lead.analysis.recommendedService}
                            </span>
                            <span className="text-emerald-700 font-mono font-bold text-[11px]">
                              {lead.analysis.expectedRevenue}
                            </span>
                          </div>
                        )}

                        {/* Status logs */}
                        <div className="mt-2.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-555 text-slate-500 flex items-center gap-1 font-mono">
                            ID: #{lead.id.substring(lead.id.length - 5)}
                          </span>

                          <div className="flex items-center gap-2">
                            {lead.status === "processing" ? (
                              <span className="text-[11px] font-mono text-indigo-650 flex items-center gap-1 font-bold animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" /> auditing...
                              </span>
                            ) : lead.status === "failed" ? (
                              <span className="text-[11px] font-mono text-rose-600 flex items-center gap-1 font-semibold" title={lead.error}>
                                <AlertTriangle className="w-3.5 h-3.5" /> failed
                              </span>
                            ) : lead.status === "done" ? (
                              <span className="text-[11px] font-mono text-teal-700 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-3 h-3" /> compiled
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-450">
                                pending audit
                              </span>
                            )}

                            <button
                              onClick={(e) => handleDeleteLead(lead.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              id={`delete-lead-${lead.id}`}
                              title="Delete lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel - Full detailed Audit workbench & generated sequence workspace */}
            <div className="lg:col-span-7 flex flex-col gap-4" id="lead-details-pane">
              {selectedLead ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm" id="workbench-panel">
                  {/* Selected Lead Top Bar Banner */}
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white border border-slate-250 text-slate-700 shadow-3xs">
                          {selectedLead.raw.Category || "No Category"}
                        </span>
                        {selectedLead.raw.Website ? (
                          <a
                            href={selectedLead.raw.Website.startsWith("http") ? selectedLead.raw.Website : `https://${selectedLead.raw.Website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-700 hover:underline flex items-center gap-1 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-150 shadow-3xs"
                          >
                            <Globe className="w-3 h-3 text-indigo-555" /> {selectedLead.raw.Website.replace(/(^\w+:|^)\/\//, "")} <ArrowUpRight className="w-2.5 h-2.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-250">
                            No Website Found
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-900" id="selected-lead-heading">{selectedLead.raw.BusinessName}</h2>
                      
                      {/* Integrated Funnel Stage Tracker */}
                      <div className="flex items-center gap-2 mt-2 bg-white px-2.5 py-1 rounded-lg border border-slate-205 shadow-3xs w-fit">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">CRM Funnel Phase:</span>
                        <select
                          value={selectedLead.outreachStatus || "prospect"}
                          onChange={(e) => handleUpdateOutreachStatusInCRM(selectedLead.id, e.target.value as any)}
                          className={`text-[11px] font-bold rounded px-2 py-0.5 focus:outline-none cursor-pointer appearance-none bg-slate-50 border border-slate-200 ${
                            selectedLead.outreachStatus === "paid"
                              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                              : selectedLead.outreachStatus === "accepted" || selectedLead.outreachStatus === "invoiced"
                                ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                                : selectedLead.outreachStatus === "replied" || selectedLead.outreachStatus === "opened"
                                  ? "text-teal-700 bg-teal-50 border-teal-200"
                                  : selectedLead.outreachStatus === "cold_sent"
                                    ? "text-blue-700 bg-blue-50 border-blue-200"
                                    : "text-slate-700 bg-slate-50 border-slate-250"
                          }`}
                        >
                          <option value="prospect">🎯 New Prospect</option>
                          <option value="cold_sent">✉️ Cold Sent</option>
                          <option value="opened">👀 Email Opened</option>
                          <option value="replied">💬 Lead Replied</option>
                          <option value="accepted">🤝 Offer Accepted</option>
                          <option value="invoiced">🧾 Invoice Issued</option>
                          <option value="paid">💰 Paid Contract</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-550 mt-2 flex-wrap">
                        {selectedLead.raw.City && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold">
                            <MapPin className="w-3 h-3 text-slate-400" /> {selectedLead.raw.City}, {selectedLead.raw.Country}
                          </span>
                        )}
                        {selectedLead.raw.Reviews && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Reviews: <strong className="text-slate-850">{selectedLead.raw.Reviews}</strong> ({selectedLead.raw.Rating || "5.0"}★)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score / Trigger analysis */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-mono text-slate-500">Audit Score</p>
                        <p className="text-lg font-black text-slate-900">{selectedLead.score}<span className="text-slate-500 text-xs">/100</span></p>
                      </div>

                      {/* Giant Priority Indicator Badge */}
                      <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-black shadow-sm ${
                        selectedLead.priority === "HOT"
                          ? "bg-teal-50 border-teal-200 text-teal-700"
                          : selectedLead.priority === "WARM"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-slate-50 border-slate-205 text-slate-600"
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold -mb-1">Priority</span>
                        <span className="text-md leading-none mt-1">{selectedLead.priority}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Vulnerability Audit Controls Checklist */}
                  <div className="bg-slate-50 border-b border-slate-200 p-5">
                    <h3 className="text-xs uppercase font-mono tracking-widest text-slate-600 mb-3 flex items-center gap-2 font-bold">
                      <Activity className="w-4 h-4 text-teal-600" /> Interactive Digital Presence Audit Checklist
                    </h3>
                    
                    <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                      Toggle the discovered issues below manually or via imported CSV files. Changing any checkbox recalculates Syed Anwar's lead conversion scores, matching hot priorities, and automatically informs Gemini's outbound copy generator!
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {/* Outdated Website */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).websiteOutdated}
                          onChange={() => handleFlagToggle(selectedLead.id, "websiteOutdated")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Outdated Style</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">+10 Score points</p>
                        </div>
                      </label>

                      {/* Responsive Layout */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).websiteUnresponsive}
                          onChange={() => handleFlagToggle(selectedLead.id, "websiteUnresponsive")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Mobile Unfriendly</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+10 Score points</p>
                        </div>
                      </label>

                           {/* Broken Links */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).websiteBrokenLinks}
                          onChange={() => handleFlagToggle(selectedLead.id, "websiteBrokenLinks")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Broken links / 404s</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">+5 Score points</p>
                        </div>
                      </label>

                      {/* Missing Facebook */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).noFacebook}
                          onChange={() => handleFlagToggle(selectedLead.id, "noFacebook")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Missing Facebook</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+5 Score points</p>
                        </div>
                      </label>

                      {/* Missing Instagram */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).noInstagram}
                          onChange={() => handleFlagToggle(selectedLead.id, "noInstagram")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Missing Instagram</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+5 Score points</p>
                        </div>
                      </label>

                      {/* No SEO */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).noSEO}
                          onChange={() => handleFlagToggle(selectedLead.id, "noSEO")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Missing SEO Tags</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+15 Score points</p>
                        </div>
                      </label>

                      {/* Insecure SSL */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).noSSL}
                          onChange={() => handleFlagToggle(selectedLead.id, "noSSL")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">No Secure SSL (http)</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+10 Score points</p>
                        </div>
                      </label>

                      {/* Inactive Socials */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).inactiveSocialMedia}
                          onChange={() => handleFlagToggle(selectedLead.id, "inactiveSocialMedia")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Inactive Social Activity</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+10 Score points</p>
                        </div>
                      </label>

                      {/* Multiple Locations */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).multipleLocations}
                          onChange={() => handleFlagToggle(selectedLead.id, "multipleLocations")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Multiple Locations</p>
                          <p className="text-slate-505 text-slate-500 text-[10px] mt-0.5">+20 Score points</p>
                        </div>
                      </label>

                      {/* Reviews count */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).reviewsExceed100}
                          onChange={() => handleFlagToggle(selectedLead.id, "reviewsExceed100")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Reviews &gt; 100 on Google</p>
                          <p className="text-slate-555 text-slate-500 text-[10px] mt-0.5">+10% Score Bonus</p>
                        </div>
                      </label>

                      {/* Abandoned business */}
                      <label className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none shadow-3xs">
                        <input
                          type="checkbox"
                          checked={extractInitialFlags(selectedLead.raw).businessAppearsAbandoned}
                          onChange={() => handleFlagToggle(selectedLead.id, "businessAppearsAbandoned")}
                          className="mt-0.5 rounded border-slate-300 text-teal-650 focus:ring-teal-500 w-3.5 h-3.5 pointer-events-auto cursor-pointer"
                        />
                        <div className="text-[11px] leading-tight">
                          <p className="font-semibold text-slate-800">Appears Abandoned</p>
                          <p className="text-slate-555 text-slate-500 text-[10px] mt-0.5">-30% Score Penalty</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Core Workspace Output Tabs */}
                  {selectedLead.status === "processing" ? (
                    /* Elegant artificial loading logs simulating server audit in real-time */
                    <div className="p-12 text-center" id="loading-audit-state">
                      <div className="relative w-16 h-16 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-150 border-t-teal-600 animate-spin" />
                        <Sparkles className="w-6 h-6 text-teal-605 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <p className="text-[15px] font-bold text-slate-900 mb-2">Analyzing with Gemini 3.5 Flash Engine...</p>
                      
                      <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-lg p-3 text-left font-mono text-[10.5px] text-slate-605 flex flex-col gap-1.5 shadow-inner">
                        <p className="flex items-center gap-2">
                          <span className="text-teal-605">●</span> <span>[SYSTEM]: Bootstrapping lead structural telemetry...</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-purple-605">●</span> <span>[SECURITY]: Inspecting headers for SSL certificates...</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-indigo-605">●</span> <span>[AUDITOR]: Correlating reviews counts and geo density...</span>
                        </p>
                        <p className="flex items-center gap-2 flex-nowrap shrink-0 overflow-hidden text-slate-450">
                          <span className="text-slate-400 animate-pulse">●</span> <span className="animate-pulse"> drafting 9-channel sequence copy on behalf of Syed Shahrukh Anwar...</span>
                        </p>
                      </div>
                    </div>
                  ) : selectedLead.status === "done" && selectedLead.analysis ? (
                    <div>
                      {/* Analysis Segment tabs */}
                      <div className="bg-slate-50 border-b border-slate-200 flex items-center justify-between px-6" id="workbench-tabs">
                        <div className="flex gap-4">
                          <button
                            onClick={() => setActiveOutreachTab("auditSummary")}
                            className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              activeOutreachTab === "auditSummary"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                            id="audit-summary-tab"
                          >
                            Presence Audit & Services
                          </button>
                          <button
                            onClick={() => setActiveOutreachTab("coldEmail")}
                            className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                              activeOutreachTab !== "auditSummary"
                                ? "border-teal-600 text-teal-700"
                                : "border-transparent text-slate-500 hover:text-slate-800"
                            }`}
                            id="outreach-tab-trigger"
                          >
                            Outreach Copy package
                          </button>
                        </div>

                        {/* Direct modification switch */}
                        {activeOutreachTab !== "auditSummary" && (
                          <div className="flex items-center gap-2">
                            {isEditingOutreach ? (
                              <>
                                <button
                                  onClick={() => setIsEditingOutreach(false)}
                                  className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleEditOutreachSave}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded cursor-pointer shadow-xs"
                                >
                                  Save Edits
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setIsEditingOutreach(true)}
                                className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-205 text-[10px] font-semibold rounded cursor-pointer shadow-3xs"
                              >
                                Edit Copy
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content panel switch */}
                      <div className="p-6">
                        {activeOutreachTab === "auditSummary" ? (
                          /* Detailed visual auditing cards layout */
                          <div className="space-y-5" id="presence-audit-layout">
                            {/* Pro-Offer pitch Box */}
                            <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-3xs">
                              <div>
                                <p className="text-[10px] uppercase font-mono text-indigo-705 font-bold">Recommended Solution for Syed Shahrukh Anwar</p>
                                <h4 className="text-md font-bold text-slate-900 mt-1">
                                  {selectedLead.analysis.recommendedService} ({selectedLead.analysis.recommendedPackage})
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 max-w-lg">
                                  This target client suffers from critical digital presence gaps that directly impact conversion. Propose this package to secure a long-term contract.
                                </p>
                              </div>

                              <div className="bg-white rounded-xl border border-indigo-105 p-3 text-center min-w-36 shadow-3xs">
                                <span className="text-[10px] uppercase font-mono text-slate-500 block font-semibold">Value potential</span>
                                <span className="text-[15px] text-emerald-755 text-emerald-700 font-extrabold font-mono leading-none block mt-1">{selectedLead.analysis.expectedRevenue}</span>
                                {selectedLead.analysis.isRecurring && (
                                  <span className="text-[9px] text-slate-450 font-mono block mt-1 uppercase font-semibold">Recurring Revenue</span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Left block - Presence Audits */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-3xs">
                                <h5 className="text-[11px] uppercase font-mono text-slate-500 tracking-wider font-bold">Website Quality & Content Inspection</h5>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg">
                                  "{selectedLead.analysis.websiteQuality}"
                                </p>

                                <h5 className="text-[11px] uppercase font-mono text-slate-500 tracking-wider pt-2 font-bold">SEO Status & Gaps</h5>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg">
                                  "{selectedLead.analysis.seoStatus}"
                                </p>
                              </div>

                              {/* Right block - Social & Potential */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-3xs">
                                <h5 className="text-[11px] uppercase font-mono text-slate-500 tracking-wider font-bold">Social Media Status</h5>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg">
                                  "{selectedLead.analysis.socialPresence}"
                                </p>

                                <h5 className="text-[11px] uppercase font-mono text-slate-500 tracking-wider pt-2 font-bold">Category Potential & Local Market</h5>
                                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg">
                                  "{selectedLead.analysis.marketPotential}"
                                </p>
                              </div>
                            </div>

                            {/* Critical problems bullet checklist */}
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-3xs">
                              <h5 className="text-xs uppercase font-mono text-slate-600 mb-3 flex items-center gap-1.5 font-bold">
                                <AlertTriangle className="w-4 h-4 text-rose-600" /> Discovered Audit Gaps ({selectedLead.analysis.problemsFound.length})
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                                {selectedLead.analysis.problemsFound.map((prob, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />
                                    <span>{prob}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Outreach Message copywriting Sequence hub */
                          <div className="space-y-4" id="messages-outbound-workspace">
                            {/* Message items selection rail */}
                            <div className="flex flex-wrap gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-xl text-[11px] font-semibold" id="copy-tabs-grid">
                              {[
                                { id: "coldEmail", label: "📧 Cold Email" },
                                { id: "followUp1", label: "⏰ Follow-Up 1" },
                                { id: "followUp2", label: "⏰ Follow-Up 2" },
                                { id: "whatsApp", label: "💬 WhatsApp" },
                                { id: "facebook", label: "💬 Facebook" },
                                { id: "linkedIn", label: "💼 LinkedIn" },
                                { id: "youtubeCreator", label: "🎬 YT Creator" },
                                { id: "proposalSummary", label: "📄 Proposal" },
                                { id: "meetingRequest", label: "📅 Appointments" }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => {
                                    setActiveOutreachTab(tab.id);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                    activeOutreachTab === tab.id
                                      ? "bg-white border border-slate-250 text-teal-700 shadow-3xs font-extrabold"
                                      : "text-slate-500 hover:text-slate-800"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Main preview/Direct textarea display area */}
                            <div className="relative group/copy container-area bg-white rounded-xl border border-slate-200 min-h-64 flex flex-col justify-between shadow-3xs">
                              <div className="p-4 flex-grow">
                                {isEditingOutreach ? (
                                  <textarea
                                    value={editedOutreachTexts[activeOutreachTab] || ""}
                                    onChange={(e) => {
                                      const textVal = e.target.value;
                                      setEditedOutreachTexts(prev => ({
                                        ...prev,
                                        [activeOutreachTab]: textVal
                                      }));
                                    }}
                                    className="w-full h-85 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    id="message-editor-textarea"
                                  />
                                ) : (
                                  /* Display copy nicely preloaded formatting */
                                  <p className="text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-teal-500/15">
                                    {editedOutreachTexts[activeOutreachTab] || selectedLead.analysis[activeOutreachTab as keyof LeadAnalysis] || ""}
                                  </p>
                                )}
                              </div>

                              {/* Footer Toolbar of Clipboard Operations */}
                              <div className="bg-slate-50 px-4 py-3 rounded-b-xl border-t border-slate-200 flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-500 uppercase font-mono text-[9px] tracking-widest flex items-center gap-1 font-bold">
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Channel: {activeOutreachTab}
                                </span>

                                <button
                                  onClick={() => {
                                    const text = editedOutreachTexts[activeOutreachTab] || selectedLead.analysis?.[activeOutreachTab as keyof LeadAnalysis] || "";
                                    handleCopyToClipboard(text as string, `copy_${activeOutreachTab}`);
                                  }}
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold rounded flex items-center gap-2.5 transition-colors cursor-pointer shadow-xs"
                                  id="clipboard-action-trigger"
                                >
                                  {copiedStates[`copy_${activeOutreachTab}`] ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copied to Clipboard!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Message text</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Initial Pending Analysis Splash banner */
                    <div className="p-16 text-center animate-fade-in" id="pending-audit-splash">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4 p-3.5 text-indigo-650 shadow-3xs">
                        <Sparkles className="w-9 h-9" />
                      </div>
                      <h4 className="text-md font-bold text-slate-900 mb-2">Lead Audit & Sequencing Ready</h4>
                      <p className="text-slate-600 text-xs max-w-sm mx-auto leading-relaxed mb-6">
                        Run our automated analysis to score this lead's search, performance, SSL validation, and generate targeted sales copy!
                      </p>
                      <button
                         onClick={() => handleAnalyzeLeadWithGemini(selectedLead.id)}
                         className="px-6 py-3 bg-teal-650 bg-teal-600 hover:bg-teal-750 hover:bg-teal-700 active:bg-teal-850 text-white font-extrabold text-xs rounded-xl flex items-center gap-2.5 transition-all mx-auto cursor-pointer shadow-sm"
                         id="analyze-lead-workspace-btn"
                       >
                         <Sparkles className="w-4 h-4 text-white" />
                         <span>Analyze with Gemini API</span>
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Detail loader if no lead matches selection scope */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl py-24 px-6 text-center text-slate-500 text-xs font-semibold shadow-3xs">
                  Select a lead on the sidebar to audit presence gaps or review personalized generated templates!
                </div>
              )}
            </div>
          </div>
        )}
        </>
      )}

      {activeWorkspaceTab === "importer" && (
        <B2BLeadImporter
          onImport={handleImportLeadsFromB2B}
          onAddActivity={(msg, type) => addActivityLog(msg, type as any)}
        />
      )}

      {activeWorkspaceTab === "operations" && (
        <OperationsHub
          leads={leads}
          onUpdateOutreachStatus={handleUpdateOutreachStatusInCRM}
          ledgerEntries={ledgerEntries}
          onAddLedgerEntry={handleAddLedgerEntry}
          onDeleteLedgerEntry={handleDeleteLedgerEntry}
          activityLogs={activityLogs}
          onClearActivityLogs={handleClearLogs}
        />
      )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50 py-5 mt-12 px-6" id="footer-branding-block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <p>© 2026 Syed Shahrukh Anwar. Elite CRM Portfolio Workspace Project.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-605 text-slate-600">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
              Engine Operations: Abbottabad, PK
            </span>
          </div>
        </div>
      </footer>

      {/* Global Configuration Drawer Overlay modal */}
      <AnimatePresence>
        {showConfigPanel && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="config-drawer-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 max-w-xl w-full rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="text-md font-extrabold text-slate-900 mb-1">Customize Outreach Configuration</h3>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Set up Syed Shahrukh Anwar's operational contact details, Payoneer account, and instructions so that copy is built exactly with correct pricing & call to action anchors!
              </p>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Owner Name</label>
                    <input
                      type="text"
                      value={userConfig.name}
                      onChange={(e) => setUserConfig({ ...userConfig, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Location</label>
                    <input
                      type="text"
                      value={userConfig.location}
                      onChange={(e) => setUserConfig({ ...userConfig, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Email</label>
                    <input
                      type="email"
                      value={userConfig.email}
                      onChange={(e) => setUserConfig({ ...userConfig, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Contact WhatsApp</label>
                    <input
                      type="text"
                      value={userConfig.whatsapp}
                      onChange={(e) => setUserConfig({ ...userConfig, whatsapp: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Payoneer Email</label>
                    <input
                      type="text"
                      value={userConfig.payoneer}
                      onChange={(e) => setUserConfig({ ...userConfig, payoneer: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Alternative Bank Transfer Wire details</label>
                    <textarea
                      value={userConfig.bankDetails}
                      onChange={(e) => setUserConfig({ ...userConfig, bankDetails: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 h-16 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Custom copy generator instruction additions</label>
                    <textarea
                      value={userConfig.customTextPrompt}
                      onChange={(e) => setUserConfig({ ...userConfig, customTextPrompt: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 h-24 focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-150 flex justify-end gap-3 text-xs font-semibold">
                <button
                  onClick={() => setShowConfigPanel(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleSaveConfig(userConfig)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl cursor-pointer shadow-xs"
                >
                  Save settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Single Lead modal */}
      <AnimatePresence>
        {showAddLeadModal && (
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in" id="add-lead-modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 max-w-2xl w-full rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="text-md font-extrabold text-slate-900 mb-1">Create Lead Manually</h3>
              <p className="text-xs text-slate-600 mb-5 font-medium">
                Have a single offline client or a restaurant from Google Maps you want to audit? Input details directly:
              </p>

              <form onSubmit={handleAddSingleLeadSubmit} className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Business Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kyoto Sushi Bar"
                      value={newLeadInput.BusinessName}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, BusinessName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Category / Niche</label>
                    <input
                      type="text"
                      placeholder="e.g. Japanese Restaurant"
                      value={newLeadInput.Category}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Country</label>
                    <input
                      type="text"
                      placeholder="e.g. Japan"
                      value={newLeadInput.Country}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Country: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Kyoto"
                      value={newLeadInput.City}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, City: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Website URL</label>
                    <input
                      type="text"
                      placeholder="e.g. http://kyotosushi.jp"
                      value={newLeadInput.Website}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Website: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Owner / Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kenji Sato"
                      value={newLeadInput.OwnerName}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, OwnerName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+81..."
                      value={newLeadInput.Phone}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Email</label>
                    <input
                      type="email"
                      placeholder="contact@sushi.jp"
                      value={newLeadInput.Email}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Reviews Count</label>
                    <input
                      type="text"
                      placeholder="e.g. 52"
                      value={newLeadInput.Reviews}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Reviews: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Google Maps Rating (0-5)</label>
                    <input
                      type="text"
                      placeholder="e.g. 4.6"
                      value={newLeadInput.Rating}
                      onChange={(e) => setNewLeadInput({ ...newLeadInput, Rating: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1 font-bold">Context Notes & Comments</label>
                  <textarea
                    placeholder="e.g. Quiet socials, website copyright outdated since 2019."
                    value={newLeadInput.Notes}
                    onChange={(e) => setNewLeadInput({ ...newLeadInput, Notes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 h-16 focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                  />
                </div>

                <div className="mt-6 pt-4 border-t border-slate-150 flex justify-end gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(false)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl cursor-pointer shadow-xs font-bold"
                  >
                    Create Lead
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
