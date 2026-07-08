import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set body limit for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy initializer for Gemini API to prevent crash on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment secrets. Please configure it in AI Studio Settings > Secrets.");
    }
    // Set custom User-Agent for telemetry as required
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Ensure the response is always robust and properly structured
const MODEL_NAME = "gemini-3.5-flash";

// Helper function to call generateContent with a list of fallback models
async function generateContentWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
  }
) {
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ];

  let lastError: any = null;
  for (const model of modelsToTry) {
    try {
      console.log(`[People's Priorities AI] Attempting generateContent with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (error: any) {
      console.warn(`[People's Priorities AI] Model ${model} failed with error:`, error.message || error);
      lastError = error;
    }
  }
  throw lastError || new Error("All model attempts failed");
}

// API: Vision and Planning Agent to analyze development suggestions
app.post("/api/ai/analyze-image", async (req, res) => {
  try {
    const { image, description, category, title, expectedImpact } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const ai = getGemini();

    // The image comes as a base64 string, potentially prefixed with data url header
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
You are the People's Priorities AI Multi-Agent Civic Intelligence Engine. 
Analyze this uploaded image of a local area, combined with the citizen's development suggestion title, description, and chosen category.

Citizen Suggestion Title: "${title || "Unspecified Development"}"
Citizen Category Choice: "${category || "Unspecified"}"
Citizen Description: "${description || "No description provided"}"
Expected Impact: "${expectedImpact || "No impact description provided"}"

Perform the following tasks:
1. Act as the **Feedback & Vision Agent**: Analyze the visual evidence (e.g., muddy path representing road needs, vacant plot representing park/school needs, rusty handpump representing water needs).
2. Act as the **Priority & Impact Agent**: Evaluate the urgency/priority ('low', 'medium', 'high', 'critical') and estimate the number of direct beneficiaries (e.g. 500, 1500, 10000) based on category and description.
3. Act as the **Planning Agent**: Determine the specific Development Need (e.g., "School Upgrade", "Road Paving", "Clean Water Filtration", "PHC Upgrade", "Community Library") and the primary department responsible.
4. Generate an objective, detailed explanation ('reasoning') justifying why this project is prioritized, what visual gap is verified in the photo, and why it is critical for the expected beneficiaries.

Output your response STRICTLY as a valid JSON object with the following fields:
{
  "category": "Broad category, e.g., Education, Roads, Water, Healthcare, Sanitation, Public Safety, Library",
  "developmentNeed": "Specific project type, e.g. School Upgrade, Road Paving, PHC Upgrade",
  "priority": "low" | "medium" | "high" | "critical",
  "expectedBeneficiaries": 100 to 50000,
  "department": "Name of responsible department, e.g. Education Dept, Public Works Dept, Health & Family Welfare, Water Board",
  "estimatedDays": 30-180,
  "reasoning": "Explainable AI justification for priority based on community demand, visual gaps, and beneficiaries.",
  "confidence": 0.0-1.0
}

Return ONLY the raw JSON object, without any markdown formatting wrappers (like \`\`\`json ... \`\`\`), backticks, or extra commentary. It must parse cleanly.
`;

    const response = await generateContentWithFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "";
    // Clean potential markdown leftovers
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);

    res.json({ success: true, analysis: result });
  } catch (error: any) {
    console.error("Vision Agent Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to analyze image",
      fallbackAnalysis: {
        category: req.body.category || "General",
        developmentNeed: req.body.title || "Infrastructure Project",
        priority: "medium",
        expectedBeneficiaries: 1200,
        department: "Public Works Dept",
        estimatedDays: 90,
        reasoning: "AI analysis was skipped due to temporary service availability. Default community impact values applied.",
        confidence: 0.5
      }
    });
  }
});

// API: Cluster Agent to check for similar/duplicate development suggestions
app.post("/api/ai/validate-duplicate", async (req, res) => {
  try {
    const { currentReport, existingReports } = req.body;
    if (!currentReport || !existingReports || !Array.isArray(existingReports)) {
      return res.status(400).json({ error: "Missing reports data" });
    }

    if (existingReports.length === 0) {
      return res.json({ isDuplicate: false, duplicates: [] });
    }

    const ai = getGemini();

    const prompt = `
You are the People's Priorities AI Cluster Agent. Your goal is to detect similar development suggestions in the same constituency or ward to prevent duplicate projects, cluster ideas, and guide citizens to vote on existing proposals.

New Proposal Description: "${currentReport.description}"
New Proposal Category: "${currentReport.category}"
New Proposal Title: "${currentReport.title || ""}"

Here is a list of existing nearby proposals:
${existingReports.map((r, i) => `${i + 1}. ID: ${r.id}, Title: "${r.title || ""}", Category: ${r.category}, Status: ${r.status}, Description: "${r.description}"`).join("\n")}

Compare the new suggestion with each existing suggestion. Determine if any of them are asking for the same physical development project (e.g. "Upgrading the primary school in village X", "Paving the sector 4 road").
If a clear match or closely related project is found, recommend which Project ID it should be clustered with and justify your decision (which helps citizens co-sign/vote instead of fragmenting the demand).

Output your response STRICTLY as a valid JSON object with the following fields:
{
  "isDuplicate": true | false,
  "matchReportId": "ID of the existing project that this matches, or null if none",
  "confidence": 0.0-1.0,
  "reason": "Brief, helpful explanation of why they cluster together or why they are distinct development needs"
}

Return ONLY the raw JSON object, without markdown wrappers. It must parse cleanly.
`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanedText = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Validation Agent Error:", error);
    res.json({ success: false, result: { isDuplicate: false, matchReportId: null, confidence: 0, reason: "Duplicate detection skipped due to server error." } });
  }
});

// API: AI Assistant Chat Interface
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, chatHistory, reportsContext } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing user message" });
    }

    const ai = getGemini();

    const systemInstruction = `
You are the **People's Priorities AI Civic Planner & Constituency Companion** (also known as People's Priorities AI 2.0).
Your mission is to empower citizens and local representatives (MPs, MLAs, municipal planners) with real-time planning data, budget recommendations, proposal summaries, and comparative analysis of infrastructure demands.

Always reply in the user's preferred language (English, Hindi, Marathi, Tamil, Bengali). Respond natively, warmly, and objectively.

### Core Capabilities & Response Guidelines:

1. 🗳 **Constituency Priority & Budget Chat:**
   - Summarize, compare, and analyze user development requests (roads, schools, water, healthcare).
   - If asked "Which village needs a school first?" or "Compare Road vs Hospital", read the current dataset and provide a data-driven justification based on direct beneficiaries, urgency, and citizen support votes.
   - If asked for a budget recommendation (e.g., "Recommend projects for ₹50 lakh or ₹2 Crore budget"), suggest an optimal allocation split (e.g. Roads: 40%, School: 30%, Water: 20%, Health: 10%) by referencing the most supported proposals.

2. 📊 **Grounding with Active Development Proposals:**
   - Below is the current list of crowd-sourced development suggestions and community priority rankings:
     ${JSON.stringify(reportsContext || [], null, 2)}
   - When a user asks about suggestions or priorities (e.g. "what are the top citizen priorities?", "summarize water requests"), search and query this context list.
   - Provide concrete counts, highlight specific high-vote or critical-priority projects, and cite active locations.

3. 🏫 **Aesthetic & Structural Responses:**
   - Use beautiful headers, comparison tables, bullet lists, and bold text for visual clarity.
   - Keep answers professional, practical, and constructive. Avoid political bias; focus purely on community welfare, direct beneficiaries, and infrastructure gap optimization.
`;

    // Construct the Gemini chat contents array
    const contents: any[] = [];
    
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const turn of chatHistory) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.content }]
        });
      }
    }
    
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithFallback(ai, {
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    res.json({ success: true, reply: response.text || "No reply generated." });
  } catch (error: any) {
    console.error("AI Chat Assistant Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to process chat",
      reply: "Hello, I am having trouble connecting to my cognitive processing engine. Please ensure your GEMINI_API_KEY is properly set in Secrets."
    });
  }
});

// API: Analytics Agent for predictive hotspots and AI Budget Planner
app.post("/api/ai/generate-analytics", async (req, res) => {
  try {
    const { reports } = req.body;
    if (!reports || !Array.isArray(reports)) {
      return res.status(400).json({ error: "Missing reports list" });
    }

    const ai = getGemini();

    const prompt = `
You are the People's Priorities AI Analytics Agent. Provide high-level constituency optimization summaries, hotspot predictions, and data-driven budget recommendations.

Here is the full dataset of crowd-sourced citizen development suggestions:
${JSON.stringify(reports.map(r => ({
  category: r.category,
  status: r.status,
  priority: r.priority,
  date: r.date,
  ward: r.ward,
  votesCount: r.votesCount || 0,
  expectedBeneficiaries: r.expectedBeneficiaries || 500
})), null, 2)}

Provide an automated municipal intelligence dispatch report in JSON format with:
1. "dailySummary": A concise 2-sentence executive summary of the state of constituency development ideas.
2. "weeklyTrendsSummary": A summary of citizen engagement, top categories requested, and public consensus growth.
3. "predictionsSummary": Predictive analysis of the highest infrastructure gaps (e.g. which villages are at highest risk of transport disconnect or educational deprivation based on current suggestion volume and beneficiary counts).
4. "recommendations": A list of 3 structured resource allocation recommendations for the constituency planning board. Each recommendation must have:
   - "title": string (e.g., "Install Solar Water Filtration Units in Ward-3")
   - "description": string (e.g., "Due to 4 different citizen suggestions with over 150 aggregate votes")
   - "department": string
   - "priority": "low" | "medium" | "high"
5. "budgetAllocation": A JSON object representing recommended percentage splits of a ₹2 Crore development fund across categories based on the suggestions. The keys must be categories (e.g. "Roads", "Schools", "Water", "Healthcare", "Safety") and values must be numbers representing percentages that add up to 100.

Output STRICTLY as a valid JSON object matching these instructions, without any markdown formatting wrappers.
`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const cleanedText = (response.text || "").replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedText);

    res.json({ success: true, analytics: result });
  } catch (error: any) {
    console.error("Analytics Agent Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate AI analytics",
      fallbackAnalytics: {
        dailySummary: "Constituency participation is expanding. Citizens are focusing on educational upgrades and road paving requests.",
        weeklyTrendsSummary: "Water supply security and street lighting demand are seeing the steepest incline in community endorsement.",
        predictionsSummary: "Ward-4 and Ward-1 are projected to face the most acute infrastructure pressure if schooling facilities aren't expanded soon.",
        recommendations: [
          {
            title: "Pave the Rural Highway Corridor",
            description: "Cluster 4 active road complaints to connect Ward-4 with the central market, benefiting 12,000 residents.",
            department: "Public Works Dept",
            priority: "high"
          },
          {
            title: "Upgrade Primary Health Center (PHC) Beds",
            description: "Establish 5 emergency observation beds at Ward-2 PHC to cater to nearby villages.",
            department: "Health & Family Welfare",
            priority: "medium"
          },
          {
            title: "Install Solar Streetlights near PHC and Schools",
            description: "Install solar panels and LED lamps to improve nighttime safety for women and children.",
            department: "Electricity Board",
            priority: "high"
          }
        ],
        budgetAllocation: {
          "Roads": 40,
          "Schools": 30,
          "Water": 18,
          "Healthcare": 12
        }
      }
    });
  }
});

// Serve frontend assets and listen
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`People's Priorities AI server running on http://localhost:${PORT}`);
  });
}

bootstrap();
