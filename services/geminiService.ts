
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  StrategyData, DayPlan, DayDetail, CreativeData, AdsData, 
  CompetitorAudit, InsightMining, TrendPrediction,
  RepurposeCarousel, RepurposeInfographic, RepurposeVideoScript, RepurposeEmailSequence,
  KnowledgeData, TikTokScriptData, AdMetrics, AdAnalysis, RealityAnalysis
} from "../types";

// Helper to get client instance with current key
const getAiClient = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Vui lòng nhập API Key trong phần cài đặt hoặc cấu hình biến môi trường VITE_GEMINI_API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};
const MODEL_NAME = 'gemini-2.0-flash'; 
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const VEO_MODEL = 'veo-3.1-fast-generate-preview';

// Helper to clean and parse JSON from Markdown response
const parseResponse = (text: string | undefined) => {
  if (!text) throw new Error("Empty response from AI");
  
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    try {
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
    throw new Error("Invalid JSON format from API");
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
  const visualStyle = knowledge.visualStyle ? `VISUAL AESTHETIC GUIDE: "${knowledge.visualStyle}"` : "";
  const videoStyle = knowledge.videoStyle ? `VIDEO EDITING STYLE: "${knowledge.videoStyle}"` : "";
  
  return `
    CRITICAL INSTRUCTION - INDUSTRY BRAIN ACTIVATED:
    You are an expert in the [${knowledge.industry}] industry.
    
    ${MARKETING_BRAIN_INSTRUCTIONS}
    
    ${uploadedDocs}
    ${rules}
    ${visualStyle}
    ${videoStyle}
    
    If the DOMAIN RULES or UPLOADED KNOWLEDGE conflict with standard marketing advice, prioritize the user provided knowledge.
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

  // Remove data URL prefix if present for API call
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
  assetsBase64: string[], // Array of base64 images
  knowledge?: KnowledgeData
): Promise<RealityAnalysis> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  
  const parts: any[] = [];
  
  // Attach all assets to the prompt
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
    
    STEP 1: AUTO-TAGGING
    For EACH [Asset #x], classify it into ONE of these types:
    - "MENU": Contains text, prices, list of items.
    - "SPACE_DECOR": Interior, exterior, atmosphere, seating.
    - "PRODUCT_SHOT": Close-up of food, drink, or items.
    - "HUMAN": Staff, customers, crowd.
    - "UNKNOWN": Cannot identify.
    
    STEP 2: SYNTHESIS
    - Analyze "MENU" assets to determine the REAL Price Segment.
    - Analyze "SPACE_DECOR" to determine the REAL Vibe/Atmosphere.
    - Analyze "PRODUCT_SHOT" to identify the Visual Key.
    - Extract dominant "BRAND_COLORS" (Hex codes) found across images.

    STEP 3: COMPARE & CORRECT
    - If the vibe is High-End but Price is Low, note the discrepancy.
    - Suggest adjustments for the marketing strategy.
    
    Output JSON (Keys in English, Values in Vietnamese):
    - assetTags: Array of objects [{ index: number, type: string, description: string }].
    - priceSegment: "Bình dân", "Trung cấp", "Cao cấp" (include estimated price range from Menu).
    - detectedVibe: Describe the detected atmosphere (e.g., Vintage, Cyberpunk, Cozy).
    - visualKey: Key visual elements (lighting, composition).
    - brandColors: Array of Hex strings (e.g., ["#FF0000", "#FFFFFF"]).
    - gapAnalysis: What is missing? (e.g., "Lack of human element", "Menu is hard to read").
    - adjustments: CRITICAL. Specific instructions to adjust the Marketing Strategy.
  `;

  parts.push({ text: prompt });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      assetTags: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            index: { type: Type.INTEGER },
            type: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      priceSegment: { type: Type.STRING },
      detectedVibe: { type: Type.STRING },
      visualKey: { type: Type.STRING },
      brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
      gapAnalysis: { type: Type.STRING },
      adjustments: { type: Type.STRING }
    },
    required: ["assetTags", "priceSegment", "detectedVibe", "visualKey", "brandColors", "gapAnalysis", "adjustments"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: { responseMimeType: "application/json", responseSchema: schema },
    });
    return parseResponse(response.text) as RealityAnalysis;
  } catch (error) {
    console.error("Reality analysis failed:", error);
    throw new Error("Không thể phân tích bộ ảnh. Vui lòng thử lại với ít ảnh hơn hoặc ảnh nhẹ hơn.");
  }
};


// --- SPY & RESEARCH SERVICES ---

export const analyzeCompetitor = async (content: string, knowledge?: KnowledgeData): Promise<CompetitorAudit> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Chuyên gia Phân tích Đối thủ (Competitive Intelligence Analyst).
    Language: Vietnamese (Tiếng Việt - Văn phong marketing tự nhiên, sắc bén).
    Task: Phân tích nội dung đối thủ sau.
    Content: "${content.substring(0, 5000)}"
    
    Output JSON (Keys in English, Values in Vietnamese):
    1. hookStrategy: Xác định loại hook/chiến lược thu hút.
    2. weaknesses: Khách hàng đang phàn nàn điều gì? Điểm yếu là gì?
    3. attackOpportunities: Chúng ta có thể làm tốt hơn ở đâu?
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      hookStrategy: { type: Type.STRING },
      weaknesses: { type: Type.STRING },
      attackOpportunities: { type: Type.STRING },
    },
    required: ["hookStrategy", "weaknesses", "attackOpportunities"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as CompetitorAudit;
};

export const mineInsights = async (comments: string, knowledge?: KnowledgeData): Promise<InsightMining> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Nhà Tâm lý học Hành vi (Consumer Psychologist).
    Language: Vietnamese (Tiếng Việt - Văn phong tự nhiên).
    Task: Phân tích bình luận khách hàng để tìm Insight sâu sắc.
    Comments: "${comments.substring(0, 5000)}"
    
    Output JSON (Keys in English, Values in Vietnamese):
    1. hiddenPain: Nỗi đau thầm kín là gì?
    2. buyingBarriers: Tại sao họ lưỡng lự chưa mua?
    3. triggerWords: Liệt kê 5-10 từ ngữ cảm xúc mạnh.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      hiddenPain: { type: Type.STRING },
      buyingBarriers: { type: Type.STRING },
      triggerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["hiddenPain", "buyingBarriers", "triggerWords"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as InsightMining;
};

export const predictTrends = async (keyword: string, knowledge?: KnowledgeData): Promise<TrendPrediction> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Chuyên gia Dự báo Xu hướng (Trend Forecaster).
    Language: Vietnamese (Tiếng Việt).
    Task: Dự đoán xu hướng thị trường cho: "${keyword}". Timeline: 30 ngày tới.
    
    Output JSON (Keys in English, Values in Vietnamese):
    1. upcomingTrends: 3 xu hướng đang lên.
    2. debateTopics: 3 chủ đề gây tranh cãi.
    3. contentIdeas: 3 góc độ nội dung cụ thể để khai thác.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      upcomingTrends: { type: Type.ARRAY, items: { type: Type.STRING } },
      debateTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
      contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["upcomingTrends", "debateTopics", "contentIdeas"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as TrendPrediction;
};

// --- CONTENT REPURPOSING SERVICES ---

export const repurposeToCarousel = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeCarousel> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Content Creator chuyên nghiệp.
    Language: Vietnamese (Tiếng Việt - Văn phong ngắn gọn, súc tích cho Social Media).
    Task: Chuyển đổi nội dung văn bản sau thành cấu trúc Slide Instagram/LinkedIn (8-10 slides).
    Source Text: "${content.substring(0, 8000)}"

    Structure:
    - Slide 1: Viral Hook/Title (Giật tít).
    - Slide 2: Vấn đề (Pain point).
    - Slides 3-N: Giải pháp/Kiến thức chính (ngắn gọn).
    - Last Slide: Kết luận & Kêu gọi hành động (CTA).
    
    Output JSON (Keys in English, Values in Vietnamese) with 'slides' array. Each item has: 
    - slideNumber
    - content (Nội dung chữ trên slide)
    - visualSuggestion (Gợi ý hình ảnh minh họa theo phong cách Minimalist).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      slides: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            slideNumber: { type: Type.INTEGER },
            content: { type: Type.STRING },
            visualSuggestion: { type: Type.STRING }
          }
        }
      }
    },
    required: ["slides"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as RepurposeCarousel;
};

export const repurposeToInfographic = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeInfographic> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Visual Data Designer.
    Language: Vietnamese (Tiếng Việt).
    Task: Tóm tắt nội dung sau thành ý tưởng Infographic (1 trang).
    Source Text: "${content.substring(0, 8000)}"

    Output JSON (Keys in English, Values in Vietnamese):
    1. title: Tiêu đề cực ngắn, bắt tai.
    2. keyPoints: 3-5 ý chính ngắn gọn nhất có thể.
    3. layoutSuggestion: Gợi ý bố cục (Timeline, So sánh, Mindmap...).
    4. iconSuggestions: Danh sách các icon nên dùng.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
      layoutSuggestion: { type: Type.STRING },
      iconSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["title", "keyPoints", "layoutSuggestion", "iconSuggestions"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as RepurposeInfographic;
};

export const repurposeToVideoScript = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeVideoScript> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: TikTok/Reels Scriptwriter.
    Language: Vietnamese (Tiếng Việt - Văn phong nói, tự nhiên, bắt trend).
    Task: Chuyển đổi nội dung thành kịch bản video ngắn 60s (nhịp nhanh, hấp dẫn).
    Source Text: "${content.substring(0, 8000)}"

    Output JSON (Keys in English, Values in Vietnamese):
    1. hookVisual: Mô tả 3s đầu tiên (Hình ảnh gây sốc/Câu hỏi).
    2. scriptBody: Lời thoại kịch bản (Kể chuyện thu hút).
    3. cta: Kêu gọi hành động rõ ràng cuối video.
    4. productionNotes: Ghi chú quay phim (Biểu cảm, âm thanh, ánh sáng).
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      hookVisual: { type: Type.STRING },
      scriptBody: { type: Type.STRING },
      cta: { type: Type.STRING },
      productionNotes: { type: Type.STRING }
    },
    required: ["hookVisual", "scriptBody", "cta", "productionNotes"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as RepurposeVideoScript;
};

export const repurposeToEmailSequence = async (content: string, knowledge?: KnowledgeData): Promise<RepurposeEmailSequence> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Email Marketing Specialist.
    Language: Vietnamese (Tiếng Việt - Văn phong email chuyên nghiệp, gần gũi).
    Task: Tạo chuỗi 3 email chăm sóc khách hàng dựa trên nội dung.
    Source Text: "${content.substring(0, 8000)}"

    Structure:
    - Email 1: Trao giá trị (Chia sẻ kiến thức, không bán hàng).
    - Email 2: Soft Sell (Kể chuyện thành công/Case study).
    - Email 3: Hard Sell (Ưu đãi khan hiếm/FOMO).

    Output JSON (Keys in English, Values in Vietnamese) with objects for email1, email2, email3. Each has 'subject' and 'body'.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      email1: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } } },
      email2: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } } },
      email3: { type: Type.OBJECT, properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } } },
    },
    required: ["email1", "email2", "email3"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
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
    // ENHANCED PROMPT FOR CINEMATIC QUALITY
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

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download video file");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Video generation failed:", error);
    throw error;
  }
};

// --- KOL GENERATION SERVICE ---
export const generateKOLImage = async (dnaBase64: string, userPrompt: string, kolDesc: string): Promise<string> => {
  const ai = getAiClient();
  
  // Construct a strong prompt that emphasizes using the reference image
  const fullPrompt = `
    Generate a photorealistic, 8k, highly detailed image of a person based on the provided reference image (this is the 'DNA' of the character).
    
    CHARACTER DETAILS:
    ${kolDesc}
    
    SCENE / ACTION:
    ${userPrompt}
    
    STYLE:
    Photorealistic, cinematic lighting, professional photography, high resolution.
    
    CRITICAL: Maintain the facial features and identity of the reference person as closely as possible.
  `;

  // Remove data URL prefix
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
        REALITY CHECK ACTIVATED (PRIORITIZE THIS OVER GENERAL THEORY):
        - Detected Price Segment: ${realityContext.priceSegment}
        - Detected Vibe: ${realityContext.detectedVibe}
        - Gap Analysis: ${realityContext.gapAnalysis}
        - REQUIRED ADJUSTMENT: ${realityContext.adjustments}
        
        INSTRUCTION: Ensure the Persona and USP align with the REALITY data (e.g., if price is high, target wealthy customers).
      `;
  }

  const prompt = `
    ${context}
    Role: Chiến lược gia Marketing Cấp cao (Senior Marketing Strategist).
    Language: Vietnamese (Tiếng Việt - Văn phong chuyên gia, gãy gọn).
    Task: Phân tích sản phẩm/dịch vụ sau và đưa ra chiến lược cốt lõi.
    
    Product Input: "${productInfo}"
    ${realityInstruction}

    Output JSON (Keys in English, Values in Vietnamese):
    - persona: Chân dung khách hàng chi tiết (Nhân khẩu học, Hành vi, Nỗi đau).
    - usp: Điểm bán hàng độc nhất (Unique Selling Point).
    - angles: 3 góc độ tiếp cận (Lý tính, Cảm xúc, FOMO).
  `;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      persona: { type: Type.STRING },
      usp: { type: Type.STRING },
      angles: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["persona", "usp", "angles"],
  };
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return parseResponse(response.text) as StrategyData;
};

export const generateCalendarOverview = async (strategy: StrategyData, knowledge?: KnowledgeData): Promise<DayPlan[]> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Content Planner.
    Language: Vietnamese (Tiếng Việt).
    Context: Persona: ${strategy.persona}, USP: ${strategy.usp}.
    Task: Lên lịch đăng bài 30 ngày (Chỉ tiêu đề bài viết - Headline thu hút).
    Output JSON Array: { day, topic (Chủ đề bài viết), angle (Góc độ tiếp cận) }.
  `;
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.ARRAY, // Fix: schema should be ARRAY for list items if top level is array? No, gemini output is usually object with property. But here we expect raw array or obj.
      // Let's force object wrapper for safety or use standard array schema
    }
    // Simplification: Let Gemini generate JSON without strict schema enforcement for Array root to avoid SDK issues, 
    // or wrap in object. For now, relying on text prompt instruction is safer for root arrays in this specific SDK version context.
  };
  
  // Re-implementing with clearer schema for Object wrapper to ensure stability
  const safeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        days: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { day: { type: Type.INTEGER }, topic: { type: Type.STRING }, angle: { type: Type.STRING } },
                required: ["day", "topic", "angle"]
            }
        }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt + " Output JSON object with key 'days'.",
    config: { responseMimeType: "application/json", responseSchema: safeSchema },
  });
  
  const rawData = parseResponse(response.text);
  const daysArray = rawData.days || rawData; // Handle both wrapped and unwrapped if model ignores
  
  if (!Array.isArray(daysArray)) return [];
  return daysArray.map((item: any) => ({ ...item, details: null, isLoading: false }));
};

export const generateDayDetail = async (dayPlan: DayPlan, strategy: StrategyData, knowledge?: KnowledgeData): Promise<DayDetail> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Copywriter chuyên nghiệp & Seeding Master.
    Language: Vietnamese (Tiếng Việt - Văn phong tự nhiên, đời thường, hợp ngữ cảnh MXH).
    Context: Topic: ${dayPlan.topic}, Angle: ${dayPlan.angle}, Persona: ${strategy.persona}.
    Task: Viết nội dung chi tiết cho Ngày ${dayPlan.day}.
    Output JSON (Keys in English, Values in Vietnamese):
    - caption: Nội dung bài viết (Theo khung AIDA hoặc PAS, kèm emoji, hashtag).
    - visualPrompt: Detailed English prompt for AI Image/Video generation. Describe the scene, lighting, camera angle, and style. Focus on cinematic quality, photorealism, and high resolution (e.g., 'Cinematic 4k shot of...').
    - seedingScript: Kịch bản hội thoại Seeding (6-10 comments) giả lập tương tác thật để tăng độ uy tín (Social Proof).
      
      MỤC TIÊU: Làm cho người xem tin rằng sản phẩm đang HOT và được nhiều người quan tâm thật sự.
      
      QUY TẮC "REAL HUMAN" (CỰC KỲ QUAN TRỌNG):
      1. ĐA DẠNG HÓA GIỌNG ĐIỆU:
         - Có người hỏi cộc lốc: "Giá?", "Ib".
         - Có người dùng Teencode: "hàng auth k shop?", "xài êm k b?", "trùi ui xinh xỉu".
         - Có người tag bạn bè vào rủ mua chung.
         - Có người vào confirm chất lượng (Seeding feedback).
         - Có người nghi ngờ: "Thấy ảo ảo", "Sợ treo đầu dê bán thịt chó".
      2. KỊCH BẢN TÂM LÝ (DRAMA & FOMO):
         - Tạo tình huống tranh luận nhẹ hoặc thắc mắc về công dụng/giá cả để tăng tương tác.
         - Brand chỉ trả lời khéo léo, điều hướng ib, không trả lời dài dòng như văn mẫu.
         - Tự nhiên, không dùng ngữ pháp quá chuẩn. Viết sai chính tả nhẹ cũng được cho giống thật.
      
      3. Format bắt buộc:
         Tên User: Nội dung comment
         Tên User: Nội dung comment...
         Brand: Nội dung...
  `;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: { caption: { type: Type.STRING }, visualPrompt: { type: Type.STRING }, seedingScript: { type: Type.STRING } },
    required: ["caption", "visualPrompt", "seedingScript"],
  };
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return parseResponse(response.text) as DayDetail;
};

// --- DYNAMIC INSERT SERVICE (NEW MODULE) ---
export const adaptCalendar = async (
    currentCalendar: DayPlan[], 
    insertText: string, 
    insertImageBase64: string | null, 
    knowledge?: KnowledgeData
): Promise<DayPlan[]> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);

  // 1. Prepare Calendar Context (Simplify to save tokens)
  const calendarContext = currentCalendar.map(d => `Day ${d.day}: ${d.topic} (${d.angle})`).join('\n');

  // 2. Build Parts
  const parts: any[] = [];
  if (insertImageBase64) {
      const rawData = insertImageBase64.replace(/^data:(image|video)\/\w+;base64,/, "");
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: rawData } });
  }

  // 3. Prompt
  const prompt = `
    ${context}
    Role: Content Manager Linh Hoạt (Dynamic Planner).
    Language: Vietnamese.
    
    ACTION: DYNAMIC INSERT & ADAPTATION.
    
    INPUT:
    1. Current Calendar (30 Days):
    ${calendarContext}
    
    2. New Product/Focus Request:
    "${insertText}"
    
    TASK:
    1. Analyze the New Product (from image/text).
    2. Scan the current calendar to find 3-5 "Filler Days" (General quotes, generic tips, or weak engagement topics).
    3. REPLACE those days with NEW content promoting the New Product.
    4. Keep the same "Angle" category if possible, or adapt it.
    5. Ensure the new topics fit naturally into the flow.

    OUTPUT JSON (Array of objects):
    Return ONLY the days that need to be changed.
    [{
       "day": number, (The day index to swap)
       "topic": string, (The new headline for the new product)
       "angle": string (The angle, e.g., "Sale / Product Focus")
    }]
  `;
  
  parts.push({ text: prompt });

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
        updates: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { 
                    day: { type: Type.INTEGER }, 
                    topic: { type: Type.STRING }, 
                    angle: { type: Type.STRING } 
                },
                required: ["day", "topic", "angle"]
            }
        }
    }
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: { parts: parts },
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  
  const rawData = parseResponse(response.text);
  const updates = rawData.updates || [];

  // Merge updates into original calendar
  const newCalendar = [...currentCalendar];
  updates.forEach((u: any) => {
      const idx = newCalendar.findIndex(d => d.day === u.day);
      if (idx !== -1) {
          newCalendar[idx] = {
              ...newCalendar[idx],
              topic: u.topic,
              angle: u.angle,
              details: null, // Reset details to force regeneration with new context
              isLoading: false
          };
      }
  });

  return newCalendar;
};


// --- TIKTOK STUDIO SERVICE (NEW MODULE) ---
export const generateTikTokScript = async (topic: string, angle: string, knowledge?: KnowledgeData): Promise<TikTokScriptData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: TikTok/Shorts Director & Scriptwriter.
    Language: Vietnamese (Tiếng Việt - Natural, Fast-paced, Gen Z Friendly).
    Task: Create a viral video script (30-60s) for the topic: "${topic}" (Angle: ${angle}).

    MANDATORY STRUCTURE (4 PARTS):
    1. THE HOOK (0-3s): Visually shocking or a provocative question. NO "Hello".
    2. THE VALUE (3-15s): Core message/Solution. Show, don't just tell.
    3. THE TWIST/PROOF (15-45s): Evidence, results, or a surprising angle.
    4. THE CTA (Last 5s): Clear instruction (Click/Buy/Comment).

    Output JSON object with:
    - title: A catchy title for the video file.
    - segments: Array of objects, each containing:
       - time: Time range (e.g., "0-3s").
       - visual: Description of action/scene.
       - audio: Spoken dialogue or sound effect description.
       - veoPrompt: A specific English prompt optimized for AI Video generation (Veo/Sora) for this exact scene. 
         Format: "Cinematic 4k shot of [Subject], [Detailed Action], [Specific Camera Move like 'Slow Pan' or 'Zoom In'], [Lighting like 'Golden Hour' or 'Neon'], [Style like 'Photorealistic' or 'Cyberpunk']. High resolution, 35mm film look."
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      segments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: { type: Type.STRING },
            visual: { type: Type.STRING },
            audio: { type: Type.STRING },
            veoPrompt: { type: Type.STRING }
          },
          required: ["time", "visual", "audio", "veoPrompt"]
        }
      }
    },
    required: ["title", "segments"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as TikTokScriptData;
};

export const generateCreative = async (strategy: StrategyData, knowledge?: KnowledgeData): Promise<CreativeData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Chuyên gia Viral Marketing.
    Language: Vietnamese (Tiếng Việt - Bắt trend, ngôn ngữ Gen Z nếu phù hợp).
    Task: Tạo các tài sản sáng tạo viral.
    Output JSON (Keys in English, Values in Vietnamese):
    - viralHooks: 10 tiêu đề giật tít, gây tò mò, đánh vào tâm lý.
    - seedingMasterPlan: Kế hoạch điều hướng dư luận tổng thể (Seeding Plan) chia theo 3 giai đoạn:
      1. Giai đoạn Teasing (Gây tò mò, chưa bán).
      2. Giai đoạn Educate (Thảo luận tính năng, so sánh).
      3. Giai đoạn Conversion (Feedback, FOMO chốt đơn).
      Trình bày gãy gọn, khoa học.
    - kolConcepts: Ý tưởng Concept cho KOL hoặc KOL ảo đại diện thương hiệu.
  `;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      viralHooks: { type: Type.ARRAY, items: { type: Type.STRING } },
      seedingMasterPlan: { type: Type.STRING },
      kolConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["viralHooks", "seedingMasterPlan", "kolConcepts"],
  };
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return parseResponse(response.text) as CreativeData;
};

export const generateAds = async (strategy: StrategyData, customRequirements?: string, knowledge?: KnowledgeData): Promise<AdsData> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  const prompt = `
    ${context}
    Role: Facebook/TikTok Ads Manager.
    Language: Vietnamese (Tiếng Việt - Văn phong quảng cáo chuyển đổi cao).
    Context: Persona: ${strategy.persona}, USP: ${strategy.usp}.
    
    ${customRequirements ? `
    IMPORTANT - CUSTOMER OVERRIDE:
    The user has specific requirements: "${customRequirements}".
    
    LOGIC:
    1. Detect Intent (Sale/Story/Entertainment).
    2. Detect Tone (Adjust brand voice).
    3. Detect Format (Video/Carousel/Text).
    
    EXECUTION:
    - If "Sale/Discount": Use Offer - Deadline - CTA.
    - If "Story": Use BAB (Before - After - Bridge).
    - If "Video": Create script with timestamps.
    ` : `
    Task: Lên chiến lược chạy quảng cáo tiêu chuẩn.
    `}

    Output JSON (Keys in English, Values in Vietnamese):
    - campaignName: Tên chiến dịch (Ngắn gọn, chuyên nghiệp, bắt tai).
    - campaignStructure: Cấu trúc chiến dịch (Targeting, Phân bổ ngân sách) ${customRequirements ? "tối ưu theo yêu cầu mới" : ""}.
    - adContent: { 
        salesCopy: ${customRequirements ? "Cung cấp 2 biến thể (Option 1 & Option 2) dựa trên yêu cầu." : "Lời chào hàng (Sales Copy) hấp dẫn, thôi miên."},
        imagePrompt: Prompt tạo ảnh quảng cáo (English) ${customRequirements ? "matching the new angle" : ""}.
        videoScript: Kịch bản Video Ads 30s ${customRequirements ? "matching Option 1" : ""}.
      }
  `;
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      campaignName: { type: Type.STRING },
      campaignStructure: { type: Type.STRING },
      adContent: {
        type: Type.OBJECT,
        properties: { salesCopy: { type: Type.STRING }, imagePrompt: { type: Type.STRING }, videoScript: { type: Type.STRING } },
        required: ["salesCopy", "imagePrompt", "videoScript"]
      },
    },
    required: ["campaignName", "campaignStructure", "adContent"],
  };
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });
  return parseResponse(response.text) as AdsData;
};

// --- AD PERFORMANCE ANALYSIS (NEW) ---
export const analyzeAdPerformance = async (metrics: AdMetrics, campaignContext: AdsData, knowledge?: KnowledgeData): Promise<AdAnalysis> => {
  const ai = getAiClient();
  const context = buildContext(knowledge);
  
  const ctr = (metrics.clicks / metrics.impressions * 100).toFixed(2);
  const cpc = metrics.clicks > 0 ? (metrics.spend / metrics.clicks).toFixed(0) : 'N/A';
  const cpa = metrics.conversions > 0 ? (metrics.spend / metrics.conversions).toFixed(0) : 'N/A';

  const prompt = `
    ${context}
    Role: Senior Performance Media Buyer (Facebook/TikTok Ads Expert).
    Language: Vietnamese (Tiếng Việt - Chuyên ngành, thực tế).
    
    TASK: Audit & Optimize Campaign Performance based on data.

    CAMPAIGN CONTEXT:
    - Name: ${campaignContext.campaignName}
    - Copy: "${campaignContext.adContent.salesCopy.substring(0, 200)}..."
    
    METRICS REPORT:
    - Spend (Chi tiêu): ${metrics.spend.toLocaleString()} VND
    - Impressions (Hiển thị): ${metrics.impressions.toLocaleString()}
    - Clicks (Nhấp): ${metrics.clicks.toLocaleString()}
    - Conversions (Chuyển đổi): ${metrics.conversions.toLocaleString()}
    - Calculated CTR: ${ctr}%
    - Calculated CPC: ${cpc} VND
    - Calculated CPA: ${cpa} VND

    INSTRUCTION:
    1. Score the campaign (0-10) based on industry standards (Assume e-commerce benchmarks).
    2. Identify KEY INSIGHTS: Is the CTR low? Is CPA too high? Is the creative fatiguing?
    3. Provide ACTIONABLE ADVICE: Scale, Kill, Edit Creative, or Adjust Targeting?

    Output JSON (Keys in English, Values in Vietnamese):
    - score: number (0-10)
    - assessment: "Tốt", "Khá", "Kém", or "Cần Tối Ưu Gấp"
    - kpiCalc: { ctr: string, cpc: string, cpa: string } (Formatted strings)
    - pros: Array of string (Good points)
    - cons: Array of string (Bad points/Issues)
    - recommendations: Array of string (Specific actions to take next)
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      assessment: { type: Type.STRING },
      kpiCalc: { 
        type: Type.OBJECT,
        properties: { ctr: { type: Type.STRING }, cpc: { type: Type.STRING }, cpa: { type: Type.STRING } },
        required: ["ctr", "cpc", "cpa"]
      },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["score", "assessment", "kpiCalc", "pros", "cons", "recommendations"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema },
  });

  return parseResponse(response.text) as AdAnalysis;
};
