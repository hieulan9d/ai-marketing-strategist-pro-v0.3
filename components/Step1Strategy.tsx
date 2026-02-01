
import React, { useState, useRef } from 'react';
import { StrategyData, RealityAnalysis } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';
import * as GeminiService from '../services/geminiService';

interface Step1Props {
  onGenerate: (productInfo: string, realityContext?: RealityAnalysis) => Promise<void>;
  data: StrategyData | null;
  isLoading: boolean;
}

const TEMPLATE_CONTENT = `1. Tên sản phẩm: [Tên] - [Công dụng chính]
2. Điểm đặc biệt nhất (USP): [Điều gì khiến bạn khác biệt với đối thủ?]
3. Khách hàng mục tiêu: [Độ tuổi, nghề nghiệp, sở thích]
4. Nỗi đau lớn nhất: [Vấn đề gì khiến họ mất ăn mất ngủ?]
5. Điều họ khao khát: [Họ muốn đạt được kết quả gì?]
6. Rào cản mua hàng: [Tại sao họ sợ chưa mua? Giá đắt/Sợ hàng giả?]
7. Phong cách viết: [Chuyên gia / Hài hước / Thân thiện / Sang trọng]`;

const Step1Strategy: React.FC<Step1Props> = ({ onGenerate, data, isLoading }) => {
  const [input, setInput] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // --- REALITY CHECK STATE V2 ---
  const [assets, setAssets] = useState<string[]>([]);
  const [isAnalyzingReality, setIsAnalyzingReality] = useState(false);
  const [realityResult, setRealityResult] = useState<RealityAnalysis | null>(null);
  const [showRealityPanel, setShowRealityPanel] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(TEMPLATE_CONTENT);
    alert("✅ Đã copy mẫu! Hãy dán vào ô nhập liệu và điền thông tin.");
    setShowGuide(false);
  };

  // --- REALITY CHECK HANDLERS ---
  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length > 10) { alert("Tối đa 10 ảnh một lúc!"); return; }
      
      const newAssets: string[] = [];
      let processed = 0;
      
      // Explicitly cast to File[] to fix TypeScript 'unknown' errors
      const fileList = Array.from(files) as File[];

      fileList.forEach(file => {
          if (file.size > 10 * 1024 * 1024) {
             // Skip big files but count them as processed to not block completion logic
             processed++;
             if (processed === fileList.length && newAssets.length > 0) {
                setAssets(prev => [...prev, ...newAssets].slice(0, 15));
             }
             return; 
          }

          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) newAssets.push(ev.target.result as string);
              processed++;
              if (processed === fileList.length) {
                  setAssets(prev => [...prev, ...newAssets].slice(0, 15)); // Cap at 15 total
              }
          };
          reader.readAsDataURL(file);
      });
    }
  };

  const removeAsset = (index: number) => {
      setAssets(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyzeReality = async () => {
    if (assets.length === 0) {
      alert("Vui lòng upload ít nhất 1 ảnh để phân tích.");
      return;
    }
    setIsAnalyzingReality(true);
    try {
      const result = await GeminiService.analyzeRealityAssets(assets);
      setRealityResult(result);
    } catch (e) {
      alert("Lỗi phân tích thực tế: " + (e as Error).message);
    } finally {
      setIsAnalyzingReality(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // --- INPUT QUALITY CHECKER ---
    const wordCount = input.trim().split(/\s+/).length;
    const lowerInput = input.toLowerCase();
    const missingKeywords = !['nỗi đau', 'lợi ích', 'khách hàng'].some(k => lowerInput.includes(k));

    if (wordCount < 50 || missingKeywords) {
       const confirmContinue = window.confirm(
         "⚠️ CẢNH BÁO CHẤT LƯỢNG:\n\n" +
         "Thông tin bạn nhập có vẻ hơi ngắn hoặc thiếu chi tiết quan trọng.\n" +
         "AI có thể đưa ra kết quả kém hấp dẫn.\n\n" +
         "Bạn có muốn bổ sung thêm không?\n" +
         "- OK: Có, để tôi bổ sung.\n" +
         "- Cancel: Không, cứ tạo đi."
       );
       if (confirmContinue) return;
    }
    
    if (assets.length > 0 && !realityResult) {
       if(!confirm("Bạn đã upload ảnh nhưng chưa chạy 'Phân Tích Thực Tế'. AI sẽ không thể tối ưu chiến lược theo dữ liệu thật. Bạn có chắc chắn muốn tiếp tục?")) return;
    }

    onGenerate(input, realityResult || undefined); 
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {!data ? (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          <div className="text-center mb-8">
             <p className="text-gray-500">Mô tả sản phẩm của bạn để AI phân tích thị trường.</p>
          </div>
          
          {/* --- MODULE: REALITY CHECK V2 (BATCH) --- */}
          <div className="glass-panel p-6 rounded-2xl border-2 border-indigo-50 bg-indigo-50/20">
             <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowRealityPanel(!showRealityPanel)}>
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                   📸 THƯ VIỆN TÀI NGUYÊN (ASSET GALLERY)
                </h3>
                <span className="text-xs text-indigo-400">{showRealityPanel ? 'Thu gọn' : 'Mở rộng'}</span>
             </div>
             
             {showRealityPanel && (
               <div className="space-y-4 animate-fadeIn">
                  <p className="text-xs text-gray-500">Upload toàn bộ ảnh Menu, Không gian và Sản phẩm. AI sẽ tự động phân loại và phân tích.</p>
                  
                  {/* UPLOAD ZONE */}
                  <div className="grid grid-cols-4 gap-2">
                      {assets.map((src, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                              <img src={src} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => removeAsset(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              {/* Tag Badge */}
                              {realityResult?.assetTags?.find(t => t.index === idx) && (
                                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-0.5 truncate">
                                      {realityResult.assetTags.find(t => t.index === idx)?.type}
                                  </span>
                              )}
                          </div>
                      ))}
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50 transition-colors text-indigo-400"
                      >
                          <span className="text-2xl">+</span>
                          <span className="text-[10px] font-bold">Thêm ảnh</span>
                          <input 
                             ref={fileInputRef} 
                             type="file" 
                             multiple 
                             className="hidden" 
                             accept="image/*" 
                             onChange={handleBatchUpload} 
                          />
                      </div>
                  </div>

                  <button
                     type="button" 
                     onClick={handleAnalyzeReality}
                     disabled={isAnalyzingReality || assets.length === 0}
                     className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {isAnalyzingReality ? <LoadingSpinner size="sm" color="text-white"/> : `⚡ Phân Loại & Phân Tích (${assets.length} ảnh)`}
                  </button>

                  {/* ANALYSIS RESULT V2 */}
                  {realityResult && (
                     <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                           <div className="bg-gray-50 p-2 rounded">
                               <span className="block text-gray-400 font-bold mb-1">PHÂN KHÚC GIÁ</span>
                               <span className="text-indigo-700 font-bold text-sm">{realityResult.priceSegment}</span>
                           </div>
                           <div className="bg-gray-50 p-2 rounded">
                               <span className="block text-gray-400 font-bold mb-1">VIBE CHỦ ĐẠO</span>
                               <span className="text-indigo-700 font-bold text-sm">{realityResult.detectedVibe}</span>
                           </div>
                        </div>
                        
                        {/* Brand Colors */}
                        {realityResult.brandColors && (
                            <div className="flex gap-2 items-center">
                                <span className="text-[10px] font-bold text-gray-400">BRAND COLORS:</span>
                                {realityResult.brandColors.map((color, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color }} title={color}></div>
                                ))}
                            </div>
                        )}

                        <div className="bg-orange-50 p-2 rounded text-[11px] text-orange-800 border-l-2 border-orange-400">
                           <strong>⚠️ Điều chỉnh tự động:</strong> {realityResult.adjustments}
                        </div>
                     </div>
                  )}
               </div>
             )}
          </div>

          {/* MAIN INPUT */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label htmlFor="product" className="block text-sm font-semibold text-gray-700 ml-1">
                Mô tả Sản phẩm / Dịch vụ
                </label>
                <button 
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="bg-[#FF9800] hover:bg-orange-600 text-white border-none py-1.5 px-4 rounded-full cursor-pointer text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  💡 BÍ KÍP NHẬP LIỆU CHUẨN
                </button>
            </div>
            
            <textarea
              id="product"
              rows={8}
              className="glass-input w-full rounded-2xl p-4 text-gray-700 focus:outline-none placeholder-gray-400"
              placeholder="VD: Hộp cà phê hữu cơ subscription cho nhân viên văn phòng bận rộn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-right text-xs text-gray-400 mt-1">
                {input.trim().split(/\s+/).filter(Boolean).length} từ (Khuyên dùng: &gt;50 từ)
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-full glass-button-primary text-white py-4 px-6 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide transition-all flex items-center justify-center gap-3 text-lg"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="text-white" />
                <span>Đang phân tích DNA thị trường...</span>
              </>
            ) : (
              'Tạo Chiến Lược Cốt Lõi'
            )}
          </button>
        </form>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Reality Check Badge if available */}
            {data.realityCheck && (
               <div className="md:col-span-2 bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
                  <span className="text-xl">🏢</span>
                  <div>
                     <h4 className="font-bold text-indigo-900 text-sm">Chiến lược đã được đồng bộ với thực tế</h4>
                     <p className="text-xs text-indigo-700 mt-1">{data.realityCheck.adjustments}</p>
                     {data.realityCheck.brandColors && (
                        <div className="flex gap-1 mt-2">
                            {data.realityCheck.brandColors.map((c, i) => (
                                <div key={i} className="w-3 h-3 rounded-full border border-black/10" style={{backgroundColor: c}}></div>
                            ))}
                        </div>
                     )}
                  </div>
               </div>
            )}

            <div className="md:col-span-2 glass-panel bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-8 rounded-2xl border-emerald-100">
                <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2 text-lg uppercase tracking-wider">
                    <span className="bg-emerald-200 p-1 rounded">🎯</span> Unique Selling Point (USP)
                </h3>
                <p className="text-emerald-900 text-xl font-medium leading-relaxed">{data.usp}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/60">
                <h3 className="text-gray-800 font-bold mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                    👤 Chân dung khách hàng (Persona)
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{data.persona}</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/60">
                <h3 className="text-gray-800 font-bold mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                    📐 Góc độ tiếp cận (Angles)
                </h3>
                <ul className="space-y-4">
                    {data.angles.map((angle, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-gray-600 bg-white/40 p-3 rounded-xl border border-white/50">
                            <span className="font-bold text-emerald-600 bg-emerald-50 w-6 h-6 flex items-center justify-center rounded-full text-xs">{idx + 1}</span>
                            <span>{angle}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="md:col-span-2 text-center text-xs text-emerald-600/60 font-medium uppercase tracking-widest mt-4">
                Chiến lược đã khóa • Đang chuyển sang Lịch đăng bài
            </div>
        </div>
      )}

      {/* SMART INPUT GUIDE MODAL */}
      {showGuide && (
          <div className="fixed inset-0 z-[1000] bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
              <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50">
                      <h3 className="text-emerald-700 font-bold text-lg flex items-center gap-2">
                          🎯 CÔNG THỨC NHẬP LIỆU "TRIỆU ĐÔ"
                      </h3>
                      <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                  </div>
                  
                  <div className="p-6 text-sm text-gray-700 space-y-4 overflow-y-auto max-h-[70vh]">
                      <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
                         <p className="mb-2">⚠️ <strong>Cảnh báo:</strong> Nếu bạn nhập sơ sài (VD: "Bán cà phê"), AI sẽ viết bài rất chán. Hãy nhập chi tiết để AI trở thành chuyên gia!</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                             <div className="text-red-700">❌ <strong>Đừng nhập:</strong><br/>"Sản phẩm là kem chống nắng."</div>
                             <div className="text-emerald-700">✅ <strong>Hãy nhập:</strong><br/>"Kem chống nắng kiềm dầu 8 tiếng, nâng tông tự nhiên, dành cho sinh viên hay đi xe máy ngoài nắng."</div>
                         </div>
                      </div>

                      <div>
                          <h4 className="font-bold text-gray-800 mb-2">📝 MẪU NHẬP LIỆU (TEMPLATE):</h4>
                          <div className="relative">
                            <textarea 
                                readOnly 
                                value={TEMPLATE_CONTENT}
                                className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-xs bg-yellow-50 focus:outline-none resize-none"
                            />
                          </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                          <button 
                             onClick={() => setShowGuide(false)}
                             className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold"
                          >
                             Đóng
                          </button>
                          <button 
                             onClick={handleCopyTemplate}
                             className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                          >
                             📋 COPY MẪU NÀY
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Step1Strategy;
