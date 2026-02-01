
import React, { useState, useRef } from 'react';
import { KOLData } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface Step7KOLProps {
  kolData: KOLData;
  onUpdateKOL: (newData: Partial<KOLData>) => void;
  onGenerateImage: (prompt: string) => Promise<void>;
}

const Step7KOL: React.FC<Step7KOLProps> = ({ kolData, onUpdateKOL, onGenerateImage }) => {
  const [studioPrompt, setStudioPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Ảnh quá lớn (Max 10MB). Vui lòng chọn ảnh khác.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpdateKOL({ dnaImage: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateClick = async () => {
    if (!studioPrompt.trim()) return;
    await onGenerateImage(studioPrompt);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. IDENTITY SECTION - DNA UPLOAD */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
           {kolData.dnaImage ? (
             <>
               <img src={kolData.dnaImage} alt="DNA" className="w-full h-48 object-cover rounded-xl shadow-md mb-4" />
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-50 transition-colors"
                  >
                    Thay đổi ảnh gốc
                  </button>
               </div>
               <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider bg-emerald-100 px-2 py-1 rounded">
                  ✅ DNA Đã Kích Hoạt
               </span>
             </>
           ) : (
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
             >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                   <span className="text-3xl">👤</span>
                </div>
                <p className="font-bold text-gray-600 mb-1">Upload Ảnh Gốc (DNA)</p>
                <p className="text-xs text-gray-400 px-4">Chọn 1 ảnh rõ mặt nhất để AI học đặc điểm.</p>
             </div>
           )}
           <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>

        <div className="md:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2 flex items-center gap-2">
               📝 Hồ Sơ Nhân Vật Ảo
            </h3>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tên KOL / Biệt Danh</label>
               <input 
                 type="text" 
                 className="glass-input w-full p-3 rounded-xl"
                 placeholder="VD: Uyên Linh, AI Streamer..."
                 value={kolData.name}
                 onChange={(e) => onUpdateKOL({ name: e.target.value })}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Đặc điểm nhận dạng (Mô tả cho AI)</label>
               <textarea 
                 rows={3} 
                 className="glass-input w-full p-3 rounded-xl"
                 placeholder="VD: Cô gái trẻ 22 tuổi, tóc đen dài thẳng, gương mặt trái xoan, phong cách thời trang Minimalist, hay cười..."
                 value={kolData.description}
                 onChange={(e) => onUpdateKOL({ description: e.target.value })}
               />
            </div>
        </div>
      </div>

      {/* 2. PHOTO STUDIO */}
      {kolData.dnaImage && (
        <div className="glass-panel p-6 rounded-2xl border-2 border-pink-100 bg-pink-50/20">
           <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl bg-pink-100 p-2 rounded-lg">📸</span>
              <div>
                 <h3 className="font-bold text-gray-800">Studio Chụp Ảnh AI</h3>
                 <p className="text-xs text-gray-500">Tạo ảnh mới nhưng vẫn giữ khuôn mặt của KOL.</p>
              </div>
           </div>
           
           <div className="flex gap-4 items-start">
              <div className="flex-1">
                 <textarea 
                    className="glass-input w-full p-4 rounded-xl text-sm min-h-[80px]"
                    placeholder="Mô tả bối cảnh và hành động (VD: Đang ngồi uống cafe ở Paris, cầm laptop làm việc, ánh sáng nắng sớm...)"
                    value={studioPrompt}
                    onChange={(e) => setStudioPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleGenerateClick();
                        }
                    }}
                 />
              </div>
              <button 
                onClick={handleGenerateClick}
                disabled={kolData.isGenerating || !studioPrompt.trim()}
                className="bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-pink-200 transition-all flex flex-col items-center justify-center gap-1 min-w-[140px]"
              >
                {kolData.isGenerating ? (
                   <LoadingSpinner size="sm" color="text-white" />
                ) : (
                   <>
                     <span className="text-xl">✨</span>
                     <span className="text-xs">Chụp Ngay</span>
                   </>
                )}
              </button>
           </div>
        </div>
      )}

      {/* 3. GALLERY */}
      {kolData.generatedImages.length > 0 && (
         <div>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               🖼 Thư Viện Ảnh ({kolData.generatedImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {kolData.generatedImages.map((img, idx) => (
                  <div key={idx} className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-square bg-gray-100">
                     <img src={img} alt={`Generated ${idx}`} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                        <button 
                           onClick={() => {
                              const a = document.createElement('a');
                              a.href = img;
                              a.download = `KOL_${kolData.name || 'AI'}_${idx}.jpg`;
                              a.click();
                           }}
                           className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
                        >
                           ⬇️
                        </button>
                        <button 
                           onClick={() => window.open(img, '_blank')}
                           className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors"
                        >
                           👁️
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default Step7KOL;
