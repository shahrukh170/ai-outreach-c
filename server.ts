/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const PORT = 3000;

// Lazy initialized GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    // Fallback or explicit error
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      throw new Error("GEMINI_API_KEY is not configured or contains placeholder text. Please add/verify your key in the Secrets tab.");
    }
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAIClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));

  // Ground check for environment
  app.get("/api/env-check", (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const isSet = !!apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "";
    res.json({
      geminiApiKeyConfigured: isSet,
      appUrl: process.env.APP_URL || "Local Dev Mode"
    });
  });

  // Lead Analysis and Outreach Generation API
  app.post("/api/analyze-lead", async (req: Request, res: Response): Promise<void> => {
    try {
      const { lead, flags, userConfig } = req.body;
      if (!lead || !userConfig) {
         res.status(400).json({ error: "Missing lead or userConfig in request body." });
         return;
      }

      const ai = getGenAI();

      // Formulate detailed system prompt instructing Gemini on how to audit
      // and generate the customized outreach sequence in human, non-spammy style.
      const systemInstruction = `You are an elite, world-class AI Business Development Manager, Sales Consultant, Lead Generation Specialist, Digital Marketing Specialist, Website Development Consultant, SEO Consultant, Social Media Consultant, and Automation Specialist.
Your mission is to perform a detailed audit of the provided business lead, identify critical digital presence problems, recommend services, and generate a hyper-personalized, ultra-high converting multi-channel outreach messaging package on behalf of Syed Shahrukh Anwar, who operates out of Abbottabad, Pakistan.

Here is the Consultant's Profile (Syed Shahrukh Anwar):
- Name: ${userConfig.name}
- Location: ${userConfig.location}
- Email: ${userConfig.email}
- Phone/WhatsApp: ${userConfig.whatsapp}
- Payment / Invoicing details: Payoneer (${userConfig.payoneer}), Bank Transfer (${userConfig.bankDetails})

Available Services & Pricing Categories:
1. WEBSITE DEVELOPMENT:
   - Starter Website: USD 299
   - Business Website: USD 599
   - Premium Website: USD 999
2. SEO SERVICES:
   - Starter SEO: USD 99/month
   - Growth SEO: USD 199/month
   - Business SEO: USD 399/month
3. SOCIAL MEDIA MANAGEMENT:
   - Starter SMM: USD 79/week
   - Professional SMM: USD 199/week
   - Business SMM: USD 399/week
4. AI AUTOMATION:
   - Basic: USD 199
   - Professional: USD 499
   - Enterprise: Custom
5. VIRTUAL PROGRAMMING ASSISTANT:
   - 10 Hours Monthly: USD 149/month
   - 25 Hours Monthly: USD 349/month
   - 50 Hours Monthly: USD 699/month

MESSAGING RULES AND VOICE:
- Never sound automated, robotic, or spammy. Keep the style natural, engaging, custom-tailored, and authentic.
- Reference the Business Name, Industry/Category, and Country.
- Clearly, tactfully highlight 2-3 specific observed weaknesses (e.g. sluggish loading, outdated design, missing lead generation form, lack of organic SEO rank, missing SSL, quiet/unlinked social accounts, or no reviews response).
- Directly relate improvements to concrete business metrics Syed can solve: More Customers, More Leads, More Revenue, Better Visibility, and a Premium Online Presence.
- End outreach messages with a warm, humble Call To Action (e.g. "Would you be available for a quick 15-minute call?", "Can I prepare a free detailed website audit for you?", or "May I show you how similar businesses are increasing their leads online?").
- Include payment/invoice details ONLY in the proposal summary, explaining that he can pay via Payoneer or bank transfer once they request a formal quotation.

BONUS DIRECTION CONSTRAINTS:
- No Website -> Prioritize Website Development services (Starter $299 or Business $599).
- Website exists but looks outdated -> Prioritize Redesign + SEO.
- Business has active socials but weak website -> Prioritize SEO + Conversion/Lead Capture optimization.
- If they have no Facebook or Instagram, recommend a bite-sized Social Media Management starter.

Please perform the audit and write the outreach documents according to this guide. Return the result in the specified JSON schema.`;

      // Formulate user payload to analyze
      const leadPrompt = `Please analyze this business lead:
Business Details:
- Business Name: ${lead.BusinessName || "N/A"}
- Category/Industry: ${lead.Category || "Local Business"}
- Country: ${lead.Country || "Global"}
- City: ${lead.City || ""}
- Website: ${lead.Website || "None"}
- Owner/Contact Name: ${lead.OwnerName || lead.ContactName || "Business Owner"}
- Rating: ${lead.Rating || "N/A"}
- Reviews Count: ${lead.Reviews || "N/A"}
- Last Social Activity: ${lead.LastSocialActivity || "N/A"}
- Notes: ${lead.Notes || "None"}

Specific Pre-computed Audit Flags for this Lead:
- Website is Outdated: ${flags.websiteOutdated ? 'Yes' : 'No'}
- Broken Links found: ${flags.websiteBrokenLinks ? 'Yes' : 'No'}
- Unresponsive/bad mobile rendering: ${flags.websiteUnresponsive ? 'Yes' : 'No'}
- Missing Facebook Presence: ${flags.noFacebook ? 'Yes' : 'No'}
- Missing Instagram Presence: ${flags.noInstagram ? 'Yes' : 'No'}
- Missing/Poor SEO indexing tags: ${flags.noSEO ? 'Yes' : 'No'}
- Missing security SSL (http): ${flags.noSSL ? 'Yes' : 'No'}
- Social Media accounts inactive: ${flags.inactiveSocialMedia ? 'Yes' : 'No'}
- Multiple locations operated: ${flags.multipleLocations ? 'Yes' : 'No'}
- Total Google Reviews count exceeds 100: ${flags.reviewsExceed100 ? 'Yes' : 'No'}
- Appears abandoned/inactive: ${flags.businessAppearsAbandoned ? 'Yes' : 'No'}

Consultant Tone and Style Directives:
${userConfig.customTextPrompt}

Perform website analysis, market potential review, identify problems, select the recommended package, and generate all outreach content including Cold Email, WhatsApp message, Facebook/LinkedIn messages, Follow-up sequence, and Proposal Summary. Ensure a single cohesive response matching the schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: leadPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              websiteQuality: { type: Type.STRING, description: "Detailed summary of website quality, style, conversion speed and first impressions." },
              seoStatus: { type: Type.STRING, description: "Detailed check on local, technical, or content SEO gaps." },
              socialPresence: { type: Type.STRING, description: "Detailed summary of social links activity levels." },
              marketPotential: { type: Type.STRING, description: "Analysis of market potential for lead category in their city/country." },
              problemsFound: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of found checklist errors/problems."
              },
              recommendedService: {
                type: Type.STRING,
                description: "Must be exactly one of: 'Website Development', 'SEO', 'Social Media Management', 'AI Automation', or 'Virtual Programming Assistant'."
              },
              recommendedPackage: { type: Type.STRING, description: "Package name and exact pricing selected from guidelines (e.g. Business Website (USD 599))" },
              expectedRevenue: { type: Type.STRING, description: "Exact pricing text (e.g. USD 599 or USD 199/month)" },
              revenueVal: { type: Type.NUMBER, description: "Numeric revenue for CRM dashboards" },
              isRecurring: { type: Type.BOOLEAN, description: "True if weekly/monthly recurring, False if single project" },
              
              coldEmail: { type: Type.STRING, description: "Tailored cold email with attractive subject line and clear personalized opener" },
              followUp1: { type: Type.STRING, description: "Friendly follow up email #1 reinforcing value & revenue" },
              followUp2: { type: Type.STRING, description: "Follow up email #2 offering a free website/SEO audit" },
              whatsApp: { type: Type.STRING, description: "Brief, punchy WhatsApp message with clear CTA" },
              facebook: { type: Type.STRING, description: "Facebook Messenger outreach optimized for speed" },
              linkedIn: { type: Type.STRING, description: "Professional LinkedIn message targeting owner/manager" },
              youtubeCreator: { type: Type.STRING, description: "Creator/influencer or general video audit proposing specific improvements" },
              proposalSummary: { type: Type.STRING, description: "Summary proposal structure with billing terms, Payoneer and and bank wire details" },
              meetingRequest: { type: Type.STRING, description: "Calendar appointment request pitch" }
            },
            required: [
              "websiteQuality", "seoStatus", "socialPresence", "marketPotential", "problemsFound",
              "recommendedService", "recommendedPackage", "expectedRevenue", "revenueVal", "isRecurring",
              "coldEmail", "followUp1", "followUp2", "whatsApp", "facebook", "linkedIn", "youtubeCreator",
              "proposalSummary", "meetingRequest"
            ]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response received from Gemini.");
      }

      const parsedResult = JSON.parse(resultText.trim());
      res.json(parsedResult);
    } catch (apiError: any) {
      console.error("Gemini Lead Analysis API error:", apiError);
      res.status(500).json({ error: apiError?.message || "Failed to analyze lead. Please check server logs." });
    }
  });

  // Client-Side static hosting routing/Vite setup
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev middleware active...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Lead Outreach & Audit System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server bootstrap error:", error);
});
