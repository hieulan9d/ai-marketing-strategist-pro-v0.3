import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Wand2, Save, Loader2, Play, LayoutTemplate, Box, Palette, Library, Bookmark, Plus } from 'lucide-react';
import { analyzeInfographicStyle, analyzeProductImage, generateTemplateName, generateImage, enhanceUserPrompt, createPresetFromPrompt } from '../services/geminiService';
import { InfographicTemplate, InfographicData, InfographicPreset } from '../types';

interface InfographicArchitectProps {
  data: InfographicData;
  onUpdate: (data: InfographicData) => void;
}

const InfographicArchitect: React.FC<InfographicArchitectProps> = ({ data, onUpdate }) => {
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [styleTab, setStyleTab] = useState<'upload' | 'library'>('upload');
  const [analyzedStyle, setAnalyzedStyle] = useState<{
      master: string, 
      negative: string,
      environment?: string,
      lighting?: string,
      composition?: string,
      negAdditions?: string
  } | null>(null);

  // V4 States
  const [activeTab, setActiveTab] = useState<'create' | 'presets'>('create');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [enhancedPromptPreview, setEnhancedPromptPreview] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'reading' | 'scripting' | 'rendering'>('idle');

  // Debounce & Auto-Enhance Logic
  useEffect(() => {
      const timer = setTimeout(async () => {
          if (activeTab === 'create' && data.infographicIdeaInput && data.infographicIdeaInput.length > 10 && data.isPromptEnhanceEnabled !== false) {
              setIsEnhancing(true);
              try {
                  const enhanced = await enhanceUserPrompt(data.infographicIdeaInput, (text) => {
                      setEnhancedPromptPreview(text);
                  });
                  setEnhancedPromptPreview(enhanced);
              } catch(e) {
                  console.error(e);
              }
              setIsEnhancing(false);
          }
      }, 800); // 800ms Debounce

      return () => clearTimeout(timer);
  }, [data.infographicIdeaInput, data.isPromptEnhanceEnabled, activeTab]);
  
  // Load templates & presets on mount
  useEffect(() => {
    // Templates
    const savedTemplates = localStorage.getItem('infographic_templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        if (Array.isArray(parsed) && parsed.length > 0 && data.templates.length === 0) {
           onUpdate({ ...data, templates: parsed });
        }
      } catch (e) { console.error("Failed to load templates", e); }
    }
    // Presets
    const savedPresets = localStorage.getItem('infographic_presets');
    if (savedPresets) {
        try {
            const parsed = JSON.parse(savedPresets);
            if (Array.isArray(parsed)) {
                // We need to merge carefully or just set if empty
                // Since onUpdate overwrites, we should do it once or handle merge in App.tsx
                // Here we just update local awareness if data.presets is empty
                if (!data.presets || data.presets.length === 0) {
                    onUpdate({ ...data, presets: parsed });
                }
            }
        } catch(e) {}
    }
  }, []);

  // Sync internal state with props
  useEffect(() => {
      // ...
  }, []);

  // --- DROPZONES ---
  const onDropStyle = (files: File[]) => {
    const reader = new FileReader();
    reader.onload = () => {
        setStyleImage(reader.result as string);
        setAnalyzedStyle(null); // Reset analysis
        onUpdate({ ...data, currentTemplateId: null }); // Deselect template
    };
    reader.readAsDataURL(files[0]);
  };

  const onDropProduct = (files: File[]) => {
    const reader = new FileReader();
    reader.onload = () => {
        onUpdate({ ...data, userProductImage: reader.result as string });
    };
    reader.readAsDataURL(files[0]);
  };

  const styleDropzone = useDropzone({ onDrop: onDropStyle, maxFiles: 1, accept: {'image/*': []} } as any);
  const productDropzone = useDropzone({ onDrop: onDropProduct, maxFiles: 1, accept: {'image/*': []} } as any);

  // --- ACTIONS ---

  const handleAnalyzeStyle = async () => {
      if (!styleImage) return;
      onUpdate({ ...data, isAnalyzing: true });
      try {
          const result = await analyzeInfographicStyle(styleImage);
          setAnalyzedStyle({ 
              master: result.masterPrompt, 
              negative: result.negativePrompt,
              environment: result.environmentPrompt,
              lighting: result.lightingPrompt,
              composition: result.compositionKeywords,
              negAdditions: result.negativePromptAdditions
          });
      } catch (e) { alert("Analysis failed"); }
      onUpdate({ ...data, isAnalyzing: false });
  };

  const handleSaveTemplate = async () => {
      if (!analyzedStyle) return;
      onUpdate({ ...data, isAnalyzing: true });
      try {
          const name = await generateTemplateName(analyzedStyle.environment || analyzedStyle.master || "New Style");
          const newTemplate: InfographicTemplate = {
              id: crypto.randomUUID(),
              name: name,
              masterPrompt: analyzedStyle.master,
              negativePrompt: analyzedStyle.negative,
              environmentPrompt: analyzedStyle.environment,
              lightingPrompt: analyzedStyle.lighting,
              compositionKeywords: analyzedStyle.composition,
              negativePromptAdditions: analyzedStyle.negAdditions,
              previewImage: styleImage || undefined
          };
          const newTemplates = [...data.templates, newTemplate];
          onUpdate({ ...data, templates: newTemplates, isAnalyzing: false });
          localStorage.setItem('infographic_templates', JSON.stringify(newTemplates));
          alert(`Saved template: ${name}`);
      } catch (e) { 
          onUpdate({ ...data, isAnalyzing: false });
          alert("Save failed"); 
      }
  };

  const handleSelectTemplate = (t: InfographicTemplate) => {
      onUpdate({ ...data, currentTemplateId: t.id });
      setAnalyzedStyle({ 
          master: t.masterPrompt, 
          negative: t.negativePrompt || "",
          environment: t.environmentPrompt,
          lighting: t.lightingPrompt,
          composition: t.compositionKeywords,
          negAdditions: t.negativePromptAdditions
      });
      setStyleImage(null); // Clear manual upload
  };

  const handleAnalyzeProduct = async () => {
      if (!data.userProductImage) return;
      onUpdate({ ...data, isAnalyzing: true });
      try {
          const desc = await analyzeProductImage(data.userProductImage);
          onUpdate({ ...data, productPhysicalDesc: desc, isAnalyzing: false });
      } catch (e) { 
          onUpdate({ ...data, isAnalyzing: false });
          alert("Product analysis failed"); 
      }
  };

  const handleGenerate = async () => {
      setProcessingStep('reading'); // Step 1: Reading
      
      // Simulate reading delay for UI perception if needed, or just proceed
      await new Promise(r => setTimeout(r, 500)); 

      let finalPrompt = "";
      let finalNegative = "distorted, bad quality";

      if (activeTab === 'presets') {
          // --- PRESET MODE ---
          const preset = (data.presets || []).find(p => p.id === data.currentPresetId);
          const productInput = data.infographicIdeaInput; // Reuse this field for new product input
          
          if (!preset) { 
              alert("Select a preset"); 
              setProcessingStep('idle');
              return; 
          }
          if (!productInput) { 
              alert("Enter new product/subject"); 
              setProcessingStep('idle');
              return; 
          }

          finalPrompt = preset.templatePrompt.replace("{product_input}", productInput);
      } 
      else {
          // --- CREATE MODE ---
          const hasIdea = !!data.infographicIdeaInput?.trim();
          const hasProduct = !!data.productNameInput?.trim() && !!data.productPhysicalDesc?.trim();

          if (!hasIdea && !hasProduct) {
              alert("Please describe your Idea (Concept Section) OR enter Product Details.");
              setProcessingStep('idle');
              return;
          }

          try {
              setProcessingStep('scripting'); // Step 2: Scripting (Marketing Brain)

              // 1. Determine Core Subject/Idea
              let promptBase = "";
              if (hasIdea) {
                  promptBase = data.infographicIdeaInput;
              } else {
                  promptBase = `Product: ${data.productNameInput}. Appearance: ${data.productPhysicalDesc}`;
              }

              // 2. Generation Logic Selection
              if (analyzedStyle || data.currentTemplateId) {
                  // --- CASE 2: TEXT + IMAGE/TEMPLATE (Style Transfer / Mix) ---
                  const lighting = analyzedStyle?.lighting || "";
                  const env = analyzedStyle?.environment || "";
                  const comp = analyzedStyle?.composition || "";
                  const negAdd = analyzedStyle?.negAdditions || "";

                  if (lighting || env) {
                      finalPrompt = `${lighting} ${env} featuring ${promptBase} placed in the center. ${comp}`;
                      finalNegative = `distorted, bad quality, ${negAdd}`;
                  } else {
                      // Fallback
                      const master = analyzedStyle?.master || "";
                      if (master.includes("{product_name}")) {
                          finalPrompt = master.replace("{product_name}", promptBase);
                      } else {
                          finalPrompt = `${master}. ${promptBase}`;
                      }
                      finalNegative = analyzedStyle?.negative || "";
                  }

              } else {
                  // --- CASE 1: TEXT ONLY (Text-to-Infographic) ---
                  if (data.isPromptEnhanceEnabled !== false) {
                      // Use cached preview if available to save time/api
                      if (enhancedPromptPreview && promptBase.includes(data.infographicIdeaInput || '')) {
                           finalPrompt = enhancedPromptPreview;
                      } else {
                           finalPrompt = await enhanceUserPrompt(promptBase);
                      }
                  } else {
                      finalPrompt = promptBase;
                  }
              }
          } catch (e) {
              console.error(e);
              alert("Error preparing prompt");
              setProcessingStep('idle');
              return;
          }
      }

      // 3. Generate
      setProcessingStep('rendering'); // Step 3: Rendering
      onUpdate({ ...data, isGenerating: true, generatedImage: null, generatedImages: [] });
      try {
          const refImage = (activeTab === 'create' && analyzedStyle && styleImage) ? styleImage : undefined; 
          const images = await generateImage(finalPrompt, refImage, 4, finalNegative);
          
          onUpdate({ 
              ...data, 
              isGenerating: false, 
              generatedImage: images[0],
              generatedImages: images,
              generatedPrompt: finalPrompt 
          });
      } catch (e) {
          onUpdate({ ...data, isGenerating: false });
          alert("Generation failed. Please try again.");
      } finally {
          setProcessingStep('idle');
      }
  };

  const handleSavePreset = async () => {
      if (!newPresetName) { alert("Enter preset name"); return; }
      if (!data.generatedPrompt) { alert("Generate an image first!"); return; }
      
      const productTerm = data.productNameInput || data.infographicIdeaInput || "product";
      
      onUpdate({ ...data, isAnalyzing: true }); // Use analyzing state for loading
      try {
          const templatePrompt = await createPresetFromPrompt(data.generatedPrompt, productTerm);
          
          const newPreset: InfographicPreset = {
              id: crypto.randomUUID(),
              name: newPresetName,
              templatePrompt: templatePrompt,
              imageStyle: "Nano Banana" // Hardcoded per requirement or extracted?
          };
          
          const updatedPresets = [...(data.presets || []), newPreset];
          onUpdate({ ...data, presets: updatedPresets, isAnalyzing: false });
          localStorage.setItem('infographic_presets', JSON.stringify(updatedPresets));
          
          setShowPresetModal(false);
          setNewPresetName("");
          alert("✅ Preset Saved!");
      } catch(e) {
          onUpdate({ ...data, isAnalyzing: false });
          alert("Failed to save preset");
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
            <Wand2 className="w-6 h-6" />
            Infographic Architect V4.0
            </h2>
            
            {/* TOP TABS */}
            <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Design New
                </button>
                <button 
                    onClick={() => setActiveTab('presets')}
                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'presets' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    My Presets
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: CONTROLS */}
            <div className="lg:col-span-4 space-y-6">

                {activeTab === 'presets' ? (
                    /* --- PRESET MODE UI --- */
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
                            <h3 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
                                <Bookmark className="w-4 h-4" /> Select a Preset
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto">
                                {(data.presets || []).map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => onUpdate({ ...data, currentPresetId: p.id })}
                                        className={`p-3 border rounded-lg cursor-pointer text-sm transition-all ${data.currentPresetId === p.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'hover:border-gray-300 bg-gray-50'}`}
                                    >
                                        <div className="font-bold text-gray-800">{p.name}</div>
                                        <div className="text-xs text-gray-500 truncate mt-1">{p.templatePrompt}</div>
                                    </div>
                                ))}
                                {(data.presets || []).length === 0 && (
                                    <p className="text-center text-gray-400 py-10 text-sm">No presets saved yet.</p>
                                )}
                            </div>
                        </div>

                        {data.currentPresetId && (
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in">
                                <h3 className="font-bold text-indigo-900 text-sm mb-2">Input New Product</h3>
                                <input 
                                    type="text"
                                    value={data.infographicIdeaInput || ''}
                                    onChange={e => onUpdate({...data, infographicIdeaInput: e.target.value})}
                                    placeholder="Enter new product name..."
                                    className="w-full px-4 py-3 rounded-lg border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* --- CREATE MODE UI --- */
                    <div className="space-y-6">
                        {/* SECTION 0: CONCEPT / IDEA */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                            <h3 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> 0. Concept & Idea
                            </h3>
                            <textarea 
                                value={data.infographicIdeaInput || ''}
                                onChange={e => onUpdate({...data, infographicIdeaInput: e.target.value})}
                                placeholder="Describe your Infographic Idea here... (e.g. A futuristic sneaker floating in neon city)"
                                className="w-full h-24 p-3 rounded-lg border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white/80"
                            />
                            
                            <div className="flex items-center justify-between mt-3">
                                <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                                    ✨ Auto Enhance Prompt {isEnhancing && <Loader2 className="w-3 h-3 animate-spin inline" />}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={data.isPromptEnhanceEnabled !== false} 
                                        onChange={e => onUpdate({...data, isPromptEnhanceEnabled: e.target.checked})}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* PREVIEW OF ENHANCED PROMPT (Streaming UI) */}
                            {data.isPromptEnhanceEnabled !== false && enhancedPromptPreview && (
                                <div className="mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-800 italic animate-in fade-in">
                                    <span className="font-bold not-italic">AI Draft: </span> 
                                    {enhancedPromptPreview}
                                    <span className="animate-pulse">|</span>
                                </div>
                            )}
                        </div>
                        
                        {/* SECTION 1: STYLE SOURCE */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> 1. Style Reference (Optional)
                                </h3>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button onClick={() => setStyleTab('upload')} className={`px-3 py-1 text-xs rounded-md transition-all ${styleTab === 'upload' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}>Upload</button>
                                    <button onClick={() => setStyleTab('library')} className={`px-3 py-1 text-xs rounded-md transition-all ${styleTab === 'library' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}>Library</button>
                                </div>
                            </div>

                            {styleTab === 'upload' ? (
                                <div className="space-y-3">
                                    <div {...styleDropzone.getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${styleDropzone.isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'} ${styleImage ? 'bg-indigo-50/30' : ''}`}>
                                        <input {...styleDropzone.getInputProps()} />
                                        {styleImage ? (
                                            <img src={styleImage} className="h-32 w-full object-contain rounded" alt="Style Ref" />
                                        ) : (
                                            <div className="py-4 text-gray-400 text-xs">
                                                <Upload className="w-6 h-6 mx-auto mb-1" />
                                                <p>Drop Style Reference Image</p>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={handleAnalyzeStyle} disabled={!styleImage || data.isAnalyzing} className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200">
                                        {analyzedStyle ? "Re-Analyze Style" : "Analyze Style (Auto-Negative)"}
                                    </button>
                                    {analyzedStyle && (
                                        <button onClick={handleSaveTemplate} className="w-full py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 flex items-center justify-center gap-2">
                                            <Save className="w-3 h-3" /> Save to Library
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                    {data.templates.map(t => (
                                        <div key={t.id} onClick={() => handleSelectTemplate(t)} className={`p-2 border rounded cursor-pointer text-xs ${data.currentTemplateId === t.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'hover:border-gray-300'}`}>
                                            {t.previewImage && <img src={t.previewImage} className="w-full h-16 object-cover rounded mb-1" />}
                                            <p className="font-bold truncate">{t.name}</p>
                                        </div>
                                    ))}
                                    {data.templates.length === 0 && <p className="col-span-2 text-center text-xs text-gray-400 py-4">No templates yet.</p>}
                                </div>
                            )}
                        </div>

                        {/* SECTION 2: PRODUCT SOURCE */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-700 text-sm mb-3 flex items-center gap-2">
                                <Box className="w-4 h-4" /> 2. Your Product (Optional)
                            </h3>
                            
                            <div className="space-y-3">
                                <div {...productDropzone.getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${productDropzone.isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'} ${data.userProductImage ? 'bg-purple-50/30' : ''}`}>
                                    <input {...productDropzone.getInputProps()} />
                                    {data.userProductImage ? (
                                        <img src={data.userProductImage} className="h-32 w-full object-contain rounded" alt="Product" />
                                    ) : (
                                        <div className="py-4 text-gray-400 text-xs">
                                            <Upload className="w-6 h-6 mx-auto mb-1" />
                                            <p>Drop Product Image</p>
                                        </div>
                                    )}
                                </div>

                                <input 
                                    type="text" 
                                    placeholder="Product Name & Type (e.g. Hộp Trà Quýt)"
                                    value={data.productNameInput}
                                    onChange={e => onUpdate({...data, productNameInput: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                                />

                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Physical Description (Required)</p>
                                    <textarea 
                                        value={data.productPhysicalDesc} 
                                        onChange={e => onUpdate({...data, productPhysicalDesc: e.target.value})}
                                        placeholder="E.g. Cylindrical shape, clear glass, orange liquid..."
                                        className="w-full bg-transparent text-xs text-gray-700 outline-none resize-none h-16"
                                    />
                                </div>

                                <button onClick={handleAnalyzeProduct} disabled={!data.userProductImage || data.isAnalyzing} className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200">
                                    Smart Recognition (Analyze Product)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* GENERATE ACTION */}
                <button
                    onClick={handleGenerate}
                    disabled={data.isGenerating || data.isAnalyzing || (activeTab === 'presets' && !data.currentPresetId)}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {data.isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    {data.isGenerating ? "Generating..." : (activeTab === 'presets' ? "Generate from Preset" : "Generate Infographic")}
                </button>

            </div>

            {/* RIGHT COLUMN: RESULTS (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-gray-900 rounded-xl p-2 min-h-[600px] flex items-center justify-center relative overflow-hidden group border border-gray-800 shadow-2xl">
                    
                    {/* PROGRESS STEPPER OVERLAY */}
                    {processingStep !== 'idle' && (
                        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-20 animate-in fade-in">
                            <div className="w-3/4 max-w-md">
                                <div className="flex justify-between mb-8 relative">
                                    {/* Progress Bar Background */}
                                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-700 -z-0"></div>
                                    
                                    {/* Step 1 */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${processingStep === 'reading' || processingStep === 'scripting' || processingStep === 'rendering' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 font-bold ${processingStep === 'reading' ? 'text-indigo-400' : 'text-gray-500'}`}>Reading</span>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${processingStep === 'scripting' || processingStep === 'rendering' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                                            <Wand2 className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 font-bold ${processingStep === 'scripting' ? 'text-indigo-400' : 'text-gray-500'}`}>Scripting</span>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${processingStep === 'rendering' ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-gray-800 border-gray-600 text-gray-500'}`}>
                                            <Palette className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs mt-2 font-bold ${processingStep === 'rendering' ? 'text-indigo-400' : 'text-gray-500'}`}>Rendering</span>
                                    </div>
                                </div>
                                
                                {/* Status Text */}
                                <div className="text-center">
                                    <p className="text-lg font-bold text-white mb-2 animate-pulse">
                                        {processingStep === 'reading' && "🔍 Đang đọc cấu trúc ảnh..."}
                                        {processingStep === 'scripting' && "🧠 Bộ não Marketing đang soạn nội dung..."}
                                        {processingStep === 'rendering' && "🎨 Đang vẽ thiết kế cuối cùng..."}
                                    </p>
                                    <p className="text-xs text-gray-400">Hệ thống Luma Café đang xử lý...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.generatedImage ? (
                        <img 
                            src={data.generatedImage} 
                            alt="Result" 
                            className="max-w-full max-h-[700px] object-contain rounded-lg"
                        />
                    ) : (
                        <div className="text-center text-gray-600">
                            <LayoutTemplate className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg font-medium">Result Preview Area</p>
                            <p className="text-sm opacity-60">Generated images will appear here</p>
                        </div>
                    )}
                    {data.generatedPrompt && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-3 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.generatedPrompt}
                        </div>
                    )}
                    
                    {/* SAVE PRESET BUTTON (Floating) */}
                    {data.generatedPrompt && !showPresetModal && (
                        <button 
                            onClick={() => setShowPresetModal(true)}
                            className="absolute top-4 right-4 bg-white/90 hover:bg-white text-indigo-700 px-3 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
                        >
                            <Bookmark className="w-4 h-4" /> Save as Preset
                        </button>
                    )}
                </div>

                {/* Grid */}
                {data.generatedImages && data.generatedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4">
                        {data.generatedImages.map((img, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => onUpdate({ ...data, generatedImage: img })}
                                className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${data.generatedImage === img ? 'border-purple-500 ring-2 ring-purple-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

        {/* PRESET SAVE MODAL */}
        {showPresetModal && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-80 animate-in zoom-in-95 duration-200">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-indigo-600" /> Save Preset
                    </h3>
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Preset Name (e.g. Luxury Concept)"
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowPresetModal(false)} className="px-3 py-2 text-gray-500 text-sm font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSavePreset} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default InfographicArchitect;
