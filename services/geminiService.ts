import { GoogleGenAI } from "@google/genai";
import { 
  StrategyData, DayPlan, DayDetail, CreativeData, AdsData, 
  CompetitorAudit, InsightMining, TrendPrediction,
  RepurposeCarousel, RepurposeInfographic, RepurposeVideoScript, RepurposeEmailSequence,
  KnowledgeData, TikTokScriptData, AdMetrics, AdAnalysis, RealityAnalysis, InfographicData
} from "../types";

// Helper to get current API Key
const getApiKey = () => {
  console.log("API Key Check:", !!import.meta.env.VITE_GEMINI_API_KEY);
  // 1. Prioritize LocalStorage (User Manual Override)
  const localKey = localStorage.getItem('GEMINI_API_KEY');
  if (localKey && localKey.trim().length > 0) {
      return localKey;
  }

  // 2. Fallback to Environment Variable
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const isEnvValid = envKey && envKey !== 'PLACEHOLDER_API_KEY' && !envKey.includes('YOUR_API_KEY');
  if (isEnvValid) {
      return envKey;
  }

  throw new Error("Vui lòng nhập API Key trong phần cài đặt (Nút chìa khóa ở menu trái).");
};

// Helper to get client instance with current key
const getAiClient = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

const MODEL_NAME = 'gemini-2.0-flash'; 
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';
const INFOGRAPHIC_MODEL = 'gemini-2.0-flash';

// --- ROBUST JSON PARSER ---
const parseResponse = (text: string | undefined) => {
  if (!text) throw new Error("Empty response from AI");
  
  try {
    // 1. Try cleaning Markdown code blocks
    const cleaned = text.replace(/```json\s*|\s*```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      // 2. Try finding the first '{' and last '}'
      const firstOpen = text.indexOf('{');
      const lastClose = text.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1) {
        const jsonSubstring = text.substring(firstOpen, lastClose + 1);
        return JSON.parse(jsonSubstring);
      }
    } catch (e2) {
        // ignore
    }
    console.error("Failed to parse JSON response:", text);
    throw new Error("AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
  }
};

// --- SYSTEM EXTENSION: MARKETING_BRAIN_V1 ---
const MARKETING_BRAIN_INSTRUCTIONS = `
  === MODULE: MARKETING_BRAIN_V1 (ACTIVE) ===
  STATUS: OPERATIONAL
  
  CORE PROCESSING RULES:
  1. 🛡️ VIETNAM CULTURAL CHECK (PRIORITY #1): 
     - Verify every strategy/content against Vietnamese cultural norms, taboos, and social context.
     - If a conflict is found, REJECT the standard advice and provide a culturally safe alternative.
  
  2. 🗣️ BRAND VOICE ENFORCEMENT (PRIORITY #3):
     - Strictly adhere to the tone defined in 'Vietnam_Content_Style' (if provided in UPLOADED KNOWLEDGE).
     - If undefined, default to: "Chuyên gia, Thân thiện, Thực tế" (Expert, Friendly, Practical).
  
  3. 🧠 LOGIC HIERARCHY:
     - Vietnam Market Insights > International Marketing Theory.
     - Local Trends > Global Trends.

  ERROR HANDLING:
  - If required knowledge files are missing in context, proceed with Google Gemini's general knowledge but prefix advice with: "[⚠️ Note: Using General Knowledge - Upload specific docs for better accuracy]".
  ===========================================
`;

// --- CONTEXT BUILDER ---
const buildContext = (knowledge?: KnowledgeData) => {
  if (!knowledge || !knowledge.isConfirmed) return "";
  
  const rules = knowledge.domainRules ? `DOMAIN RULES (EXPLICIT): "${knowledge.domainRules}"` : "";
  const uploadedDocs = knowledge.uploadedKnowledge ? `UPLOADED KNOWLEDGE BASE (CONTEXT): \n"${knowledge.uploadedKnowledge.substring(0, 30000)}..."\n(Use this uploaded knowledge to adapt tone, slang, and deep industry insights)` : "";
  const vaultDocs = knowledge.vaultContext ? `${knowledge.vaultContext}` : "";
  const visualStyle = knowledge.visualStyle ? `VISUAL AESTHETIC GUIDE: "${knowledge.visualStyle}"` : "";
  const videoStyle = knowledge.videoStyle ? `VIDEO EDITING STYLE: "${knowledge.videoStyle}"` : "";
  
  return `
    CRITICAL INSTRUCTION - INDUSTRY BRAIN ACTIVATED:
    You are an expert in the [${knowledge.industry}] industry.
    
    ${MARKETING_BRAIN_INSTRUCTIONS}
    
    ${uploadedDocs}
    ${vaultDocs}
    ${rules}
    ${visualStyle}
    ${videoStyle}
    
    If the DOMAIN RULES, UPLOADED KNOWLEDGE, or VAULT CONTEXT conflict with standard marketing advice, prioritize the user provided knowledge.
    Use terminology, tone, and psychology specific to ${knowledge.industry}.
  `;
};

// --- MULTIMEDIA ANALYSIS SERVICE ---
export const analyzeUploadedAsset = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAiClient();
  const isVideo = mimeType.startsWith('video/');
  
  const prompt = isVideo 
    ? `Analyze this video (focus on first 30s). Describe: 1. Pace (Fast/Slow). 2. Music Vibe/Audio Tone. 3. Voiceover style. 4. Visual Structure (Hook-Body-CTA). Keep it concise for a marketing brief.`
    : `Analyze this image. Describe: 1. Color Palette (Hex codes/Names). 2. Key Product Details. 3. Design Aesthetic (Minimalist/Luxury/Vintage/etc). 4. Vibe/Mood. Keep it concise for a creative brief.`;

  const rawData = base64Data.replace(/^data:(image|video)\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          { inlineData: { mimeType, data: rawData } },
          { text: prompt }
        ]
      }
    });

    return response.text || "Không thể phân tích nội dung này.";
  } catch (error) {
    console.error("Asset analysis failed:", error);
    throw new Error("Lỗi phân tích file. Đảm bảo file < 20MB và định dạng hỗ trợ.");
  }
};

// --- REALITY CHECK SERVICE V2.0 (BATCH PROCESSING) ---
export const analyzeRealityAssets = async (
  assetsBase64: string[],
  knowledge?: KnowledgeData
): Promise<RealityAnalysis> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  
  const parts: any[] = [];
  assetsBase64.forEach((asset, index) => {
      const rawData = asset.replace(/^data:image\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: rawData } });
      parts.push({ text: `[Asset #${index}]` });
  });

  const prompt = `
    ${context}
    Role: Senior Brand Auditor & Visual Strategist.
    Language: Vietnamese (Tiếng Việt).
    
    TASK: BATCH ASSET PROCESSING & BRAND SYNTHESIS.
    I have provided ${assetsBase64.length} images of a business.
    
    Output JSON (Keys in English, Values in Vietnamese):
    {
      "assetTags": [{"index": number, "type": "MENU/SPACE_DECOR/PRODUCT_SHOT/HUMAN/UNKNOWN", "description": "string"}],
      "priceSegment": "Bình dân/Trung cấp/Cao cấp",
      "detectedVibe": "string",
      "visualKey": "string",
      "brandColors": ["#Hex", "#Hex"],
      "gapAnalysis": "string",
      "adjustments": "string"
    }
  `;

  parts.push({ text: prompt });

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: { responseMimeType: "application/json" },
    });
    return parseResponse(response.text) as RealityAnalysis;
  } catch (error) {
    console.error("Reality analysis failed:", error);
    throw new Error("Không thể phân tích bộ ảnh. Vui lòng thử lại với ít ảnh hơn.");
  }
};


// --- SPY & RESEARCH SERVICES ---

export const analyzeCompetitor = async (content: string, knowledge?: KnowledgeData): Promise<CompetitorAudit> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Chuyên gia Phân tích Đối thủ.
    Language: Vietnamese.
    Task: Phân tích nội dung đối thủ.
    Content: "${content.substring(0, 5000)}"
    
    Output JSON:
    {
      "hookStrategy": "string",
      "weaknesses": "string",
      "attackOpportunities": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as CompetitorAudit;
};

export const mineInsights = async (comments: string, knowledge?: KnowledgeData): Promise<InsightMining> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Nhà Tâm lý học Hành vi.
    Language: Vietnamese.
    Task: Phân tích bình luận tìm Insight.
    Comments: "${comments.substring(0, 5000)}"
    
    Output JSON:
    {
      "hiddenPain": "string",
      "buyingBarriers": "string",
      "triggerWords": ["string", "string", "string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as InsightMining;
};

export const predictTrends = async (keyword: string, knowledge?: KnowledgeData): Promise<TrendPrediction> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Chuyên gia Dự báo Xu hướng.
    Language: Vietnamese.
    Task: Dự đoán xu hướng cho: "${keyword}".
    
    Output JSON:
    {
      "upcomingTrends": ["string"],
      "debateTopics": ["string"],
      "contentIdeas": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as TrendPrediction;
};

// --- CONTENT REPURPOSING SERVICES ---

export const repurposeToCarousel = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeCarousel> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Content Creator.
    Language: Vietnamese.
    Task: Chuyển đổi thành Slide Instagram (8-10 slides).
    Source: "${content.substring(0, 8000)}"
    
    Output JSON:
    {
      "slides": [
        {"slideNumber": 1, "content": "string", "visualSuggestion": "string"}
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as RepurposeCarousel;
};

export const repurposeToInfographic = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeInfographic> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Visual Data Designer.
    Language: Vietnamese.
    Task: Ý tưởng Infographic.
    Source: "${content.substring(0, 8000)}"

    Output JSON:
    {
      "title": "string",
      "keyPoints": ["string"],
      "layoutSuggestion": "string",
      "iconSuggestions": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as RepurposeInfographic;
};

export const repurposeToVideoScript = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeVideoScript> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: TikTok Scriptwriter.
    Language: Vietnamese.
    Task: Kịch bản video ngắn 60s.
    Source: "${content.substring(0, 8000)}"

    Output JSON:
    {
      "hookVisual": "string",
      "scriptBody": "string",
      "cta": "string",
      "productionNotes": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as RepurposeVideoScript;
};

export const repurposeToEmailSequence = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeEmailSequence> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Email Marketer.
    Language: Vietnamese.
    Task: Chuỗi 3 email.
    Source: "${content.substring(0, 8000)}"

    Output JSON:
    {
      "email1": {"subject": "string", "body": "string"},
      "email2": {"subject": "string", "body": "string"},
      "email3": {"subject": "string", "body": "string"}
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as RepurposeEmailSequence;
};


// --- MEDIA GENERATION SERVICES ---

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '1:1' } },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/jpeg';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVideo = async (imageBase64: string, prompt: string): Promise<string> => {
  const ai = getAiClient();
  const rawBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  
  try {
    const enhancedPrompt = `Cinematic 4k shot, highly detailed, photorealistic, 35mm film look. Smooth camera movement, professional lighting, depth of field. ${prompt}. High quality, masterpiece, 8k resolution.`;
    
    let operation = await ai.models.generateVideos({
      model: VEO_MODEL,
      prompt: enhancedPrompt,
      image: { imageBytes: rawBase64, mimeType: 'image/jpeg' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video URI returned");

    const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
    if (!response.ok) throw new Error("Failed to download video file");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

export const generateKOLImage = async (dnaBase64: string, userPrompt: string, kolDesc: string): Promise<string> => {
  const ai = getAiClient();
  
  const fullPrompt = `
    Generate a photorealistic, 8k, highly detailed image of a person based on the provided reference image (this is the 'DNA' of the character).
    CHARACTER DETAILS: ${kolDesc}
    SCENE / ACTION: ${userPrompt}
    STYLE: Photorealistic, cinematic lighting, professional photography, high resolution.
    CRITICAL: Maintain the facial features and identity of the reference person as closely as possible.
  `;

  const rawData = dnaBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { 
        parts: [
            { inlineData: { mimeType: 'image/jpeg', data: rawData } },
            { text: fullPrompt }
        ] 
      },
      config: { imageConfig: { aspectRatio: '1:1' } },
    });

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/jpeg';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned for KOL generation");
  } catch (error) {
    console.error("KOL generation failed:", error);
    throw error;
  }
};

// --- TEXT GENERATION SERVICES ---

export const generateStrategy = async (productInfo: string, knowledge?: KnowledgeData, realityContext?: RealityAnalysis): Promise<StrategyData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  
  let realityInstruction = "";
  if (realityContext) {
      realityInstruction = `
        REALITY CHECK ACTIVATED:
        - Detected Price Segment: ${realityContext.priceSegment}
        - Detected Vibe: ${realityContext.detectedVibe}
        - Gap Analysis: ${realityContext.gapAnalysis}
        - REQUIRED ADJUSTMENT: ${realityContext.adjustments}
        INSTRUCTION: Ensure Persona/USP align with REALITY.
      `;
  }

  const prompt = `
    ${context}
    Role: Chiến lược gia Marketing Cấp cao.
    Language: Vietnamese.
    Task: Chiến lược cốt lõi.
    Product Input: "${productInfo}"
    ${realityInstruction}

    Output JSON:
    {
      "persona": "string",
      "usp": "string",
      "angles": ["string", "string", "string"]
    }
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return parseResponse(response.text) as StrategyData;
};

export const generateCalendarOverview = async (strategy: StrategyData, knowledge?: KnowledgeData): Promise<DayPlan[]> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Content Planner.
    Language: Vietnamese.
    Context: Persona: ${strategy.persona}, USP: ${strategy.usp}.
    Task: Lên lịch 30 ngày.
    
    Output JSON object with key 'days' containing array:
    {
      "days": [
        {"day": 1, "topic": "string", "angle": "string"}
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  
  const rawData = parseResponse(response.text);
  const daysArray = rawData.days || rawData;
  
  if (!Array.isArray(daysArray)) return [];
  return daysArray.map((item: any) => ({ ...item, details: null, isLoading: false }));
};

export const generateDayDetail = async (dayPlan: DayPlan, strategy: StrategyData, knowledge?: KnowledgeData): Promise<DayDetail> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Copywriter.
    Language: Vietnamese.
    Context: Topic: ${dayPlan.topic}, Angle: ${dayPlan.angle}.
    Task: Nội dung chi tiết.
    
    Output JSON:
    {
      "caption": "string",
      "visualPrompt": "string (English)",
      "seedingScript": "string"
    }
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return parseResponse(response.text) as DayDetail;
};

export const adaptCalendar = async (
    currentCalendar: DayPlan[], 
    insertText: string, 
    insertImageBase64: string | null, 
    knowledge?: KnowledgeData
): Promise<DayPlan[]> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const calendarContext = currentCalendar.map(d => `Day ${d.day}: ${d.topic} (${d.angle})`).join('\n');

  const parts: any[] = [];
  if (insertImageBase64) {
      const rawData = insertImageBase64.replace(/^data:(image|video)\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: rawData } });
  }

  const prompt = `
    ${context}
    Role: Dynamic Planner.
    Language: Vietnamese.
    Task: Dynamic Insert based on new request: "${insertText}".
    Current Calendar: ${calendarContext.substring(0, 2000)}...
    
    Output JSON:
    {
        "updates": [
            {"day": number, "topic": "string", "angle": "string"}
        ]
    }
  `;
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: parts },
    config: { responseMimeType: "application/json" },
  });
  
  const rawData = parseResponse(response.text);
  const updates = rawData.updates || [];

  const newCalendar = [...currentCalendar];
  updates.forEach((u: any) => {
      const idx = newCalendar.findIndex(d => d.day === u.day);
      if (idx !== -1) {
          newCalendar[idx] = {
              ...newCalendar[idx],
              topic: u.topic,
              angle: u.angle,
              details: null,
              isLoading: false
          };
      }
  });

  return newCalendar;
};

export const generateTikTokScript = async (topic: string, angle: string, knowledge?: KnowledgeData): Promise<TikTokScriptData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: TikTok Scriptwriter.
    Language: Vietnamese.
    Task: TikTok Script for "${topic}".
    
    Output JSON:
    {
      "title": "string",
      "segments": [
        {"time": "0-3s", "visual": "string", "audio": "string", "veoPrompt": "string"}
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as TikTokScriptData;
};

export const generateCreative = async (strategy: StrategyData, knowledge?: KnowledgeData): Promise<CreativeData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Creative Director.
    Language: Vietnamese.
    Task: Viral Assets.
    
    Output JSON:
    {
      "viralHooks": ["string"],
      "seedingMasterPlan": "string",
      "kolConcepts": ["string"]
    }
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return parseResponse(response.text) as CreativeData;
};

export const generateAds = async (strategy: StrategyData, customRequirements?: string, knowledge?: KnowledgeData): Promise<AdsData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Ads Manager.
    Language: Vietnamese.
    Task: Ads Strategy.
    ${customRequirements ? `Requirements: "${customRequirements}"` : ""}
    
    Output JSON:
    {
      "campaignName": "string",
      "campaignStructure": "string",
      "adContent": { 
        "salesCopy": "string", 
        "imagePrompt": "string", 
        "videoScript": "string" 
      }
    }
  `;
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  return parseResponse(response.text) as AdsData;
};

export const analyzeAdPerformance = async (metrics: AdMetrics, campaignContext: AdsData, knowledge?: KnowledgeData): Promise<AdAnalysis> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  
  const prompt = `
    ${context}
    Role: Media Buyer.
    Language: Vietnamese.
    Task: Analyze Ads.
    Metrics: Spend ${metrics.spend}, Clicks ${metrics.clicks}.
    
    Output JSON:
    {
      "score": number,
      "assessment": "string",
      "kpiCalc": { "ctr": "string", "cpc": "string", "cpa": "string" },
      "pros": ["string"],
      "cons": ["string"],
      "recommendations": ["string"]
    }
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  return parseResponse(response.text) as AdAnalysis;
};

export const generateInfographic = async (content: string, knowledge?: KnowledgeData): Promise<InfographicData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);

  const brandStyleContext = knowledge?.visualStyle 
    ? `BRAND VISUAL STYLE: ${knowledge.visualStyle} (Prioritize these colors)`
    : "Suggested Brand Colors: Professional Business Blue & Orange";

  const prompt = `
    ${context}
    Role: Professional Information Designer & Visual Storyteller.
    Language: Vietnamese (Tiếng Việt).
    
    TASK: Create a Viral Infographic Storyboard.
    CONTENT: "${content.substring(0, 10000)}"
    ${brandStyleContext}

    OBJECTIVE: 
    - Create a visual step-by-step flow.
    - Extract a "Key Stat" (number/percentage) to highlight.
    - Suggest a color palette.

    Output STRICT JSON format:
    {
      "hook": "Tiêu đề gây tò mò (Ngắn < 10 từ)",
      "steps": [
        {"icon": "Name of Lucide Icon (PascalCase, e.g. 'Zap', 'Target', 'Users', 'TrendingUp')", "label": "Tiêu đề bước (2-4 từ)", "desc": "Mô tả < 20 từ"}
      ],
      "key_stat": "Con số ấn tượng (Ví dụ: '99%', '10X', '1 Triệu')",
      "brand_colors": {"primary": "#HexCode", "secondary": "#HexCode"} 
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: INFOGRAPHIC_MODEL, 
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\s*|\s*```/gi, "").trim();
    
    const parsed = JSON.parse(cleanJson);
    
    if (!parsed.hook || !parsed.steps || !Array.isArray(parsed.steps) || !parsed.brand_colors) {
        throw new Error("Invalid structure");
    }

    return parsed as InfographicData;
  } catch (error) {
    console.error("Infographic generation failed:", error);
    throw new Error("Không thể tạo Infographic. Vui lòng thử lại.");
  }
};
