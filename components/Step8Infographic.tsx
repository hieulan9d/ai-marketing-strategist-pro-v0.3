import React, { useState, useRef } from 'react';
import { InfographicData, KnowledgeData } from '../types';
import { generateInfographic } from '../services/geminiService';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import { 
    Loader2, Download, Copy, RefreshCw, PenTool, Layout, 
    TrendingUp, Zap, Users, Target, BarChart, DollarSign, Rocket, Lightbulb, CheckCircle, AlertTriangle, FileText, Info,
    Quote
} from 'lucide-react';

interface Step8InfographicProps {
  data: InfographicData | null;
  onUpdate: (data: InfographicData) => void;
  inputContent: string; // From Strategy
  knowledge?: KnowledgeData;
}

// Icon mapping
const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    TrendingUp, Zap, Users, Target, BarChart, DollarSign, Rocket, Lightbulb, CheckCircle, AlertTriangle, FileText, Info
  };
  const IconComponent = icons[iconName] || Info;
  return IconComponent;
};

const Step8Infographic: React.FC<Step8InfographicProps> = ({ data, onUpdate, inputContent, knowledge }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'STRATEGY' | 'MANUAL'>('STRATEGY');
  const [manualInput, setManualInput] = useState('');
  const posterRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    const contentToUse = sourceMode === 'STRATEGY' ? inputContent : manualInput;

    if (!contentToUse || contentToUse.trim().length === 0) {
      setError(sourceMode === 'STRATEGY' 
        ? "Chưa có dữ liệu chiến lược. Vui lòng hoàn thành bước 2 hoặc chuyển sang nhập thủ công." 
        : "Vui lòng nhập chủ đề bạn muốn tạo Infographic.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateInfographic(contentToUse, knowledge);
      onUpdate(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi tạo Infographic.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (posterRef.current) {
      try {
        const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `Infographic-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        alert("Lỗi khi tải ảnh. Vui lòng thử lại.");
      }
    }
  };

  const handleCopyScript = () => {
    if (!data) return;
    const script = `
TITLE: ${data.hook}
KEY STAT: ${data.key_stat}

STEPS:
${data.steps.map((s, i) => `${i+1}. ${s.label}: ${s.desc}`).join('\n')}
    `;
    navigator.clipboard.writeText(script);
    alert("Đã copy kịch bản!");
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. INPUT SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className={`
                  p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2 font-bold text-sm
                  ${sourceMode === 'STRATEGY' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
              `} onClick={() => setSourceMode('STRATEGY')}>
                  <Layout className="w-4 h-4" />
                  Từ Chiến Lược 30 Ngày
              </div>
              <div className={`
                  p-3 rounded-xl cursor-pointer transition-all flex items-center gap-2 font-bold text-sm
                  ${sourceMode === 'MANUAL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
              `} onClick={() => setSourceMode('MANUAL')}>
                  <PenTool className="w-4 h-4" />
                  Nhập Chủ Đề Mới
              </div>
          </div>

          <div className="space-y-4">
              {sourceMode === 'STRATEGY' ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm">
                      {inputContent ? (
                          <>
                              <p className="font-bold text-gray-700 mb-1">Dữ liệu sẵn sàng:</p>
                              <p className="line-clamp-2">{inputContent}</p>
                          </>
                      ) : (
                          <p>⚠️ Chưa có dữ liệu chiến lược. Hãy quay lại Bước 2 hoặc chọn "Nhập Chủ Đề Mới".</p>
                      )}
                  </div>
              ) : (
                  <textarea 
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="Nhập chủ đề, nội dung, hoặc ý tưởng của bạn vào đây..."
                      className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
                  />
              )}

              <div className="flex justify-between items-center mt-4">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                     {knowledge?.uploadedKnowledge ? (
                         <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                             <CheckCircle className="w-3 h-3 mr-1" /> Đã kết nối Bộ Não Marketing
                         </span>
                     ) : (
                         <span className="flex items-center text-orange-500">
                             <AlertTriangle className="w-3 h-3 mr-1" /> Chưa có kiến thức ngành (Step 0)
                         </span>
                     )}
                 </div>

                 <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                 >
                    {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    {isGenerating ? 'AI Đang Vẽ...' : 'Tạo Storyboard'}
                 </button>
              </div>

              {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                  </div>
              )}
          </div>
      </div>

      {/* 2. INFOGRAPHIC DISPLAY */}
      {data && (
          <div className="animate-slideUp">
             <div className="flex justify-end gap-3 mb-4">
                 <button onClick={handleCopyScript} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                     <Copy className="w-4 h-4" /> Copy Script
                 </button>
                 <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md">
                     <Download className="w-4 h-4" /> Tải PNG
                 </button>
             </div>

             {/* POSTER CANVAS */}
             <div 
                ref={posterRef}
                className="w-full min-h-[800px] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
                style={{ 
                    background: `linear-gradient(135deg, ${data.brand_colors.primary} 0%, ${data.brand_colors.secondary} 100%)` 
                }}
             >
                 {/* Decorative Blobs */}
                 <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                 {/* Header */}
                 <div className="relative z-10 p-12 text-center text-white pb-6">
                     <div className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-bold tracking-widest uppercase mb-4 border border-white/20">
                         Infographic Storyboard
                     </div>
                     <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 drop-shadow-md">
                         {data.hook}
                     </h1>
                     
                     {/* Key Stat Badge */}
                     <div className="inline-flex items-center gap-3 bg-white text-indigo-900 px-6 py-3 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                         <div className="bg-indigo-100 p-2 rounded-full">
                             <TrendingUp className="w-6 h-6 text-indigo-600" />
                         </div>
                         <div className="text-left">
                             <div className="text-xs font-bold text-indigo-400 uppercase">Key Stat</div>
                             <div className="text-3xl font-black">{data.key_stat}</div>
                         </div>
                     </div>
                 </div>

                 {/* Timeline Layout */}
                 <div className="flex-1 p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 max-w-6xl mx-auto w-full">
                     {data.steps.map((step, index) => {
                         const Icon = getIcon(step.icon);
                         return (
                             <motion.div 
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`
                                    bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-l-4 border-indigo-500
                                    flex gap-4 items-start hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
                                    ${index % 2 === 0 ? 'md:translate-y-8' : ''} 
                                `}
                             >
                                 <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                     <Icon className="w-6 h-6" />
                                 </div>
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                                             {index + 1}
                                         </span>
                                         <h3 className="font-bold text-gray-800 text-lg">{step.label}</h3>
                                     </div>
                                     <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                                 </div>
                             </motion.div>
                         );
                     })}
                 </div>

                 {/* Footer */}
                 <div className="p-8 text-center text-white/60 text-sm relative z-10 border-t border-white/10 mt-auto">
                     Generated by AI Marketing Strategist Pro • {new Date().getFullYear()}
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default Step8Infographic;
