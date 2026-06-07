/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LeadRaw {
  id: string;
  BusinessName?: string;
  OwnerName?: string;
  ContactName?: string;
  Category?: string;
  Country?: string;
  City?: string;
  Address?: string;
  Website?: string;
  Email?: string;
  Phone?: string;
  WhatsApp?: string;
  FacebookURL?: string;
  InstagramURL?: string;
  LinkedInURL?: string;
  YouTubeURL?: string;
  GoogleMapsURL?: string;
  Rating?: string;
  Reviews?: string;
  LastSocialActivity?: string;
  Notes?: string;
  
  // Custom manual flags from CSV
  websiteOutdated?: string;
  websiteBrokenLinks?: string;
  websiteUnresponsive?: string;
  noFacebook?: string;
  noInstagram?: string;
  noSEO?: string;
  noSSL?: string;
  inactiveSocialMedia?: string;
  multipleLocations?: string;
}

export interface LeadAnalysis {
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
  
  problemsFound: string[];
  websiteQuality: string;
  seoStatus: string;
  socialPresence: string;
  marketPotential: string;
  
  recommendedService: 'Website Development' | 'SEO' | 'Social Media Management' | 'AI Automation' | 'Virtual Programming Assistant';
  recommendedPackage: string;
  expectedRevenue: string; // e.g. "$199/month" or "$299"
  revenueVal: number; // For plotting and totals
  isRecurring: boolean; // Monthly/weekly recurring vs once-off
  
  coldEmail: string;
  followUp1: string;
  followUp2: string;
  whatsApp: string;
  facebook: string;
  linkedIn: string;
  youtubeCreator: string;
  proposalSummary: string;
  meetingRequest: string;
}

export interface ProcessedLead {
  id: string;
  raw: LeadRaw;
  status: 'pending' | 'processing' | 'done' | 'failed';
  error?: string;
  analysis?: LeadAnalysis;
  score?: number; // Calculated programmatically based on Syed's rules
  priority?: 'HOT' | 'WARM' | 'COLD'; // Calculated programmatically
  outreachStatus?: 'prospect' | 'cold_sent' | 'opened' | 'replied' | 'accepted' | 'invoiced' | 'paid';
  outreachStatusChangedAt?: string;
}

export interface LedgerEntry {
  id: string;
  leadId?: string;
  leadName: string;
  service: string;
  amount: number;
  status: 'pending' | 'paid';
  type: 'one-time' | 'recurring';
  date: string;
  paymentMethod: 'Payoneer' | 'Bank Wire' | 'Cash / Other';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'lead' | 'audit' | 'ledger' | 'outreach' | 'system';
  message: string;
}

export interface UserConfig {
  name: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  payoneer: string;
  bankDetails: string;
  customTextPrompt: string;
}
