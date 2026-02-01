import React, { useState } from 'react';
import { RepurposingData } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface StepRepurposingProps {
  data: RepurposingData;
  onRepurposeCarousel: (content: string) => Promise<void>;
  onRepurposeInfographic: (content: string) => Promise<void>;
  onRepurposeVideoScript: (content: string) => Promise<void>;
  onRepurposeEmailSequence: (content: string) => Promise<void>;
}

const StepRepurposing: React.FC<StepRepurposingProps> = ({
  data,
  onRepurposeCarousel,
  onRepurposeInfographic,
  onRepurposeVideoScript,
  onRepurposeEmailSequence
}) => {
  const [activeTab, setActiveTab] = useState<'carousel' | 'infographic' | 'video' | 'email'>('carousel');
  const [inputContent, setInputContent] = useState('');

  const renderTabs = () => (
    <div className="flex bg-gray-100/50 p-1 rounded-xl mb-6 overflow-x-auto border border-gray-200/50">
      <button
        onClick={() => setActiveTab('carousel')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
          activeTab === 'carousel' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        🖼 Slide/Bản Tin Ảnh
      </button>
      <button
        onClick={() => setActiveTab('infographic')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
          activeTab === 'infographic' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        📊 Infographic
      </button>
      <button
        onClick={() => setActiveTab('video')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
          activeTab === 'video' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        🎥 Video Ngắn
      </button>
      <button
        onClick={() => setActiveTab('email')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
          activeTab === 'email' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        📧 Chuỗi Email
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 text-sm text-emerald-800 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
        ♻️ <strong>Xưởng Tái Chế Nội Dung:</strong> Dán nội dung dài của bạn (bài viết/ý tưởng) vào đây để chuyển đổi tự động.
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider ml-1 mb-2">Nội dung nguồn</label>
        <textarea
          rows={6}
          className="glass-input w-full rounded-2xl p-4 text-sm focus:outline-none placeholder-gray-400"
          placeholder="Dán bài viết, kịch bản hoặc ý tưởng chi tiết vào đây..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />
      </div>

      {renderTabs()}

      {/* CAROUSEL TAB */}
      {activeTab === 'carousel' && (
        <div className="space-y-6">
          <button
            onClick={() => onRepurposeCarousel(inputContent)}
            disabled={data.isGeneratingCarousel || !inputContent.trim()}
            className="w-full py-3 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {data.isGeneratingCarousel ? <LoadingSpinner size="sm" /> : 'Tạo Slide/Bản Tin Ảnh'}
          </button>

          {data.carouselResult && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 animate-fadeIn">
              {data.carouselResult.slides.map((slide, i) => (
                <div key={i} className="glass-panel p-5 rounded-2xl hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-white bg-emerald-500 px-2 py-1 rounded-md uppercase tracking-wider">Slide {slide.slideNumber}</span>
                  </div>
                  <p className="text-gray-800 font-medium mb-4 text-sm leading-relaxed">{slide.content}</p>
                  <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                    🖌 Gợi ý hình ảnh: {slide.visualSuggestion}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INFOGRAPHIC TAB */}
      {activeTab === 'infographic' && (
        <div className="space-y-6">
           <button
            onClick={() => onRepurposeInfographic(inputContent)}
            disabled={data.isGeneratingInfographic || !inputContent.trim()}
            className="w-full py-3 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {data.isGeneratingInfographic ? <LoadingSpinner size="sm" /> : 'Lên Kế Hoạch Infographic'}
          </button>

          {data.infographicResult && (
            <div className="mt-8 glass-panel p-8 rounded-3xl shadow-xl animate-fadeIn relative overflow-hidden bg-white/80">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                   <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path></svg>
               </div>
               <h3 className="text-2xl font-black text-gray-900 mb-6 text-center tracking-tight">{data.infographicResult.title}</h3>
               
               <div className="grid md:grid-cols-2 gap-8 relative z-10">
                  <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Dữ liệu chính</h4>
                      <ul className="space-y-3">
                          {data.infographicResult.keyPoints.map((point, i) => (
                              <li key={i} className="flex gap-3 text-sm text-gray-700 items-start">
                                  <span className="text-emerald-500 font-bold mt-1">•</span> {point}
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="space-y-6">
                       <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                           <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Bố cục gợi ý</h4>
                           <p className="text-sm text-blue-900 font-medium">{data.infographicResult.layoutSuggestion}</p>
                       </div>
                       <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                           <h4 className="text-xs font-bold text-purple-800 uppercase mb-2">Icons nên dùng</h4>
                           <div className="flex flex-wrap gap-2">
                               {data.infographicResult.iconSuggestions.map((icon, i) => (
                                   <span key={i} className="px-3 py-1 bg-white rounded-lg text-xs text-purple-700 border border-purple-100 shadow-sm font-semibold">{icon}</span>
                               ))}
                           </div>
                       </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {/* VIDEO SCRIPT TAB */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <button
            onClick={() => onRepurposeVideoScript(inputContent)}
            disabled={data.isGeneratingVideoScript || !inputContent.trim()}
            className="w-full py-3 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {data.isGeneratingVideoScript ? <LoadingSpinner size="sm" /> : 'Chuyển thành Kịch bản Reel/TikTok'}
          </button>

          {data.videoScriptResult && (
             <div className="mt-8 space-y-5 animate-fadeIn">
                 <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                     <div className="flex items-center gap-2 mb-3 text-red-500">
                         <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                         <span className="font-bold text-xs uppercase tracking-widest">Điểm Thu Hút Thị Giác (Hook 0-3s)</span>
                     </div>
                     <p className="text-xl font-bold leading-relaxed">"{data.videoScriptResult.hookVisual}"</p>
                 </div>

                 <div className="glass-panel p-6 rounded-2xl">
                     <h4 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-widest">🗣 Lời thoại</h4>
                     <p className="whitespace-pre-wrap text-gray-800 leading-7 font-medium text-sm">{data.videoScriptResult.scriptBody}</p>
                 </div>

                 <div className="grid md:grid-cols-2 gap-5">
                     <div className="bg-green-50/80 p-5 rounded-2xl border border-green-100">
                         <h4 className="font-bold text-green-800 text-xs uppercase mb-2">📢 Kêu gọi hành động (CTA)</h4>
                         <p className="text-green-900 font-bold">{data.videoScriptResult.cta}</p>
                     </div>
                     <div className="bg-yellow-50/80 p-5 rounded-2xl border border-yellow-100">
                         <h4 className="font-bold text-yellow-800 text-xs uppercase mb-2">🎬 Ghi chú quay</h4>
                         <p className="text-yellow-900 text-sm italic">{data.videoScriptResult.productionNotes}</p>
                     </div>
                 </div>
             </div>
          )}
        </div>
      )}

      {/* EMAIL SEQUENCE TAB */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          <button
            onClick={() => onRepurposeEmailSequence(inputContent)}
            disabled={data.isGeneratingEmail || !inputContent.trim()}
            className="w-full py-3 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            {data.isGeneratingEmail ? <LoadingSpinner size="sm" /> : 'Tạo Chuỗi 3 Email Chăm Sóc'}
          </button>

          {data.emailSequenceResult && (
             <div className="mt-8 space-y-6 animate-fadeIn">
                 {[
                   { data: data.emailSequenceResult.email1, label: 'Trao Giá Trị', day: 'Ngày 1' },
                   { data: data.emailSequenceResult.email2, label: 'Bán hàng mềm (Soft Sell)', day: 'Ngày 2-3' },
                   { data: data.emailSequenceResult.email3, label: 'Chốt đơn (Hard Sell)', day: 'Ngày 5' }
                 ].map((email, idx) => (
                    <div key={idx} className="glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                       <div className="bg-gray-50/80 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                           <span className="font-bold text-gray-700 text-sm">📧 Email {idx + 1}: {email.label}</span>
                           <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">{email.day}</span>
                       </div>
                       <div className="p-6">
                           <div className="mb-4 text-sm bg-white p-3 rounded-lg border border-gray-100"><span className="font-bold text-gray-500 uppercase text-xs mr-2">Chủ đề:</span> {email.data.subject}</div>
                           <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{email.data.body}</div>
                       </div>
                   </div>
                 ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepRepurposing;