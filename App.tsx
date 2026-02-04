import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sun, Moon, 
  BrainCircuit, BookOpen, ScanSearch, Target, CalendarDays, 
  Megaphone, Repeat, Crown, DraftingCompass, Zap, LayoutDashboard,
  FolderOpen, Key, Package
} from 'lucide-react';
import { AppState, StepStatus, KOLData, AdMetrics, DayPlan, RealityAnalysis } from './types';
import * as GeminiService from './services/geminiService';
import * as ProjectService from './services/projectService'; // Import Service
import StepContainer from './components/StepContainer';
import Step0Knowledge from './components/Step0Knowledge';
import Step1Strategy from './components/Step1Strategy';
import Step2Calendar from './components/Step2Calendar';
import Step4Ads from './components/Step4Ads';
import StepSpyResearch from './components/StepSpyResearch';
import StepRepurposing from './components/StepRepurposing';
import Step7KOL from './components/Step7KOL';
import InfographicArchitect from './components/InfographicArchitect'; // Import Component
import KnowledgeVault from './components/KnowledgeVault'; // Import Component
import { KnowledgeFile } from './types';
import { buildVaultContext } from './services/knowledgeService';
import ProjectManager from './components/ProjectManager'; // Import Component
import ApiKeyModal from './components/ApiKeyModal'; // Import Component
import JSZip from 'jszip';

// --- ROBUST ID GENERATOR (No Crypto Dependency) ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// --- INITIAL STATE FACTORY ---
const getInitialState = (): AppState => ({
  id: generateId(), 
  projectName: 'Dự án mới', 
  knowledge: { industry: '', domainRules: '', isConfirmed: false },
  productInput: '',
  currentStep: 0, 
  strategy: null,
  calendar: [],
  adsCampaigns: [],
  spy: {
    competitorInput: '',
    insightInput: '',
    trendInput: '',
    competitorResult: null,
    insightResult: null,
    trendResult: null,
    isAnalyzingCompetitor: false,
    isMiningInsights: false,
    isPredictingTrends: false,
  },
  repurposing: {
    inputContent: '',
    carouselResult: null,
    infographicResult: null,
    videoScriptResult: null,
    emailSequenceResult: null,
    isGeneratingCarousel: false,
    isGeneratingInfographic: false,
    isGeneratingVideoScript: false,
    isGeneratingEmail: false,
  },
  kol: {
    dnaImage: null,
    name: '',
    description: '',
    generatedImages: [],
    isGenerating: false,
  },
  infographic: {
    templates: [],
    currentTemplateId: null,
    presets: [],
    currentPresetId: null,
    productNameInput: '',
    userProductImage: null,
    productPhysicalDesc: '',
    infographicIdeaInput: '',
    isPromptEnhanceEnabled: true,
    generatedPrompt: '',
    generatedImage: null,
    generatedImages: [],
    isAnalyzing: false,
    isGenerating: false
  },
  knowledgeVault: [],
  
  mediaConfig: { imageCount: 1, videoCount: 1 },

  isGeneratingStrategy: false,
  isGeneratingCalendar: false,
  isGeneratingAds: false,
});

const AUTOSAVE_KEY = 'AI_MARKETING_AUTOSAVE_DATA';
const GLOBAL_VAULT_KEY = 'AI_STRATEGIST_GLOBAL_VAULT';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isZipping, setIsZipping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAutoSave, setShowAutoSave] = useState(false);
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // Project Manager State
  const [showProjectManager, setShowProjectManager] = useState(false);
  // API Key Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use lazy initialization for state
  const [state, setState] = useState<AppState>(() => getInitialState());

  // --- AUTO-LOAD SYSTEM (ON MOUNT) ---
  useEffect(() => {
    const initData = async () => {
        // 0. Load Global Knowledge Vault
        let globalVault: KnowledgeFile[] = [];
        try {
            const globalVaultStr = localStorage.getItem(GLOBAL_VAULT_KEY);
            if (globalVaultStr) {
                globalVault = JSON.parse(globalVaultStr);
            }
        } catch (e) { console.error("Global Vault Load Error", e); }

        // AUTO-LOAD DEFAULT KNOWLEDGE (Fix for Infographic)
        if (globalVault.length === 0) {
            console.log("Attempting to load default knowledge...");
            const defaultFiles = ['Marketing_Strategy_Core.txt', 'Vietnam_Market_Insight.txt'];
            const loadedFiles: KnowledgeFile[] = [];
            
            for (const fName of defaultFiles) {
                try {
                    const response = await fetch(`/knowledge/${fName}`);
                    if (response.ok) {
                        const text = await response.text();
                        loadedFiles.push({
                            id: generateId(),
                            name: fName,
                            type: 'text/plain',
                            size: text.length,
                            content: text,
                            lastModified: Date.now()
                        });
                    }
                } catch (err) {
                    console.warn(`Could not load ${fName}`, err);
                }
            }
            
            if (loadedFiles.length > 0) {
                globalVault = loadedFiles;
                localStorage.setItem(GLOBAL_VAULT_KEY, JSON.stringify(globalVault));
                console.log("✅ Default knowledge loaded successfully.");
            }
        }

        const globalVaultContext = buildVaultContext(globalVault);

        // Try to load the "Current Session" autosave first
        const saved = localStorage.getItem(AUTOSAVE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setState(prev => ({
                ...prev,
                ...parsed,
                // Ensure ID is present
                id: parsed.id || prev.id,
                // Ensure KOL state exists for old saves
                kol: parsed.kol || prev.kol,
                // Ensure Infographic state exists and has new fields (deep merge)
                infographic: parsed.infographic ? { ...prev.infographic, ...parsed.infographic, generatedImages: parsed.infographic.generatedImages || [] } : prev.infographic,
                // FORCE GLOBAL VAULT INJECTION
                knowledgeVault: globalVault,
                knowledge: { ...parsed.knowledge, vaultContext: globalVaultContext }
            }));
            console.log("📂 Auto-Save: Session restored.");
          } catch (e) {
            console.error("Auto-Save: Restore failed", e);
          }
        } else {
            // If no autosave, just initialize global vault
            setState(prev => ({
                ...prev,
                knowledgeVault: globalVault,
                knowledge: { ...prev.knowledge, vaultContext: globalVaultContext }
            }));
        }
    };
    
    initData();
  }, []);

  // --- AUTO-SAVE SYSTEM (ON CHANGE) ---
  useEffect(() => {
    const timer = setTimeout(() => {
        try {
            // 1. Save "Current Session" quick resume (Full state, might fail if huge)
            const cleanState = { ...state };
            
            // Clean slightly for session storage just in case
            if (cleanState.calendar) {
                cleanState.calendar = cleanState.calendar.map(d => ({
                    ...d,
                    details: d.details ? {
                        ...d.details,
                        generatedImage: undefined, 
                        generatedVideo: undefined
                    } : null
                }));
            }
            if (cleanState.adsCampaigns) {
                cleanState.adsCampaigns = cleanState.adsCampaigns.map(c => ({
                    ...c,
                    data: {
                        ...c.data,
                        adContent: {
                            ...c.data.adContent,
                            generatedImage: undefined,
                            generatedVideo: undefined
                        }
                    }
                }));
            }
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(cleanState));
            
            // 2. Update the "Project File" in ProjectService (Official Save)
            // We only trigger this if the project has some data to avoid spamming empty new projects
            // BUT if it's already an existing project (has ID in storage), we should update it.
            // The logic below is a bit strict. Let's rely on manual creation for new projects, and autosave for updates.
            // However, to be safe, if we have content, we save.
            if (state.productInput || state.knowledge.isConfirmed) {
                const updatedState = ProjectService.saveProjectToStorage(state);
                // If ID was generated during save, update state to match
                if (updatedState.id !== state.id) {
                    setState(prev => ({ ...prev, id: updatedState.id, projectName: updatedState.projectName }));
                }
            } else if (state.id) {
               // If it has an ID, check if it exists in storage, if so update it even if empty?
               // No, keep the condition to avoid saving noise.
            }

            // Show notification
            setShowAutoSave(true);
            setTimeout(() => setShowAutoSave(false), 2000);
        } catch (e) {
            console.warn("Auto-Save: Storage full or error", e);
        }
    }, 3000); // Debounce 3s (increased for project save)

    return () => clearTimeout(timer);
  }, [state]);

  // --- HELPER FOR PROJECT SLUG ---
  const getProjectSlug = () => 'ai_marketing_project';

  // --- KEYBOARD SHORTCUTS & INIT ---
  useEffect(() => {
    const checkKey = () => {
      const storedKey = localStorage.getItem('GEMINI_API_KEY');
      if (storedKey) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []); 

  // --- PROJECT MANAGEMENT HANDLERS ---
  const handleLoadProject = (id: string) => {
      const loadedState = ProjectService.loadProjectFromStorage(id);
      if (loadedState) {
          // INJECT GLOBAL BRAIN into loaded project
          let globalVault: KnowledgeFile[] = [];
          try {
              const globalVaultStr = localStorage.getItem(GLOBAL_VAULT_KEY);
              if (globalVaultStr) globalVault = JSON.parse(globalVaultStr);
          } catch(e){}
          
          const globalVaultContext = buildVaultContext(globalVault);

          // Merge with initial state to ensure new fields (like infographic) are present
          setState({
              ...getInitialState(), // Default values for new fields
              ...loadedState,       // Overwrite with saved data
              // Ensure critical new fields are not lost if missing in loadedState (Deep Merge)
              infographic: loadedState.infographic ? { ...getInitialState().infographic, ...loadedState.infographic, generatedImages: loadedState.infographic.generatedImages || [] } : getInitialState().infographic,
              knowledgeVault: globalVault,
              knowledge: { ...loadedState.knowledge, vaultContext: globalVaultContext }
          });
          setShowProjectManager(false);
          // Optional: alert(`✅ Đã tải dự án: ${loadedState.projectName}`);
      } else {
          alert("❌ Không thể tải dự án này.");
      }
  };

  const handleNewProject = () => {
      // Smarter Confirmation: Only ask if there is UNSAVED/IMPORTANT data in the current session
      const hasMeaningfulData = state.productInput.trim().length > 0 || state.knowledge.isConfirmed;
      
      if (hasMeaningfulData) {
        if (!confirm("Tạo dự án mới? Dự án hiện tại sẽ đóng lại (hãy chắc chắn bạn đã thấy 'Đã lưu tự động' hoặc tự lưu).")) {
            return;
        }
      }

      // PRESERVE GLOBAL STATE (Knowledge Vault)
      // The requirement is that Vault Files are Global-Persistent and should not be cleared.
      const globalVaultFiles = state.knowledgeVault;
      const globalVaultContext = state.knowledge.vaultContext;

      const baseState = getInitialState();
      const newState: AppState = {
          ...baseState,
          knowledgeVault: globalVaultFiles, // Keep files
          knowledge: { 
              ...baseState.knowledge, 
              vaultContext: globalVaultContext // Keep context active
          }
      };
      
      // OPTIMISTIC UPDATE: Update UI immediately so user feels "New Project" happens instantly
      setState(newState);
      setShowProjectManager(false);

      // Async Save: Initialize the file in storage without blocking UI
      setTimeout(() => {
          try {
              ProjectService.saveProjectToStorage(newState);
          } catch (e: any) {
              console.warn("Init save warning:", e);
              // Silent fail is okay here, user can still work.
              // We'll retry saving when they actually type something (Auto-save).
          }
      }, 100);
  };

  // --- JSON EXPORT (SAFE MODE) ---
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    const date = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
    downloadAnchorNode.setAttribute("download", `Marketing-Project-${date}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- JSON IMPORT (SAFE MODE) ---
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files.length > 0) {
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = (event) => {
            try {
                if (event.target?.result) {
                    const parsed = JSON.parse(event.target.result as string);
                    // Basic validation to check if it looks like our state
                    if (parsed.knowledge && parsed.id) {
                        setState(parsed);
                        // Also save imported project to storage
                        ProjectService.saveProjectToStorage(parsed);
                        alert("✅ Đã khôi phục dự án thành công!");
                    } else {
                        alert("❌ File không đúng định dạng dự án.");
                    }
                }
            } catch (error) {
                alert("❌ Lỗi khi đọc file JSON.");
            }
        };
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  // --- ZIP ASSETS DOWNLOAD ---
  const handleDownloadZip = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    
    let fileName = getProjectSlug();

    const assetsFolder = zip.folder("Assets");
    const scriptsFolder = zip.folder("TikTok_Scripts");
    const kolFolder = zip.folder("KOL_Photos");

    let count = 0;
    // Collect Calendar Media & Scripts
    for (const day of state.calendar) {
        if (day.details?.generatedImage) {
            const imgData = day.details.generatedImage.split(',')[1];
            assetsFolder?.file(`${fileName}_Ngay${day.day}_Anh.jpg`, imgData, {base64: true});
            count++;
        }
        if (day.details?.generatedVideo) {
            try {
                const blob = await fetch(day.details.generatedVideo).then(r => r.blob());
                assetsFolder?.file(`${fileName}_Ngay${day.day}_Video.mp4`, blob);
                count++;
            } catch (e) { console.error(e); }
        }
        if (day.details?.tiktokScript) {
            const scriptText = `TITLE: ${day.details.tiktokScript.title}\n\n${JSON.stringify(day.details.tiktokScript, null, 2)}`;
            scriptsFolder?.file(`${fileName}_Ngay${day.day}_Script.txt`, scriptText);
        }
    }
    // Collect Ads Media
    for (const campaign of state.adsCampaigns) {
       if (campaign.data.adContent.generatedImage) {
           const imgData = campaign.data.adContent.generatedImage.split(',')[1];
           assetsFolder?.file(`${fileName}_${campaign.id}_Anh.jpg`, imgData, {base64: true});
           count++;
       }
       if (campaign.data.adContent.generatedVideo) {
           try {
                const blob = await fetch(campaign.data.adContent.generatedVideo).then(r => r.blob());
                assetsFolder?.file(`${fileName}_${campaign.id}_Video.mp4`, blob);
                count++;
           } catch(e) { console.error(e); }
       }
    }
    // Collect KOL Media
    state.kol.generatedImages.forEach((img, idx) => {
        const imgData = img.split(',')[1];
        kolFolder?.file(`KOL_${state.kol.name || 'AI'}_${idx + 1}.jpg`, imgData, {base64: true});
    });

    zip.file(`${fileName}_DuLieuDuAn.json`, JSON.stringify(state, null, 2));

    try {
        const content = await zip.generateAsync({type:"blob"});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        a.download = `${fileName}-Full-Assets-${date}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Lỗi khi nén file.");
    } finally {
        setIsZipping(false);
    }
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(Math.max(0.5, prev + delta), 1.5));
  };

  // --- LOGIC HELPERS ---
  const isStepUnlocked = (step: number): boolean => {
    if (step === 0) return true;
    if (step === 1) return state.knowledge.isConfirmed;
    if (step === 2) return state.knowledge.isConfirmed;
    if (step === 3) return !!state.strategy;
    // Step 4 (Creative) Removed
    if (step === 5) return state.calendar.length > 0; // Ads unlocked by Calendar? Or Strategy? Usually Ads need Strategy. Let's say Calendar for flow.
    if (step === 6) return true;
    if (step === 7) return true; // KOL Unlocked
    if (step === 8) return true; // Infographic Unlocked
    if (step === 10) return true; // Knowledge Vault Unlocked
    return false;
  };

  const getStepStatus = (step: number): StepStatus => {
    if (state.currentStep === step) return StepStatus.ACTIVE;
    if (!isStepUnlocked(step)) return StepStatus.LOCKED;
    
    switch (step) {
        case 0: return state.knowledge.isConfirmed ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 1: return (state.spy.competitorResult || state.spy.insightResult || state.spy.trendResult) ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 2: return state.strategy ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 3: return state.calendar.length > 0 ? StepStatus.COMPLETED : StepStatus.PENDING;
        // Step 4 Removed
        case 5: return state.adsCampaigns.length > 0 ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 6: return (state.repurposing.carouselResult || state.repurposing.infographicResult || state.repurposing.videoScriptResult || state.repurposing.emailSequenceResult) ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 7: return state.kol.generatedImages.length > 0 ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 8: return state.infographic?.generatedImage ? StepStatus.COMPLETED : StepStatus.PENDING;
        case 10: return state.knowledgeVault.length > 0 ? StepStatus.COMPLETED : StepStatus.PENDING;
        default: return StepStatus.PENDING;
    }
  };

  const handleStepClick = (step: number) => {
    if (isStepUnlocked(step)) {
      setState(prev => ({ ...prev, currentStep: step }));
      setIsMobileMenuOpen(false);
    }
  };

  // --- ALL MODULE HANDLERS ---
  const handleSaveKnowledge = (data: any) => setState(prev => ({ ...prev, knowledge: data, currentStep: 1 }));
  const handleSpyCompetitor = async (content: string) => {
    setState(prev => ({ ...prev, spy: { ...prev.spy, isAnalyzingCompetitor: true } }));
    try {
      const result = await GeminiService.analyzeCompetitor(content, state.knowledge);
      setState(prev => ({ ...prev, spy: { ...prev.spy, competitorResult: result, isAnalyzingCompetitor: false } }));
    } catch (e: any) { 
        alert("Lỗi phân tích đối thủ: " + e.message);
        setState(prev => ({ ...prev, spy: { ...prev.spy, isAnalyzingCompetitor: false } })); 
    }
  };
  const handleSpyInsights = async (comments: string) => {
    setState(prev => ({ ...prev, spy: { ...prev.spy, isMiningInsights: true } }));
    try {
      const result = await GeminiService.mineInsights(comments, state.knowledge);
      setState(prev => ({ ...prev, spy: { ...prev.spy, insightResult: result, isMiningInsights: false } }));
    } catch (e: any) { 
        alert("Lỗi tìm Insight: " + e.message);
        setState(prev => ({ ...prev, spy: { ...prev.spy, isMiningInsights: false } })); 
    }
  };
  const handleSpyTrends = async (keyword: string) => {
    setState(prev => ({ ...prev, spy: { ...prev.spy, isPredictingTrends: true } }));
    try {
      const result = await GeminiService.predictTrends(keyword, state.knowledge);
      setState(prev => ({ ...prev, spy: { ...prev.spy, trendResult: result, isPredictingTrends: false } }));
    } catch (e: any) { 
        alert("Lỗi dự báo xu hướng: " + e.message);
        setState(prev => ({ ...prev, spy: { ...prev.spy, isPredictingTrends: false } })); 
    }
  };
  const handleRepurposeCarousel = async (content: string) => {
    setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingCarousel: true } }));
    try {
      const result = await GeminiService.repurposeToCarousel(content, state.knowledge);
      setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, carouselResult: result, isGeneratingCarousel: false } }));
    } catch (e: any) { 
        alert("Lỗi tạo Slide: " + (e.message || "Vui lòng thử lại"));
        setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingCarousel: false } })); 
    }
  };
  const handleRepurposeInfographic = async (content: string) => {
    setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingInfographic: true } }));
    try {
      const result = await GeminiService.repurposeToInfographic(content, state.knowledge);
      setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, infographicResult: result, isGeneratingInfographic: false } }));
    } catch (e: any) { 
        alert("Lỗi tạo Infographic: " + (e.message || "Vui lòng thử lại"));
        setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingInfographic: false } })); 
    }
  };
  const handleRepurposeVideoScript = async (content: string) => {
    setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingVideoScript: true } }));
    try {
      const result = await GeminiService.repurposeToVideoScript(content, state.knowledge);
      setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, videoScriptResult: result, isGeneratingVideoScript: false } }));
    } catch (e: any) { 
        alert("Lỗi tạo Video Script: " + (e.message || "Vui lòng thử lại"));
        setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingVideoScript: false, videoScriptResult: null } })); 
    }
  };
  const handleRepurposeEmailSequence = async (content: string) => {
    setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingEmail: true } }));
    try {
      const result = await GeminiService.repurposeToEmailSequence(content, state.knowledge);
      setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, emailSequenceResult: result, isGeneratingEmail: false } }));
    } catch (e: any) { 
        alert("Lỗi tạo Email: " + (e.message || "Vui lòng thử lại"));
        setState(prev => ({ ...prev, repurposing: { ...prev.repurposing, isGeneratingEmail: false } })); 
    }
  };
  
  // FIX: Updated to accept realityContext parameter
  const handleGenerateStrategy = async (productInfo: string, realityContext?: RealityAnalysis) => {
    setState(prev => ({ ...prev, isGeneratingStrategy: true, productInput: productInfo }));
    try {
      const strategyResult = await GeminiService.generateStrategy(productInfo, state.knowledge, realityContext);
      
      // Merge reality context into the strategy object so it can be displayed in UI
      const finalStrategy = { 
          ...strategyResult, 
          realityCheck: realityContext // Attach it manually so UI displays the badge
      };

      setState(prev => ({ ...prev, strategy: finalStrategy, currentStep: 3, isGeneratingStrategy: false }));
    } catch (error: any) { 
        console.error(error);
        alert(`Lỗi tạo chiến lược: ${error.message || "Vui lòng thử lại"}`);
        setState(prev => ({ ...prev, isGeneratingStrategy: false })); 
    }
  };
  
  const handleGenerateCalendar = async () => {
    if (!state.strategy) return;
    setState(prev => ({ ...prev, isGeneratingCalendar: true }));
    try {
      const calendar = await GeminiService.generateCalendarOverview(state.strategy, state.knowledge);
      setState(prev => ({ ...prev, calendar, isGeneratingCalendar: false, currentStep: 4 }));
    } catch (error) { setState(prev => ({ ...prev, isGeneratingCalendar: false })); }
  };

  // --- NEW: HANDLE CALENDAR UPDATE (Dynamic Insert) ---
  const handleUpdateCalendar = (newCalendar: DayPlan[]) => {
      setState(prev => ({ ...prev, calendar: newCalendar }));
  };

  const handleRegenerateHooks = async (dayIndex: number) => {
      const day = state.calendar[dayIndex];
      const newCalendar = [...state.calendar];
      newCalendar[dayIndex] = { ...day, isLoading: true };
      setState(prev => ({ ...prev, calendar: newCalendar }));
      
      try {
          const hooks = await GeminiService.regenerateViralHooks(day.topic, day.angle, state.knowledge);
          const calendarDone = [...state.calendar];
          calendarDone[dayIndex] = { ...day, viralHooks: hooks, isLoading: false };
          setState(prev => ({ ...prev, calendar: calendarDone }));
      } catch (e) {
          const calendarError = [...state.calendar];
          calendarError[dayIndex] = { ...day, isLoading: false };
          setState(prev => ({ ...prev, calendar: calendarError }));
          alert("Lỗi tạo lại Hooks: " + (e as any).message);
      }
  };

  const handleGenerateDayDetail = async (dayIndex: number) => {
    if (!state.strategy) return;
    const dayToUpdate = state.calendar[dayIndex];
    const updatedCalendarLoading = [...state.calendar];
    updatedCalendarLoading[dayIndex] = { ...dayToUpdate, isLoading: true };
    setState(prev => ({ ...prev, calendar: updatedCalendarLoading }));
    try {
      const details = await GeminiService.generateDayDetail(dayToUpdate, state.strategy, state.knowledge);
      const updatedCalendarDone = [...state.calendar];
      updatedCalendarDone[dayIndex] = { ...dayToUpdate, details, isLoading: false };
      setState(prev => ({ ...prev, calendar: updatedCalendarDone }));
    } catch (error) { 
        const updatedCalendarError = [...state.calendar];
        updatedCalendarError[dayIndex] = { ...dayToUpdate, isLoading: false };
        setState(prev => ({ ...prev, calendar: updatedCalendarError })); 
    }
  };
  const handleGenerateTikTokScript = async (dayIndex: number) => {
      const dayToUpdate = state.calendar[dayIndex];
      if (!dayToUpdate.details) return; 
      
      const calendarWithLoading = [...state.calendar];
      calendarWithLoading[dayIndex] = { 
          ...dayToUpdate, 
          details: { ...dayToUpdate.details, isGeneratingScript: true } 
      };
      setState(prev => ({ ...prev, calendar: calendarWithLoading }));

      try {
          const script = await GeminiService.generateTikTokScript(dayToUpdate.topic, dayToUpdate.angle, state.knowledge);
          const calendarSuccess = [...state.calendar];
          calendarSuccess[dayIndex] = { 
              ...dayToUpdate, 
              details: { 
                  ...dayToUpdate.details, 
                  tiktokScript: script,
                  isGeneratingScript: false 
              } 
          };
          setState(prev => ({ ...prev, calendar: calendarSuccess }));
      } catch (e) {
          const calendarError = [...state.calendar];
          calendarError[dayIndex] = { 
              ...dayToUpdate, 
              details: { ...dayToUpdate.details, isGeneratingScript: false } 
          };
          setState(prev => ({ ...prev, calendar: calendarError }));
      }
  };

  const handleGenerateMediaForDay = async (dayIndex: number, type: 'image' | 'video', prompt?: string) => {
    const dayToUpdate = state.calendar[dayIndex];
    if (!dayToUpdate.details) return;
    const calendarWithLoading = [...state.calendar];
    calendarWithLoading[dayIndex] = { ...dayToUpdate, details: { ...dayToUpdate.details, isGeneratingMedia: true } };
    setState(prev => ({ ...prev, calendar: calendarWithLoading }));
    try {
      if (type === 'image' && prompt) {
        // Use Image Count Config
        const images = await GeminiService.generateImage(prompt, undefined, state.mediaConfig.imageCount);
        const calendarSuccess = [...state.calendar];
        calendarSuccess[dayIndex] = { 
            ...dayToUpdate, 
            details: { 
                ...dayToUpdate.details, 
                generatedImage: images[0], 
                generatedImages: images, // Store all variations
                isGeneratingMedia: false 
            } 
        };
        setState(prev => ({ ...prev, calendar: calendarSuccess }));
      } else if (type === 'video' && dayToUpdate.details.generatedImage && prompt) {
        // Use Video Count Config
        const videoUrl = await GeminiService.generateVideo(dayToUpdate.details.generatedImage, prompt, state.mediaConfig.videoCount);
        const calendarSuccess = [...state.calendar];
        calendarSuccess[dayIndex] = { ...dayToUpdate, details: { ...dayToUpdate.details, generatedVideo: videoUrl, isGeneratingMedia: false } };
        setState(prev => ({ ...prev, calendar: calendarSuccess }));
      }
    } catch (e) {
      const calendarError = [...state.calendar];
      calendarError[dayIndex] = { ...dayToUpdate, details: { ...dayToUpdate.details, isGeneratingMedia: false } };
      setState(prev => ({ ...prev, calendar: calendarError }));
    }
  };
  // handleGenerateCreative REMOVED
  const handleCreateAdCampaign = async (customRequirements?: string) => {
    if (!state.strategy) return;
    setState(prev => ({ ...prev, isGeneratingAds: true }));
    try {
      const adsData = await GeminiService.generateAds(state.strategy, customRequirements, state.knowledge);
      const newCampaign = { id: generateId(), status: 'ACTIVE' as const, createdAt: Date.now(), data: adsData, customInput: customRequirements };
      setState(prev => ({ ...prev, adsCampaigns: [newCampaign, ...prev.adsCampaigns], isGeneratingAds: false }));
    } catch (error) { setState(prev => ({ ...prev, isGeneratingAds: false })); }
  };
  const handleDeleteCampaign = (id: string) => {
      if(!confirm("Bạn chắc chắn muốn xóa chiến dịch này?")) return;
      setState(prev => ({ ...prev, adsCampaigns: prev.adsCampaigns.filter(c => c.id !== id) }));
  };
  const handleToggleCampaignStatus = (id: string) => {
      setState(prev => ({ ...prev, adsCampaigns: prev.adsCampaigns.map(c => c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'COMPLETED' : 'ACTIVE' } : c) }));
  };
  const handleGenerateMediaForCampaign = async (campaignId: string, type: 'image' | 'video', prompt?: string) => {
      setState(prev => ({ ...prev, adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, data: { ...c.data, isGeneratingMedia: true } } : c) }));
      try {
        let updateData: any = { isGeneratingMedia: false };
        const campaign = state.adsCampaigns.find(c => c.id === campaignId);
        if(!campaign) return;
        if (type === 'image' && prompt) {
            const [imageBase64] = await GeminiService.generateImage(prompt);
            updateData.generatedImage = imageBase64;
        } else if (type === 'video' && campaign.data.adContent.generatedImage && prompt) {
            const videoUrl = await GeminiService.generateVideo(campaign.data.adContent.generatedImage, prompt);
            updateData.generatedVideo = videoUrl;
        }
        setState(prev => ({ ...prev, adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, data: { ...c.data, isGeneratingMedia: false, adContent: { ...c.data.adContent, ...updateData } } } : c) }));
      } catch (e) {
          setState(prev => ({ ...prev, adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, data: { ...c.data, isGeneratingMedia: false } } : c) }));
      }
  };
  // NEW: Handle Ad Performance Analysis
  const handleAnalyzeCampaign = async (campaignId: string, metrics: AdMetrics) => {
      // 1. Set Analyzing State
      setState(prev => ({
          ...prev,
          adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, isAnalyzing: true, metrics: metrics } : c)
      }));

      try {
          const campaign = state.adsCampaigns.find(c => c.id === campaignId);
          if (!campaign) return;

          // 2. Call Service
          const analysis = await GeminiService.analyzeAdPerformance(metrics, campaign.data, state.knowledge);

          // 3. Update State with Result
          setState(prev => ({
              ...prev,
              adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, isAnalyzing: false, analysis: analysis } : c)
          }));
      } catch (e) {
           setState(prev => ({
              ...prev,
              adsCampaigns: prev.adsCampaigns.map(c => c.id === campaignId ? { ...c, isAnalyzing: false } : c)
          }));
          alert("Lỗi khi phân tích chiến dịch.");
      }
  };

  // --- MEDIA CONFIG HANDLER ---
  const handleUpdateMediaConfig = (newConfig: Partial<{ imageCount: number; videoCount: number }>) => {
      setState(prev => ({ ...prev, mediaConfig: { ...prev.mediaConfig, ...newConfig } }));
  };

  // --- KOL HANDLERS ---
  const handleUpdateKOL = (newData: Partial<KOLData>) => {
      setState(prev => ({ ...prev, kol: { ...prev.kol, ...newData } }));
  };
  const handleGenerateKOLImage = async (prompt: string) => {
      if (!state.kol.dnaImage) {
          alert("Vui lòng upload ảnh DNA trước!");
          return;
      }
      setState(prev => ({ ...prev, kol: { ...prev.kol, isGenerating: true } }));
      try {
          const newImage = await GeminiService.generateKOLImage(state.kol.dnaImage, prompt, state.kol.description);
          setState(prev => ({ 
              ...prev, 
              kol: { 
                  ...prev.kol, 
                  isGenerating: false,
                  generatedImages: [newImage, ...prev.kol.generatedImages] 
              } 
          }));
      } catch (e) {
          setState(prev => ({ ...prev, kol: { ...prev.kol, isGenerating: false } }));
          alert("Lỗi khi tạo ảnh KOL. Vui lòng thử lại.");
      }
  };

  // --- KNOWLEDGE VAULT HANDLERS ---
  const handleUpdateKnowledgeVault = (files: KnowledgeFile[]) => {
      // 1. Save to Global Storage
      try {
          localStorage.setItem(GLOBAL_VAULT_KEY, JSON.stringify(files));
      } catch (e) {
          console.error("Failed to save global vault", e);
          if (e instanceof Error && e.name === 'QuotaExceededError') {
              alert("Bộ nhớ đầy! Không thể lưu thêm tài liệu vào Bộ Não.");
          }
      }

      // 2. Update State (Context is NOT rebuilt here automatically to allow manual training trigger)
      // We only update the list. Context is updated on "Train".
      setState(prev => ({ ...prev, knowledgeVault: files }));
  };

  const handleTrainVault = (files: KnowledgeFile[]) => {
      // 1. Mark all files as 'learned'
      const learnedFiles = files.map(f => ({ ...f, status: 'learned' as const }));
      
      // 2. Update Context
      const vaultContext = buildVaultContext(learnedFiles);
      
      // 3. Update State
      setState(prev => ({ 
          ...prev, 
          knowledgeVault: learnedFiles,
          knowledge: { ...prev.knowledge, vaultContext } 
      }));
      
      // 4. Save to Storage
      try {
          localStorage.setItem(GLOBAL_VAULT_KEY, JSON.stringify(learnedFiles));
      } catch (e) { console.error(e); }
      
      alert(`✅ Đã nạp ${learnedFiles.length} tài liệu vào Bộ Não AI!`);
  };

  // --- RENDER HELPERS ---
  const NAVIGATION_STEPS = [
    { id: 10, icon: BrainCircuit, title: 'Bộ Não Marketing' }, // GLOBAL BRAIN - PRIORITY 1
    { id: 0, icon: BookOpen, title: 'Kiến Thức Ngành' }, // Changed Icon to avoid duplicate
    { id: 1, icon: ScanSearch, title: 'Điệp Viên & Nghiên Cứu' },
    { id: 2, icon: Target, title: 'Chiến Lược Cốt Lõi' },
    { id: 3, icon: CalendarDays, title: 'Lịch 30 Ngày' },
    // Step 4 Removed
    { id: 5, icon: Megaphone, title: 'Quản Lý Ads' },
    { id: 6, icon: Repeat, title: 'Tái Chế Nội Dung' },
    // Reserved Modules
    { id: 7, icon: Crown, title: 'KOL AI Độc Quyền' }, // UNLOCKED
    { id: 8, icon: DraftingCompass, title: 'Infographic Architect' }, // NEW MODULE
    { id: 9, icon: Zap, title: 'Tự Động Hóa N8N', isComingSoon: true }
  ];

  // REMOVED: Blocking Screen Check "if (!hasApiKey) return ..."
  // Users can now enter the app and connect the key later via the sidebar.

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50 dark:bg-zinc-950 transition-colors duration-300">
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50">
         <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-zinc-100">
             <span className="text-xl">🤖</span> AI Strategist
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-gray-100 rounded-lg">
             <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
         </button>
      </div>

      {/* REFACTORED SIDEBAR NAVIGATION */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 
        bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-white/20 dark:border-zinc-800/50 shadow-xl rounded-2xl
        m-4 h-[calc(100vh-2rem)]
        transform transition-all duration-300 ease-in-out md:translate-x-0 md:static flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
         {/* Logo Area */}
         <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
             <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-10 h-10 min-w-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                 </div>
                 {/* Hide Text if Collapsed */}
                 <div className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                     <h1 className="font-bold text-gray-800 dark:text-zinc-100 tracking-tight leading-none whitespace-nowrap">AI Strategist</h1>
                     <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider whitespace-nowrap">Pro Dashboard</span>
                 </div>
             </div>
             {/* Toggle Button (Desktop Only) */}
             <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
             >
                {isSidebarCollapsed ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                )}
             </button>
         </div>

         {/* Navigation Links */}
         <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
             {NAVIGATION_STEPS.map((step) => {
                 const isUnlocked = isStepUnlocked(step.id);
                 const isActive = state.currentStep === step.id;
                 const isComingSoon = (step as any).isComingSoon;

                 return (
                     <button
                        key={step.id}
                        onClick={() => !isComingSoon && handleStepClick(step.id)}
                        disabled={!isUnlocked || isComingSoon}
                        className={`
                            group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300
                            ${isActive ? 'text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-500/5 border border-emerald-500/20' : 'text-zinc-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}
                            ${(!isUnlocked || isComingSoon) ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isSidebarCollapsed ? 'justify-center' : ''}
                        `}
                     >
                         <step.icon 
                            strokeWidth={1.2} 
                            size={20} 
                            className={`transition-transform duration-300 ${isActive ? 'text-emerald-600 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-zinc-400 group-hover:text-zinc-600'} ${isActive && !isSidebarCollapsed ? 'scale-110' : ''}`} 
                         />
                         
                         {!isSidebarCollapsed && (
                             <>
                                <span className="flex-1 text-left flex items-center justify-between whitespace-nowrap">
                                    {step.title}
                                    {isComingSoon && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded ml-2 font-bold tracking-wider">SOON</span>}
                                </span>
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                {!isUnlocked && !isComingSoon && <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                             </>
                         )}

                         {/* Tooltip for Collapsed Mode */}
                         {isSidebarCollapsed && (
                             <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                 {step.title}
                                 {isComingSoon && " (Coming Soon)"}
                                 {/* Triangle Arrow */}
                                 <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                             </div>
                         )}
                     </button>
                 );
             })}
         </nav>

         {/* Bottom Actions */}
         <div className="p-4 bg-gray-50 dark:bg-zinc-900/50 border-t border-gray-200 dark:border-zinc-800 space-y-3">
             {/* THEME TOGGLE */}
             <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative group w-full py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all flex items-center justify-center gap-2 
                    ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
             >
                <span className="group-hover:rotate-45 transition-transform duration-300 text-lg">
                    {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </span>
                {!isSidebarCollapsed && (theme === 'dark' ? 'Dark Mode' : 'Light Mode')}
             </button>

             {/* PROJECT MANAGEMENT BUTTON */}
             <button 
                onClick={() => setShowProjectManager(true)}
                className={`relative group w-full py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all duration-300 flex items-center justify-center gap-2 
                    ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
             >
                <FolderOpen size={18} strokeWidth={1.2} className="group-hover:scale-110 transition-transform" /> 
                {!isSidebarCollapsed && 'Quản lý Dự án'}
                
                {/* Tooltip */}
                {isSidebarCollapsed && (
                     <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                         Quản lý Dự án
                         <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                     </div>
                 )}
             </button>

             <button 
                onClick={() => setShowApiKeyModal(true)}
                className={`relative group w-full py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all duration-300 flex items-center justify-center gap-2 
                    ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
             >
                <Key size={18} strokeWidth={1.2} className="group-hover:scale-110 transition-transform" />
                {!isSidebarCollapsed && (hasApiKey ? 'Đổi API Key' : 'Kết nối API Key')}
                
                {/* Tooltip */}
                {isSidebarCollapsed && (
                     <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                         {hasApiKey ? 'Đổi API Key' : 'Kết nối API Key'}
                         <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                     </div>
                 )}
             </button>

             <button 
                onClick={handleDownloadZip}
                disabled={isZipping}
                className={`relative group w-full py-3 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-zinc-200/50
                    ${isSidebarCollapsed ? 'px-0' : 'px-4'}`}
             >
                 {isZipping ? (
                     <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                 ) : (
                     <Package size={18} strokeWidth={1.2} />
                 )}
                 {!isSidebarCollapsed && 'Tải Trọn Bộ (ZIP)'}

                 {/* Tooltip */}
                 {isSidebarCollapsed && (
                     <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl">
                         Tải Trọn Bộ (ZIP)
                         <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                     </div>
                 )}
             </button>
         </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50 dark:bg-zinc-950 relative p-6 transition-colors duration-300">
          
          {/* STATIC HEADER WITH PROJECT ACTIONS */}
          <div style={{background: 'linear-gradient(to right, #2196F3, #21CBF3)', padding: '20px', borderRadius: '10px', color: 'white', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative'}}>
              <h1 style={{margin: 0, fontSize: '24px', textTransform: 'uppercase', letterSpacing: '2px'}}>✨ AI MARKETING STUDIO ✨</h1>
              <p style={{margin: '5px 0 0', opacity: 0.9, fontSize: '14px'}}>
                  {state.projectName || "Dự án mới"} 
                  {state.id && <span className="opacity-60 text-xs ml-2">ID: {state.id.substr(0,6)}</span>}
              </p>
              
              {/* SAFE MODE PROJECT BUTTONS */}
              <div className="absolute right-5 top-5 flex gap-2">
                  <button 
                    onClick={handleExportJSON} 
                    title="Lưu dự án về máy tính"
                    className="bg-[#4CAF50] hover:bg-[#43A047] text-white border-none py-1.5 px-4 rounded cursor-pointer text-xs flex items-center gap-1 font-bold transition-colors"
                  >
                      ⬇️ LƯU FILE .JSON
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    title="Mở dự án từ máy tính"
                    className="bg-[#1976D2] hover:bg-[#1565C0] text-white border-none py-1.5 px-4 rounded cursor-pointer text-xs flex items-center gap-1 font-bold transition-colors"
                  >
                      ⬆️ MỞ FILE CŨ
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{display:'none'}} 
                    onChange={handleImportJSON} 
                    accept="application/json"
                  />
              </div>
          </div>

          {/* SEASONAL ALERT BANNER */}
          {state.strategy?.seasonalAdjustment && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">🎉</div>
                      <div>
                          <h3 className="font-bold text-sm uppercase tracking-wide">Hệ thống nhận diện sự kiện</h3>
                          <p className="text-sm font-medium">{state.strategy.seasonalAdjustment}</p>
                      </div>
                  </div>
                  <button onClick={() => alert("Đã tự động áp dụng Theme Lễ Hội vào toàn bộ kế hoạch!")} className="px-4 py-2 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                      Xem chi tiết
                  </button>
              </div>
          )}

          <div 
             key={state.id}
             className="max-w-5xl mx-auto transition-transform origin-top-center"
             style={{ transform: `scale(${zoomLevel})` }}
          >
              <StepContainer 
                title="Kiến Thức Ngành" stepNumber={0} 
                icon={<BookOpen size={28} />}
                status={getStepStatus(0)} isActive={state.currentStep === 0}
              >
                 <Step0Knowledge knowledge={state.knowledge} onSave={handleSaveKnowledge} />
              </StepContainer>

              <StepContainer 
                title="Điệp Viên & Nghiên Cứu" stepNumber={1} 
                icon={<ScanSearch size={28} />}
                status={getStepStatus(1)} isActive={state.currentStep === 1}
              >
                 <StepSpyResearch 
                   spyData={state.spy}
                   onAnalyzeCompetitor={handleSpyCompetitor}
                   onMineInsights={handleSpyInsights}
                   onPredictTrends={handleSpyTrends}
                 />
              </StepContainer>

              <StepContainer 
                title="Chiến Lược Cốt Lõi" stepNumber={2} 
                icon={<Target size={28} />}
                status={getStepStatus(2)} isActive={state.currentStep === 2}
              >
                <Step1Strategy 
                  onGenerate={handleGenerateStrategy}
                  data={state.strategy}
                  isLoading={state.isGeneratingStrategy}
                />
              </StepContainer>

              <StepContainer 
                title="Kế Hoạch Đăng Bài 30 Ngày" stepNumber={3} 
                icon={<CalendarDays size={28} />}
                status={getStepStatus(3)} isActive={state.currentStep === 3}
              >
                 <Step2Calendar 
                   onGenerateOverview={handleGenerateCalendar}
                   onGenerateDetail={handleGenerateDayDetail}
                   onGenerateMedia={handleGenerateMediaForDay}
                   onGenerateTikTokScript={handleGenerateTikTokScript}
                   onUpdateCalendar={handleUpdateCalendar}
                   onRegenerateHooks={handleRegenerateHooks} // NEW PROP
                   mediaConfig={state.mediaConfig}
                   onUpdateMediaConfig={handleUpdateMediaConfig}
                   calendar={state.calendar}
                   isLoading={state.isGeneratingCalendar}
                   projectName="AI Marketing Project"
                 />
              </StepContainer>

              {/* Step 4 Removed */}

              <StepContainer 
                title="Quản Lý Vòng Đời Chiến Dịch" stepNumber={5} 
                icon={<Megaphone size={28} />}
                status={getStepStatus(5)} isActive={state.currentStep === 5}
              >
                <Step4Ads 
                  campaigns={state.adsCampaigns}
                  isLoading={state.isGeneratingAds}
                  onCreateCampaign={handleCreateAdCampaign}
                  onDeleteCampaign={handleDeleteCampaign}
                  onToggleStatus={handleToggleCampaignStatus}
                  onGenerateMedia={handleGenerateMediaForCampaign}
                  onAnalyzePerformance={handleAnalyzeCampaign} // NEW PROP
                  projectName="AI Marketing Project"
                />
              </StepContainer>

              <StepContainer 
                title="Xưởng Tái Chế Nội Dung" stepNumber={6} 
                icon={<Repeat size={28} />}
                status={getStepStatus(6)} isActive={state.currentStep === 6}
              >
                <StepRepurposing 
                   data={state.repurposing}
                   onRepurposeCarousel={handleRepurposeCarousel}
                   onRepurposeInfographic={handleRepurposeInfographic}
                   onRepurposeVideoScript={handleRepurposeVideoScript}
                   onRepurposeEmailSequence={handleRepurposeEmailSequence}
                 />
              </StepContainer>

              <StepContainer 
                title="KOL AI Độc Quyền" stepNumber={7} 
                icon={<Crown size={28} />}
                status={getStepStatus(7)} isActive={state.currentStep === 7}
              >
                <Step7KOL 
                   kolData={state.kol}
                   onUpdateKOL={handleUpdateKOL}
                   onGenerateImage={handleGenerateKOLImage}
                 />
              </StepContainer>

              <StepContainer 
                title="Infographic Architect" stepNumber={8} 
                icon={<DraftingCompass size={28} />}
                status={getStepStatus(8)} isActive={state.currentStep === 8}
              >
                {state.infographic && (
                  <InfographicArchitect 
                    data={state.infographic}
                    onUpdate={(newData) => setState(prev => ({ ...prev, infographic: newData }))}
                  />
                )}
              </StepContainer>

              <StepContainer 
                title="Bộ Não Marketing (Knowledge Vault)" stepNumber={10} 
                icon={<BrainCircuit size={28} />}
                status={getStepStatus(10)} isActive={state.currentStep === 10}
              >
                <KnowledgeVault 
                   files={state.knowledgeVault}
                   onUpdate={handleUpdateKnowledgeVault}
                   onTrain={handleTrainVault}
                 />
              </StepContainer>
          </div>
          
           {/* Zoom Control Fixed at bottom right */}
           <div className="fixed bottom-6 right-6 flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-lg z-50">
              <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
              <span className="text-xs font-mono w-10 text-center text-gray-600 select-none">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
           </div>
           
           {/* AUTO-SAVE NOTIFICATION */}
           <div 
                style={{ opacity: showAutoSave ? 1 : 0 }} 
                className="fixed bottom-4 right-4 bg-black/70 text-white px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-500 pointer-events-none z-[100] flex items-center gap-2"
           >
                <span>💾</span> Đã lưu tự động...
           </div>

           {/* PROJECT MANAGER MODAL */}
           <ProjectManager 
              isOpen={showProjectManager}
              onClose={() => setShowProjectManager(false)}
              onLoadProject={handleLoadProject}
              onNewProject={handleNewProject}
              currentProjectId={state.id}
           />

           {/* API KEY MODAL */}
           <ApiKeyModal
              isOpen={showApiKeyModal}
              onClose={() => setShowApiKeyModal(false)}
              onSave={(key) => {
                  localStorage.setItem('GEMINI_API_KEY', key);
                  setHasApiKey(true);
                  setShowApiKeyModal(false);
                  alert("✅ Đã lưu API Key!");
              }}
           />
      </main>
    </div>
  );
};

export default App;