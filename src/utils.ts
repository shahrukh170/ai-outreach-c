/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LeadRaw, LeadAnalysis, UserConfig, ProcessedLead } from './types';

export const DEFAULT_USER_CONFIG: UserConfig = {
  name: "Syed Shahrukh Anwar",
  location: "Abbottabad, Pakistan",
  email: "shahrukh17070@gmail.com",
  phone: "+92 312 3456789", // Placeholder for actual, safe to customize
  whatsapp: "+92 312 3456789",
  payoneer: "shahrukh17070@gmail.com",
  bankDetails: "Meezan Bank Ltd, Abbottabad Branch, Account No: [Insert Bank Details When Sending Invoice]",
  customTextPrompt: `Focus on highlighting clear, observed problems from our audits, and emphasize how resolving these issues will deliver:
1. More Customers
2. More Leads
3. More Revenue
4. More Visibility
5. Better Online Presence

Keep the tone highly professional, friendly, personalized, and non-spammy. Never sound automated. Always offer a clear call to action (like a 15-minute call or a free audit).`
};

export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let row: string[] = [""];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }

  if (lines.length === 0) return [];

  // Filter out completely empty rows
  const cleanLines = lines.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ""));
  if (cleanLines.length < 2) return [];

  const headers = cleanLines[0].map(h => h.trim());
  const dataRows = cleanLines.slice(1);

  return dataRows.map(rowVals => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      let val = rowVals[index]?.trim() || "";
      // Strip outer quotes if any
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      if (header) {
        obj[header] = val;
      }
    });
    return obj;
  });
}

export function computeLeadScore(flags: {
  websiteOutdated: boolean;
  websiteBrokenLinks: boolean;
  websiteUnresponsive: boolean;
  noFacebook: boolean;
  noInstagram: boolean;
  noSEO: boolean;
  noSSL: boolean;
  inactiveSocialMedia: boolean;
  multipleLocations: boolean;
  reviewsExceed100: boolean;
  businessAppearsAbandoned: boolean;
}): { score: number; priority: 'HOT' | 'WARM' | 'COLD'; breakdown: string[] } {
  let score = 30; // Base Score
  const breakdown: string[] = ["Base Score: +30"];

  if (flags.websiteOutdated) { score += 10; breakdown.push("Website Outdated (websiteOutdated): +10"); }
  if (flags.websiteBrokenLinks) { score += 5; breakdown.push("Broken Links (websiteBrokenLinks): +5"); }
  if (flags.websiteUnresponsive) { score += 10; breakdown.push("Unresponsive layout (websiteUnresponsive): +10"); }
  if (flags.noFacebook) { score += 5; breakdown.push("Missing Facebook presence (noFacebook): +5"); }
  if (flags.noInstagram) { score += 5; breakdown.push("Missing Instagram presence (noInstagram): +5"); }
  if (flags.noSEO) { score += 15; breakdown.push("No/Poor SEO elements (noSEO): +15"); }
  if (flags.noSSL) { score += 10; breakdown.push("Insecure URL/No SSL (noSSL): +10"); }
  if (flags.inactiveSocialMedia) { score += 10; breakdown.push("Inactive Social accounts (inactiveSocialMedia): +10"); }
  if (flags.multipleLocations) { score += 20; breakdown.push("Multiple Locations Audit Flag (multipleLocations): +20"); }

  // Cap at 100 before bonuses/penalties
  score = Math.min(100, score);

  if (flags.reviewsExceed100) {
    const bonus = Math.round(score * 0.1);
    score += bonus;
    breakdown.push(`High reviews count (>100) (+10% Bonus): +${bonus}`);
  }

  if (flags.businessAppearsAbandoned) {
    const penalty = Math.round(score * 0.3);
    score -= penalty;
    breakdown.push(`Business Appears Abandoned (-30% Penalty): -${penalty}`);
  }

  score = Math.max(0, Math.min(100, score));

  let priority: 'HOT' | 'WARM' | 'COLD' = 'COLD';
  if (score >= 75) {
    priority = 'HOT';
  } else if (score >= 50) {
    priority = 'WARM';
  }

  return { score, priority, breakdown };
}

// Convert flags or Notes/Reviews text to initial boolean states intelligently
export function extractInitialFlags(raw: LeadRaw): {
  websiteOutdated: boolean;
  websiteBrokenLinks: boolean;
  websiteUnresponsive: boolean;
  noFacebook: boolean;
  noInstagram: boolean;
  noSEO: boolean;
  noSSL: boolean;
  inactiveSocialMedia: boolean;
  multipleLocations: boolean;
  reviewsExceed100: boolean;
  businessAppearsAbandoned: boolean;
} {
  const isTr = (v: string | undefined) => {
    if (!v) return false;
    const l = v.toLowerCase().trim();
    return l === 'true' || l === 'yes' || l === '1' || l === 'y';
  };

  const isFl = (v: string | undefined) => {
    if (!v) return false;
    const l = v.toLowerCase().trim();
    return l === 'false' || l === 'no' || l === '0' || l === 'n';
  };

  // Check if properties exist in CSV explicitly as columns
  const websiteOutdated = isTr(raw.websiteOutdated) || (raw.Notes ? /outdated|old website/i.test(raw.Notes) : false);
  const websiteBrokenLinks = isTr(raw.websiteBrokenLinks) || (raw.Notes ? /broken link|404/i.test(raw.Notes) : false);
  const websiteUnresponsive = isTr(raw.websiteUnresponsive) || (raw.Notes ? /mobile unfriendly|unresponsive|not responsive/i.test(raw.Notes) : false);
  
  // Facebook
  let noFacebook = false;
  if (raw.FacebookURL !== undefined) {
    noFacebook = raw.FacebookURL.trim() === "" || isFl(raw.noFacebook);
  } else {
    noFacebook = isTr(raw.noFacebook) || (raw.Notes ? /no facebook/i.test(raw.Notes) : false);
  }

  // Instagram
  let noInstagram = false;
  if (raw.InstagramURL !== undefined) {
    noInstagram = raw.InstagramURL.trim() === "" || isFl(raw.noInstagram);
  } else {
    noInstagram = isTr(raw.noInstagram) || (raw.Notes ? /no instagram/i.test(raw.Notes) : false);
  }

  // SEO
  const noSEO = isTr(raw.noSEO) || (raw.Notes ? /no seo|poor seo|missing tags/i.test(raw.Notes) : false);
  
  // SSL
  let noSSL = isTr(raw.noSSL);
  if (raw.Website) {
    if (raw.Website.startsWith("http://")) noSSL = true;
  }

  // Inactive Social
  const inactiveSocialMedia = isTr(raw.inactiveSocialMedia) || (raw.LastSocialActivity ? /years ago|months ago|2023|2022|inactive/i.test(raw.LastSocialActivity) : false);
  
  // Multiple locations
  const multipleLocations = isTr(raw.multipleLocations) || (raw.Notes ? /multiple stores|multiple locations|branches/i.test(raw.Notes) : false);

  // Reviews count
  let reviewsExceed100 = false;
  if (raw.Reviews) {
    const revCount = parseInt(raw.Reviews.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(revCount) && revCount > 100) {
      reviewsExceed100 = true;
    }
  }

  // Abandoned business
  const businessAppearsAbandoned = raw.Notes ? /abandoned|permanently closed|closed down/i.test(raw.Notes) : false;

  return {
    websiteOutdated,
    websiteBrokenLinks,
    websiteUnresponsive,
    noFacebook,
    noInstagram,
    noSEO,
    noSSL,
    inactiveSocialMedia,
    multipleLocations,
    reviewsExceed100,
    businessAppearsAbandoned
  };
}

export function generateCSVExportString(processedLeads: ProcessedLead[]): string {
  const headers = [
    "BusinessName",
    "Category",
    "Country",
    "Website",
    "Email",
    "Phone",
    "Lead Score",
    "Lead Priority",
    "Recommended Service",
    "Recommended Package",
    "Expected Revenue",
    "Cold Email",
    "WhatsApp Message",
    "Facebook Message",
    "LinkedIn Message",
    "Follow-up 1",
    "Follow-up 2",
    "Problems Found"
  ];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const clean = val.toString().replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = processedLeads.map(lead => {
    const analysis = lead.analysis;
    return [
      escapeCSV(lead.raw.BusinessName || ""),
      escapeCSV(lead.raw.Category || ""),
      escapeCSV(lead.raw.Country || ""),
      escapeCSV(lead.raw.Website || ""),
      escapeCSV(lead.raw.Email || ""),
      escapeCSV(lead.raw.Phone || ""),
      escapeCSV(lead.score || 0),
      escapeCSV(lead.priority || "COLD"),
      escapeCSV(analysis?.recommendedService || ""),
      escapeCSV(analysis?.recommendedPackage || ""),
      escapeCSV(analysis?.expectedRevenue || ""),
      escapeCSV(analysis?.coldEmail || ""),
      escapeCSV(analysis?.whatsApp || ""),
      escapeCSV(analysis?.facebook || ""),
      escapeCSV(analysis?.linkedIn || ""),
      escapeCSV(analysis?.followUp1 || ""),
      escapeCSV(analysis?.followUp2 || ""),
      escapeCSV(analysis?.problemsFound?.join(", ") || "")
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
