/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  Settings, 
  HelpCircle, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle, 
  Database, 
  FileCode, 
  AlertCircle, 
  RefreshCw,
  Plus
} from "lucide-react";
import { LeadRaw, ProcessedLead } from "../types";
import { parseCSV, computeLeadScore, extractInitialFlags } from "../utils";

interface B2BLeadImporterProps {
  onImport: (newLeads: ProcessedLead[]) => void;
  onAddActivity: (msg: string, type: 'lead' | 'audit' | 'ledger' | 'outreach' | 'system') => void;
}

export default function B2BLeadImporter({ onImport, onAddActivity }: B2BLeadImporterProps) {
  const [sourceData, setSourceData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [importPreset, setImportPreset] = useState("custom");
  const [fileName, setFileName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);
  
  // Header mappings: maps CRM target field -> CSV/JSON source header key
  const [mappings, setMappings] = useState<Record<string, string>>({
    BusinessName: "",
    Website: "",
    Email: "",
    Phone: "",
    Category: "",
    Country: "",
    City: "",
    Reviews: "",
    Rating: "",
    FacebookURL: "",
    InstagramURL: "",
    LinkedInURL: "",
    Notes: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetFields = [
    { key: "BusinessName", label: "Business Name *", required: true, desc: "Primary title of the company" },
    { key: "Website", label: "Website URL", required: false, desc: "Prospect home page link" },
    { key: "Email", label: "Email Address", required: false, desc: "Direct / corporate contact email" },
    { key: "Phone", label: "Phone Number", required: false, desc: "Working telephone number" },
    { key: "Category", label: "Industry / Niche", required: false, desc: "E.g. Restaurant, Dental clinic, Plumber" },
    { key: "Country", label: "Country", required: false, desc: "Standard location country" },
    { key: "City", label: "City", required: false, desc: "Standard location city" },
    { key: "Reviews", label: "Google Reviews Count", required: false, desc: "Total reviews metric" },
    { key: "Rating", label: "Google Rating Score", required: false, desc: "Average stars (0-5)" },
    { key: "FacebookURL", label: "Facebook Page", required: false, desc: "Corporate page URL" },
    { key: "InstagramURL", label: "Instagram Profile", required: false, desc: "Instagram social profile" },
    { key: "LinkedInURL", label: "LinkedIn Company", required: false, desc: "Corporate profile / owner profile" },
    { key: "Notes", label: "Context Notes", required: false, desc: "Crawler summary description" }
  ];

  // Auto fuzzy matching logic when raw headers are populated
  const handleAutoMap = (rawHeaders: string[]) => {
    const nextMappings: Record<string, string> = {};
    
    const fuzzSearch = (targets: string[]): string => {
      for (const h of rawHeaders) {
        const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const t of targets) {
          if (cleanH === t || cleanH.includes(t) || t.includes(cleanH)) {
            return h;
          }
        }
      }
      return "";
    };

    nextMappings.BusinessName = fuzzSearch(["businessname", "companyname", "business", "company", "name", "title", "organizat", "firm"]);
    nextMappings.Website = fuzzSearch(["website", "domain", "url", "web", "site", "homepage"]);
    nextMappings.Email = fuzzSearch(["email", "mail", "contactemail", "emailaddress"]);
    nextMappings.Phone = fuzzSearch(["phone", "tel", "telephone", "contactphone", "whatsapp", "phone_number"]);
    nextMappings.Category = fuzzSearch(["category", "niche", "industry", "type", "tag", "nichecategory"]);
    nextMappings.Country = fuzzSearch(["country", "nation", "state"]);
    nextMappings.City = fuzzSearch(["city", "town", "municipal"]);
    nextMappings.Reviews = fuzzSearch(["reviews", "google_reviews", "review_count", "reviewcount", "reviews_count"]);
    nextMappings.Rating = fuzzSearch(["rating", "google_rating", "rating_score", "stars", "star_rating"]);
    nextMappings.FacebookURL = fuzzSearch(["facebook", "facebookurl", "facebook_page", "fb", "fb_url"]);
    nextMappings.InstagramURL = fuzzSearch(["instagram", "instagramurl", "ig", "instagram_profile"]);
    nextMappings.LinkedInURL = fuzzSearch(["linkedin", "linkedinurl", "linkedin_page", "li"]);
    nextMappings.Notes = fuzzSearch(["notes", "comment", "description", "summary", "crawler_notes", "bio", "snippet"]);

    // If BusinessName wasn't mapped, default to first header
    if (!nextMappings.BusinessName && rawHeaders.length > 0) {
      nextMappings.BusinessName = rawHeaders[0];
    }

    setMappings(nextMappings);
  };

  // Import presets handler
  useEffect(() => {
    if (sourceData.length === 0 || headers.length === 0) return;
    
    if (importPreset === "apollo") {
      // Apollo.io typical exports
      setMappings({
        BusinessName: headers.find(h => /company/i.test(h)) || "",
        Website: headers.find(h => /website|domain/i.test(h)) || "",
        Email: headers.find(h => /email|mail/i.test(h)) || "",
        Phone: headers.find(h => /phone|whatsapp/i.test(h)) || "",
        Category: headers.find(h => /industry/i.test(h)) || "",
        Country: headers.find(h => /country/i.test(h)) || "",
        City: headers.find(h => /city/i.test(h)) || "",
        Reviews: "",
        Rating: "",
        FacebookURL: headers.find(h => /facebook/i.test(h)) || "",
        InstagramURL: "",
        LinkedInURL: headers.find(h => /linkedin/i.test(h)) || "",
        Notes: headers.find(h => /title|seo/i.test(h)) || ""
      });
    } else if (importPreset === "google-maps") {
      // G-Maps extractor formats
      setMappings({
        BusinessName: headers.find(h => /title|name/i.test(h)) || "",
        Website: headers.find(h => /website/i.test(h)) || "",
        Email: headers.find(h => /email/i.test(h)) || "",
        Phone: headers.find(h => /phone|phone_number|tel/i.test(h)) || "",
        Category: headers.find(h => /category|type/i.test(h)) || "",
        Country: headers.find(h => /country/i.test(h)) || "",
        City: headers.find(h => /city/i.test(h)) || "",
        Reviews: headers.find(h => /reviews|reviews_count/i.test(h)) || "",
        Rating: headers.find(h => /rating/i.test(h)) || "",
        FacebookURL: headers.find(h => /facebook/i.test(h)) || "",
        InstagramURL: headers.find(h => /instagram/i.test(h)) || "",
        LinkedInURL: headers.find(h => /linkedin/i.test(h)) || "",
        Notes: headers.find(h => /address/i.test(h)) || ""
      });
    } else {
      // Use auto-fuzzy matching
      handleAutoMap(headers);
    }
  }, [importPreset, sourceData, headers]);

  const processPayload = (text: string, isJson: boolean) => {
    try {
      setErrorMsg("");
      setSuccessCount(null);
      if (isJson) {
        const parsed = JSON.parse(text);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        if (dataArray.length === 0) {
          throw new Error("Empty JSON array provided.");
        }
        // Extract headers from first object
        const allKeys = Array.from(new Set(dataArray.flatMap(obj => Object.keys(obj))));
        setHeaders(allKeys);
        setSourceData(dataArray.map(obj => {
          const strObj: Record<string, string> = {};
          allKeys.forEach(k => {
            strObj[k] = obj[k] !== undefined && obj[k] !== null ? String(obj[k]) : "";
          });
          return strObj;
        }));
      } else {
        // Parse CSV
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          throw new Error("Unable to parse CSV. verify that columns are comma-separated.");
        }
        const rawHeaders = Object.keys(parsed[0]);
        setHeaders(rawHeaders);
        setSourceData(parsed);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Parsing failed. Please verify format matches CSV or JSON standard schemas.");
      setSourceData([]);
      setHeaders([]);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;
    const isJson = pasteText.trim().startsWith("[") || pasteText.trim().startsWith("{");
    processPayload(pasteText, isJson);
    setFileName("Pasted Data Text");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const isJson = file.name.endsWith(".json");
      processPayload(text, isJson);
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (targetKey: string, sourceValue: string) => {
    setMappings(prev => ({ ...prev, [targetKey]: sourceValue }));
  };

  const executeImport = () => {
    if (sourceData.length === 0) return;
    if (!mappings.BusinessName) {
      setErrorMsg("Failed to import: You must map a source field to 'Business Name *' to construct valid leads.");
      return;
    }

    const nextProcessedLeads = sourceData.map((record, index) => {
      const raw: LeadRaw = {
        id: `lead-b2b-${Date.now()}-${index}`,
        BusinessName: record[mappings.BusinessName] || "Unnamed Company",
        Website: record[mappings.Website] || "",
        Email: record[mappings.Email] || "",
        Phone: record[mappings.Phone] || "",
        Category: record[mappings.Category] || "B2B Prospect",
        Country: record[mappings.Country] || "United States",
        City: record[mappings.City] || "",
        Reviews: record[mappings.Reviews] || "",
        Rating: record[mappings.Rating] || "",
        FacebookURL: record[mappings.FacebookURL] || "",
        InstagramURL: record[mappings.InstagramURL] || "",
        LinkedInURL: record[mappings.LinkedInURL] || "",
        Notes: record[mappings.Notes] || ""
      };

      // Compute status flags and priority scores programmatically
      const flags = extractInitialFlags(raw);
      const { score, priority } = computeLeadScore(flags);

      return {
        id: raw.id,
        raw,
        status: "pending" as const,
        score,
        priority,
        outreachStatus: "prospect" as const,
        outreachStatusChangedAt: new Date().toISOString()
      };
    });

    onImport(nextProcessedLeads);
    setSuccessCount(nextProcessedLeads.length);
    onAddActivity(`Directly imported ${nextProcessedLeads.length} leads in bulk via B2BLead Software Pipeline`, 'lead');
    
    // Reset Data
    setSourceData([]);
    setHeaders([]);
    setPasteText("");
    setFileName("");
  };

  // Preview the first 3 mapped items
  const mappedPreview: LeadRaw[] = sourceData.slice(0, 3).map((record, index) => ({
    id: `preview-${index}`,
    BusinessName: record[mappings.BusinessName] || "",
    Website: record[mappings.Website] || "",
    Email: record[mappings.Email] || "",
    Phone: record[mappings.Phone] || "",
    Category: record[mappings.Category] || "",
    Country: record[mappings.Country] || "",
    City: record[mappings.City] || ""
  }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative" id="b2blead-importer-workspace">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
        <div>
          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-bold font-mono border border-teal-200 uppercase">
            B2B Automation
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" /> B2BLead Software Direct Importer
          </h2>
          <p className="text-xs text-slate-550 mt-1">
            Accelerate lead loading from Apollo, Hunter, G-Maps scapers, or D7 Lead Finder. Map headers dynamically right into Syed's scoring machine.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-[11px] font-sans font-bold text-slate-500 whitespace-nowrap">Load Preset Structure:</label>
          <select
            value={importPreset}
            onChange={(e) => setImportPreset(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-teal-500"
            id="preset-importer-select"
          >
            <option value="custom">🔍 Auto Match Columns (Custom)</option>
            <option value="apollo">💼 Apollo.io Export</option>
            <option value="google-maps">📍 PhantomBuster/G-Maps scraper</option>
          </select>
        </div>
      </div>

      {successCount !== null && (
        <div className="p-4 bg-teal-50 border border-teal-150 text-teal-800 rounded-xl mb-6 text-xs flex items-start gap-3 shadow-3xs animate-fade-in" id="import-success-alert">
          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Lead Batch Loaded Correctly</p>
            <p className="mt-0.5 text-slate-650">
              Successfully matched, prioritized, scored, and loaded <strong>{successCount} prospects</strong> into the CRM. You can now audit their layouts, generate sequential copywriting with Gemini, or manage client contracts in the Operational Ledger!
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-150 text-rose-800 rounded-xl mb-6 text-xs flex items-start gap-3 shadow-3xs" id="import-error-alert">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Processing Error</p>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {sourceData.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="unloaded-state-row">
          <div className="md:col-span-6 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-xl p-5" id="uploader-col">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 font-mono flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Option A: Upload export File
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Choose any standard export CSV or JSON document saved from your local scrapers or subscription software.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center bg-white cursor-pointer transition-colors"
            >
              <Upload className="w-10 h-10 text-slate-405 text-slate-400 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-800">Click to Select CSV or JSON Document</p>
              <p className="text-[10px] text-slate-450 mt-1">Supports UTF-8 formats (up to 50MB)</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.json"
                className="hidden"
                id="internal-picker"
              />
            </div>
          </div>

          <div className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5" id="pasteboard-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 font-mono flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-purple-600" /> Option B: Raw Paste Panel
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Clipboard paste your raw comma-separated lists or JSON structures directly. We handle standard line resolutions.
            </p>

            <form onSubmit={handleTextSubmit} className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="BusinessName,Website,Category,Country,City&#10;Kyoto Orthodontics,http://kyotodent.jp,Dentist,Japan,Kyoto&#10;London Bakery,http://londonbake.co.uk,Bakery,UK,London"
                className="w-full h-36 bg-white border border-slate-205 focus:border-teal-500 focus:outline-none rounded-lg p-2.5 text-[11px] font-mono text-slate-700"
                id="raw-import-textarea"
              />
              <button
                type="submit"
                disabled={!pasteText.trim()}
                className="w-full py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                id="raw-paste-submit-btn"
              >
                <span>Process Raw Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in" id="loaded-mapper-view">
          {/* Mapping Grid System */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500 animate-spin" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Schema Connection Drawer
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Source list file contains: <strong>{headers.length} headers</strong> / <strong>{sourceData.length} entries</strong>
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              We parsed the file: <span className="font-mono bg-white border px-1.5 py-0.5 rounded font-bold text-teal-700 text-[11px]">{fileName}</span>. Connect the CRM columns on the left with your raw file's headers on the dropdown selectors. Missing non-essential mappings will import as blanks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {targetFields.map(f => (
                <div key={f.key} className="bg-white border border-slate-200 p-2.5 rounded-lg flex flex-col justify-between shadow-3xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                      {f.label}
                      <HelpCircle className="w-3 h-3 text-slate-405 text-slate-400" title={f.desc} />
                    </label>
                    <p className="text-[9.5px] text-slate-450 mt-0.5 truncate">{f.desc}</p>
                  </div>
                  
                  <select
                    value={mappings[f.key]}
                    onChange={(e) => handleMappingChange(f.key, e.target.value)}
                    className={`w-full mt-2 border text-[11px] rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      f.required && !mappings[f.key]
                        ? "border-rose-300 bg-rose-50/20 text-rose-700"
                        : "border-slate-200 bg-slate-50 text-slate-705"
                    }`}
                  >
                    <option value="">[ Leave Blank / Skip ]</option>
                    {headers.map(h => (
                      <option key={h} value={h}>
                        {h} {mappings[f.key] === h ? "⭐️" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Mapped Data Preview Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Raw Record Mapping Preview (First 3 entries)
              </span>
              <span className="text-[10px] uppercase font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-150">
                CRM Preview Matrix
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600 font-medium">
                <thead className="bg-slate-50/60 text-[10px] text-slate-500 uppercase font-mono border-b border-slate-150">
                  <tr>
                    <th className="px-5 py-3">#</th>
                    <th className="px-4 py-3">Business Name</th>
                    <th className="px-4 py-3">Primary Website</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Niche Category</th>
                    <th className="px-4 py-3">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedPreview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="px-5 py-3.5 font-bold font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {item.BusinessName || <span className="text-rose-600 font-bold font-mono">[ Missing field ]</span>}
                      </td>
                      <td className="px-4 py-3.5 text-indigo-700 font-mono truncate max-w-44">{item.Website || "—"}</td>
                      <td className="px-4 py-3.5 font-mono">{item.Email || "—"}</td>
                      <td className="px-4 py-3.5 font-mono">{item.Phone || "—"}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-500">{item.Category || "—"}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-500">{item.Country || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSourceData([]);
                setHeaders([]);
                setFileName("");
              }}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Reset Importer
            </button>
            <button
              onClick={executeImport}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/15"
              id="confirm-b2b-import-btn"
            >
              <Plus className="w-4 h-4 text-teal-100" />
              <span>Process and Inject {sourceData.length} CRM Prospects</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
