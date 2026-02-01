
import React, { useState } from 'react';
import { KnowledgeData } from '../types';
import * as GeminiService from '../services/geminiService';
import LoadingSpinner from './ui/LoadingSpinner';

interface Step0Props {
  knowledge: KnowledgeData;
  onSave: (data: KnowledgeData) => void;
}

const INDUSTRIES = [
  "Spa & Làm đẹp",
  "Bất động sản",
  "Thời trang",
  "F&B (Nhà hàng/Cafe)",
  "Giáo dục & Đào tạo",
  "Công nghệ (SaaS/Gadget)",
  "Thực phẩm chức năng",
  "Khác..."
];

const Step0Knowledge: React.FC<Step0Props> = ({ knowledge, onSave }) => {
  const [localData, setLocalData] = useState<KnowledgeData>(knowledge);
  const [isOtherIndustry, setIsOtherIndustry] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  // Doc loading state
  const [loadedDocsCount, setLoadedDocsCount] = useState<number>(0);
  const [isReadingDoc, setIsReadingDoc] = useState(false);

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "Khác...") {
      setIsOtherIndustry(true);
      setLocalData({ ...localData, industry: '' });
    } else {
      setIsOtherIndustry(false);
      setLocalData({ ...localData, industry: val });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingDoc(true);
    let newContent = "";
    let count = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const text = await file.text(); // Native File API for text reading
            newContent += `\n--- FILE: ${file.name} ---\n${text}\n`;
            count++;
        } catch (err) {
            console.error("Error reading file", file.name, err);
        }
    }

    setLocalData(prev => ({
        ...prev,
        uploadedKnowledge: (prev.uploadedKnowledge || "") + newContent
    }));
    setLoadedDocsCount(prev => prev + count);
    setIsReadingDoc(false);
    
    // Clear input
    e.target.value = '';
    alert(`✅ Đã đọc thành công ${count} tài liệu vào bộ nhớ kiến thức!`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check (approx 20MB limit for browser stability)
    if (file.size > 20 * 1024 * 1024) {
      alert("File quá lớn. Vui lòng chọn file nhỏ hơn 20MB.");
      return;
    }

    const isVideo = file.type.startsWith('video/');
    setFileType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzingMedia(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          const analysis = await GeminiService.analyzeUploadedAsset(base64, file.type);
          
          if (isVideo) {
             setLocalData(prev => ({ ...prev, videoStyle: analysis }));
          } else {
             setLocalData(prev => ({ ...prev, visualStyle: analysis }));
          }
        } catch (err: any) {
          alert(err.message || "Lỗi phân tích file.");
        } finally {
          setIsAnalyzingMedia(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsAnalyzingMedia(false);
      alert("Lỗi đọc file.");
    }
  };

  const handleSave = () => {
    if (!localData.industry.trim()) {
      alert("Vui lòng chọn hoặc nhập ngành hàng!");
      return;
    }
    onSave({ ...localData, isConfirmed: true });
  };

  if (knowledge.isConfirmed) {
    return (
      <div className="animate-fadeIn">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
           <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 text-2xl">🧠</div>
           <div className="flex-1">
             <h3 className="font-bold text-emerald-800 text-lg mb-1">Đã nạp kiến thức ngành: {knowledge.industry}</h3>
             <div className="space-y-2 text-sm text-emerald-700/90">
                <p className="italic">"{knowledge.domainRules || "Sử dụng kiến thức chung (General Knowledge)."}"</p>
                {knowledge.uploadedKnowledge && (
                   <div className="flex gap-2 items-center text-xs bg-white/50 p-2 rounded">
                     <span>📂 <strong>Đã nạp tài liệu:</strong> Có dữ liệu tùy chỉnh.</span>
                   </div>
                )}
                {knowledge.visualStyle && (
                  <div className="flex gap-2 items-center text-xs bg-white/50 p-2 rounded">
                    <span>🎨 <strong>Style Ảnh:</strong> {knowledge.visualStyle.substring(0, 100)}...</span>
                  </div>
                )}
                {knowledge.videoStyle && (
                  <div className="flex gap-2 items-center text-xs bg-white/50 p-2 rounded">
                     <span>🎥 <strong>Style Video:</strong> {knowledge.videoStyle.substring(0, 100)}...</span>
                  </div>
                )}
             </div>
             <button 
               onClick={() => onSave({ ...knowledge, isConfirmed: false })}
               className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-800 underline uppercase tracking-wider"
             >
               Cập nhật kiến thức
             </button>
           </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-400 uppercase tracking-widest">
           AI đang tư duy như chuyên gia {knowledge.industry}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn relative">
      <div className="text-center mb-6">
        <p className="text-gray-600">
           Nạp "kiến thức ngầm", luật chơi và phong cách hình ảnh của thương hiệu để AI không viết những nội dung ngây ngô.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Industry Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
            🏢 Ngành Hàng
          </label>
          <select 
            value={isOtherIndustry ? "Khác..." : localData.industry} 
            onChange={handleIndustryChange}
            className="glass-input w-full rounded-xl p-3 text-gray-700 focus:outline-none mb-3"
          >
            <option value="" disabled>-- Chọn ngành --</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          {isOtherIndustry && (
             <input 
               type="text"
               placeholder="Nhập tên ngành cụ thể..."
               value={localData.industry}
               onChange={(e) => setLocalData({ ...localData, industry: e.target.value })}
               className="glass-input w-full rounded-xl p-3 text-gray-700 focus:outline-none animate-fadeIn"
             />
          )}
        </div>

        {/* Rules Input */}
        <div>
           <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-gray-700 ml-1">
                📚 Luật Ngầm / Kiến Thức
              </label>
              <button 
                onClick={() => setShowGuide(true)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 transition-colors"
                type="button"
              >
                 ℹ️ Mẫu File Chuẩn
              </button>
           </div>
          <textarea 
            rows={5}
            value={localData.domainRules}
            onChange={(e) => setLocalData({ ...localData, domainRules: e.target.value })}
            className="glass-input w-full rounded-xl p-3 text-gray-700 focus:outline-none text-sm placeholder-gray-400"
            placeholder={`Ví dụ (Ngành Spa): 
- Không dùng từ "bệnh nhân", hãy dùng "khách hàng". 
- Tránh từ "chữa trị", dùng "trị liệu/phục hồi". 
- Khách sợ đau và sưng, hãy nhấn mạnh "nhẹ nhàng, thư giãn".`}
          />
        </div>
      </div>

      {/* Knowledge Base & Multimedia Section */}
      <div className="grid md:grid-cols-2 gap-6">
          {/* Document Upload Section */}
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                   📂 Tài liệu chuyên ngành (Knowledge Base)
                 </h4>
                 <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold uppercase">Text Extraction</span>
             </div>
             
             <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-amber-200 border-dashed rounded-xl cursor-pointer bg-white hover:bg-amber-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isReadingDoc ? (
                        <LoadingSpinner size="sm" color="text-amber-500" />
                    ) : (
                        <>
                            <span className="text-3xl mb-2">📄</span>
                            <p className="mb-1 text-xs text-gray-500 font-semibold">Tải lên file .txt, .md, .json, .csv</p>
                            <p className="text-[10px] text-gray-400">(Để AI học từ vựng/kiến thức ngành)</p>
                        </>
                    )}
                </div>
                <input type="file" className="hidden" accept=".txt,.md,.json,.csv" multiple onChange={handleDocumentUpload} />
             </label>

             {loadedDocsCount > 0 && (
                 <div className="mt-3 text-xs text-amber-700 font-bold text-center">
                     ✅ Đã nạp {loadedDocsCount} tài liệu vào bộ nhớ.
                 </div>
             )}
          </div>

          {/* Multimedia Upload Section */}
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
             <div className="flex justify-between items-center mb-4">
                 <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                   🖼 Tài liệu Hình ảnh/Video (Visual Style)
                 </h4>
                 <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded font-bold uppercase">AI Vision</span>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-200 border-dashed rounded-xl cursor-pointer bg-white hover:bg-blue-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <p className="mb-1 text-xs text-gray-500"><span className="font-semibold">Click tải lên</span> Ảnh hoặc Video ngắn</p>
                        <p className="text-[10px] text-gray-400">(Tối đa 20MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                </label>
                
                {previewUrl && (
                   <div className="rounded-lg overflow-hidden border border-gray-200 h-24 bg-black flex items-center justify-center relative">
                      {fileType === 'video' ? (
                        <video src={previewUrl} className="h-full w-auto max-w-full" controls />
                      ) : (
                        <img src={previewUrl} className="h-full w-auto max-w-full object-contain" alt="Preview" />
                      )}
                      {isAnalyzingMedia && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                            <LoadingSpinner size="sm" color="text-white" />
                         </div>
                      )}
                   </div>
                )}

                {(localData.visualStyle || localData.videoStyle) && (
                    <div className="text-[10px] text-blue-700 bg-blue-100/50 p-2 rounded">
                        <strong>Đã phân tích:</strong> {localData.visualStyle ? "Style Ảnh" : ""} {localData.videoStyle ? "Style Video" : ""}
                    </div>
                )}
             </div>
          </div>
      </div>

      {/* MARKETING BRAIN EXTENSION PANEL */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
          </div>
          <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-4">
              <span className="animate-pulse">🟢</span> MODULE: MARKETING_BRAIN_V1
          </h4>
          <div className="grid md:grid-cols-2 gap-6 relative z-10">
              <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Yêu cầu hệ thống (Recommended Files)</p>
                  <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-center gap-2"><span className="text-emerald-500">📄</span> Marketing_Strategy_Core.txt</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">📄</span> Vietnam_Market_Insight.txt</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">📄</span> Viral_Content_Hooks.txt</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">📄</span> Visual_Prompting_Guide.txt</li>
                  </ul>
                  <p className="text-[10px] text-gray-500 mt-2 italic">* Upload các file này ở mục "Tài liệu chuyên ngành" phía trên để kích hoạt tối đa sức mạnh module.</p>
              </div>
              <div className="text-xs text-gray-400 border-l border-gray-700 pl-4">
                  <p className="mb-2"><strong className="text-white">Active Protocols:</strong></p>
                  <ul className="space-y-1 list-disc pl-4">
                      <li>Vietnam Cultural Check (Kiểm tra văn hóa)</li>
                      <li>Standby Mode (Tiết kiệm tài nguyên)</li>
                      <li>Brand Voice Compliance</li>
                  </ul>
              </div>
          </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full glass-button-primary text-white py-3 px-6 rounded-xl hover:shadow-lg font-bold tracking-wide transition-all flex items-center justify-center gap-2"
      >
        <span>💾 Nạp Kiến Thức & Phong Cách Vào AI</span>
      </button>

      {/* Guide Modal (Keep Existing) */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowGuide(false)}>
           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
              <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    📄 CẤU TRÚC FILE KIẾN THỨC CHUẨN
                 </h3>
                 <button onClick={() => setShowGuide(false)} className="text-emerald-100 hover:text-white">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="p-6 text-sm text-gray-700 space-y-4 max-h-[70vh] overflow-y-auto">
                 <p className="font-medium text-gray-500 italic">
                    (Copy nội dung này để soạn thảo, sau đó dán vào ô nhập liệu để AI hiểu sâu nhất về doanh nghiệp của bạn)
                 </p>
                 
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3 font-mono text-xs md:text-sm">
                    <p><strong className="text-gray-900">1. Ngành hàng:</strong> (Ví dụ: Spa, Bất động sản...)</p>
                    <div>
                       <strong className="text-gray-900">2. Luật Ngầm (Do's & Don'ts):</strong>
                       <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-600">
                          <li>Từ PHẢI dùng: (VD: 'trị liệu', 'cơ hội đầu tư').</li>
                          <li>Từ CẤM dùng: (VD: 'giá rẻ', 'cam kết khỏi bệnh').</li>
                       </ul>
                    </div>
                    <p><strong className="text-gray-900">3. Insight Khách hàng:</strong> Họ sợ điều gì nhất? (VD: Sợ đau, sợ pháp lý rủi ro).</p>
                    <p><strong className="text-gray-900">4. Giọng văn (Tone):</strong> (VD: Chuyên gia, Sang trọng hay Thân thiện).</p>
                 </div>

                 <div className="flex justify-end pt-2">
                    <button 
                       onClick={() => setShowGuide(false)}
                       className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-xs"
                    >
                       Đã hiểu
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Step0Knowledge;
