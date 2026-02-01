
export interface StrategyData {
  persona: string;
  usp: string;
  angles: string[];
  realityCheck?: RealityAnalysis; // New field for Reality Check data
}

export interface TikTokScriptSegment {
  time: string;
  visual: string;
  audio: string;
  veoPrompt: string; // English prompt for AI Video generators
}

export interface TikTokScriptData {
  title: string;
  segments: TikTokScriptSegment[];
}

export interface DayDetail {
  caption: string;
  visualPrompt: string;
  seedingScript: string;
  tiktokScript?: TikTokScriptData; // New module data
  generatedImage?: string; // Base64 data string
  generatedVideo?: string; // Video URL/Blob URL
  isGeneratingMedia?: boolean; // UI state for spinner
  isGeneratingScript?: boolean; // UI state for script gen
}

export interface DayPlan {
  day: number;
  topic: string;
  angle: string;
  details?: DayDetail | null;
  isLoading?: boolean;
}

export interface CreativeData {
  viralHooks: string[];
  seedingMasterPlan: string;
  kolConcepts: string[];
}

export interface AdsData {
  campaignName: string; // New field for Dashboard
  campaignStructure: string;
  adContent: {
    salesCopy: string;
    imagePrompt: string;
    videoScript: string;
    generatedImage?: string;
    generatedVideo?: string;
  };
  isGeneratingMedia?: boolean;
}

// --- CAMPAIGN PERFORMANCE TYPES (NEW) ---
export interface AdMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface AdAnalysis {
  score: number; // 0-10
  assessment: string; // Tốt/Khá/Kém
  kpiCalc: { ctr: string; cpc: string; cpa: string };
  pros: string[];
  cons: string[];
  recommendations: string[];
}

// --- CAMPAIGN DASHBOARD TYPES (NEW V18) ---
export interface AdCampaign {
  id: string;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: number;
  data: AdsData;
  customInput?: string; // The specific requirement used to generate this
  metrics?: AdMetrics; // User input metrics
  analysis?: AdAnalysis; // AI Analysis result
  isAnalyzing?: boolean; // UI state
}

// --- KNOWLEDGE MODULE TYPES ---
export interface KnowledgeData {
  industry: string;
  domainRules: string;
  uploadedKnowledge?: string; // New: Raw text content from uploaded documents
  visualStyle?: string; // New: AI Analysis of uploaded images
  videoStyle?: string;  // New: AI Analysis of uploaded videos
  vaultContext?: string; // New: Context from Knowledge Vault files
  isConfirmed: boolean;
}

// --- REALITY CHECK MODULE TYPES (V2.0) ---
export interface RealityAssetTag {
  index: number;
  type: 'MENU' | 'SPACE_DECOR' | 'PRODUCT_SHOT' | 'HUMAN' | 'UNKNOWN';
  description: string;
}

export interface RealityAnalysis {
  priceSegment: string;
  detectedVibe: string;
  visualKey: string;
  brandColors: string[]; // New: Extracted Hex codes
  assetTags: RealityAssetTag[]; // New: Auto-classification results
  adjustments: string; // How the strategy was corrected
  gapAnalysis: string; // Missing items/opportunities
}

// --- SPY MODULE TYPES ---
export interface CompetitorAudit {
  hookStrategy: string;
  weaknesses: string;
  attackOpportunities: string;
}

export interface InsightMining {
  hiddenPain: string;
  buyingBarriers: string;
  triggerWords: string[];
}

export interface TrendPrediction {
  upcomingTrends: string[];
  debateTopics: string[];
  contentIdeas: string[];
}

export interface SpyData {
  competitorInput: string;
  insightInput: string;
  trendInput: string;
  competitorResult: CompetitorAudit | null;
  insightResult: InsightMining | null;
  trendResult: TrendPrediction | null;
  isAnalyzingCompetitor: boolean;
  isMiningInsights: boolean;
  isPredictingTrends: boolean;
}

// --- REPURPOSING MODULE TYPES ---
export interface SlideContent {
  slideNumber: number;
  content: string;
  visualSuggestion: string;
}

export interface RepurposeCarousel {
  slides: SlideContent[];
}

export interface RepurposeInfographic {
  title: string;
  keyPoints: string[];
  layoutSuggestion: string;
  iconSuggestions: string[];
}

export interface RepurposeVideoScript {
  hookVisual: string;
  scriptBody: string;
  cta: string;
  productionNotes: string;
}

export interface RepurposeEmailSequence {
  email1: { subject: string; body: string };
  email2: { subject: string; body: string };
  email3: { subject: string; body: string };
}

export interface RepurposingData {
  inputContent: string;
  carouselResult: RepurposeCarousel | null;
  infographicResult: RepurposeInfographic | null;
  videoScriptResult: RepurposeVideoScript | null;
  emailSequenceResult: RepurposeEmailSequence | null;
  isGeneratingCarousel: boolean;
  isGeneratingInfographic: boolean;
  isGeneratingVideoScript: boolean;
  isGeneratingEmail: boolean;
}

// --- KOL MODULE TYPES (NEW) ---
export interface KOLData {
  dnaImage: string | null; // Base64 of the reference face
  name: string;
  description: string;
  generatedImages: string[]; // List of Base64 generated images
  isGenerating: boolean;
}

// --- INFOGRAPHIC MODULE TYPES (NEW) ---
export interface InfographicStep {
  icon: string; // Lucide icon name
  label: string;
  desc: string; // Short description < 20 words
}

export interface InfographicData {
  hook: string;
  steps: InfographicStep[];
  key_stat: string;
  brand_colors: {
    primary: string;
    secondary: string;
  };
}

// --- KNOWLEDGE VAULT TYPES (NEW) ---
export interface KnowledgeFile {
  id: string;
  name: string;
  type: string; // MIME type or extension
  size: number;
  content: string; // Text content or Base64
  preview?: string; // For images
  description?: string; // Analysis of the image content
  lastModified: number;
}

// ------------------------

export enum StepStatus {
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface AppState {
  id?: string; // Project ID for management
  projectName: string; // Project Name (Required now)
  lastSaved?: number; // Timestamp
  
  knowledge: KnowledgeData; 
  spy: SpyData;
  repurposing: RepurposingData;
  kol: KOLData; // New KOL State
  infographic: InfographicData | null; // New Infographic State
  isGeneratingInfographic: boolean;
  knowledgeVault: KnowledgeFile[]; // New Knowledge Vault State

  productInput: string;
  currentStep: number;
  strategy: StrategyData | null;
  calendar: DayPlan[];
  creative: CreativeData | null;
  adsCampaigns: AdCampaign[]; // Changed from 'ads' to array
  isGeneratingStrategy: boolean;
  isGeneratingCalendar: boolean;
  isGeneratingCreative: boolean;
  isGeneratingAds: boolean;
}
