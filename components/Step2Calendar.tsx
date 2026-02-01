
import React, { useState, useRef } from 'react';
import { DayPlan, DayDetail } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';
import * as GeminiService from '../services/geminiService';

interface Step2Props {
  onGenerateOverview: () => Promise<void>;
  onGenerateDetail: (dayIndex: number) => Promise<void>;
  onGenerateMedia: (dayIndex: number, type: 'image' | 'video', prompt?: string) => Promise<void>;
  onGenerateTikTokScript: (dayIndex: number) => Promise<void>;
  onUpdateCalendar?: (newCalendar: DayPlan[]) => void;
  calendar: DayPlan[];
  isLoading: boolean;
  projectName?: string;
}

const Step2Calendar: React.FC<Step2Props> = ({ 
    onGenerateOverview, 
    onGenerateDetail, 
    onGenerateMedia, 
    onGenerateTikTokScript,
    onUpdateCalendar,
    calendar, 
    isLoading, 
    projectName = 'du-an' 
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'tiktok'>('content');
  
  // --- DYNAMIC INSERT STATE ---
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertText, setInsertText] = useState('');
  const [insertImage, setInsertImage] = useState<string | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const insertFileInputRef = useRef<HTMLInputElement>(null);

  const selectedDay = selectedDayIndex !== null && calendar[selectedDayIndex] ? calendar[selectedDayIndex] : null;

  if (calendar.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-emerald-50/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">📅</div>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg">
          Biến chiến lược thành lộ trình nội dung 30 ngày cụ thể.
        </p>
        <button
          onClick={onGenerateOverview}
          disabled={isLoading}
          className="glass-button-primary text-white py-3 px-10 rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-bold tracking-wide"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" color="text-white" />
              <span>Đang xây dựng kế hoạch 30 ngày...</span>
            </div>
          ) : (
            'Tạo Kế Hoạch 30 Ngày'
          )}
        </button>
      </div>
    );
  }

  const handleDayClick = (index: number) => {
    setSelectedDayIndex(index);
    setActiveTab('content'); // Reset tab
    const day = calendar[index];
    if (!day.details && !day.isLoading) {
      onGenerateDetail(index);
    }
  };

  const closeDetail = () => setSelectedDayIndex(null);

  // --- DYNAMIC INSERT HANDLERS ---
  const handleInsertFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onload = (event) => setInsertImage(event.target?.result as string);
       reader.readAsDataURL(file);
    }
  };

  const handleInsertSubmit = async () => {
    if (!insertText.trim()) return;
    if (!onUpdateCalendar) return;

    setIsInserting(true);
    try {
        const updatedCalendar = await GeminiService.adaptCalendar(calendar, insertText, insertImage);
        
        onUpdateCalendar(updatedCalendar);
        
        // Find changed days to show alert
        const changedDays = updatedCalendar
            .filter((d, i) => d.topic !== calendar[i].topic)
            .map(d => d.day);
            
        alert(`✅ Đã cập nhật lại lịch trình! Sản phẩm mới đã được chèn vào các ngày: ${changedDays.join(', ')}`);
        
        setIsInsertModalOpen(false);
        setInsertText('');
        setInsertImage(null);
    } catch (e) {
        alert("Lỗi khi chèn nội dung: " + (e as Error).message);
    } finally {
        setIsInserting(false);
    }
  };


  // --- MEDIA VIEWER COMPONENT ---
  const MediaViewer = ({ src, type, onDownload }: { src: string, type: 'image' | 'video', onDownload: () => void }) => (
     <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow-md">
        {type === 'image' ? (
             <img src={src} alt="Generated Asset" className="w-full h-auto object-cover" />
        ) : (
             <video controls src={src} className="w-full h-auto" />
        )}
        
        {/* Hover Controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button onClick={() => window.open(src, '_blank')} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" title="Xem toàn màn hình">
                <span className="text-xs font-bold">👁️</span>
            </button>
            <button onClick={onDownload} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" title="Tải xuống">
                <span className="text-xs font-bold">⬇️</span>
            </button>
        </div>
     </div>
  );

  // --- SEEDING CHAT UI COMPONENT ---
  const SeedingChat = ({ script }: { script: string }) => {
    const lines = script ? script.split('\n').filter(line => line.trim() !== '') : [];

    return (
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {lines.map((line, idx) => {
          // Detect "Name: Message" format
          const parts = line.split(':');
          const hasUser = parts.length > 1;
          const user = hasUser ? parts[0].trim() : '?'; 
          const message = hasUser ? parts.slice(1).join(':').trim() : line.trim();
          
          if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
             return (
               <div key={idx} className="bg-orange-100/50 text-orange-800 text-xs px-3 py-2 rounded-lg italic border border-orange-100">
                 {line}
               </div>
             );
          }

          return (
            <div key={idx} className="flex gap-3 items-start group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm
                  ${user.toLowerCase().includes('admin') || user.toLowerCase().includes('brand') || user.toLowerCase().includes('page') 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-orange-600 border border-orange-200'
                  }`}
              >
                {user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                 {hasUser && (
                   <div className="text-[10px] font-bold text-gray-400 mb-0.5 ml-1 uppercase tracking-wide">
                     {user}
                   </div>
                 )}
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 text-sm text-gray-700 leading-relaxed group-hover:border-orange-200 transition-colors">
                    {message}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative animate-fadeIn">
      {/* Dynamic Insert Button */}
      <div className="mb-6 flex justify-end">
          <button 
             onClick={() => setIsInsertModalOpen(true)}
             className="px-5 py-2.5 bg-[#FFD700] hover:bg-[#F5C500] text-black font-bold rounded-xl shadow-md flex items-center gap-2 transition-transform hover:scale-105"
          >
             <span>⚡ Chèn & Thích Nghi (Dynamic Insert)</span>
          </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-4">
        {calendar.map((day, index) => (
          <button
            key={day.day || index}
            onClick={() => handleDayClick(index)}
            className={`
              flex flex-col h-36 p-4 text-left border rounded-2xl transition-all relative overflow-hidden group
              ${day.details 
                ? 'bg-gradient-to-br from-emerald-50/90 to-teal-50/90 border-emerald-200/60 shadow-sm' 
                : 'glass-panel hover:border-emerald-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex justify-between w-full mb-2">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${day.details ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                Ngày {day.day}
              </span>
              {day.details && <span className="text-[10px] text-emerald-600 font-bold bg-white/50 px-1.5 py-0.5 rounded">XONG</span>}
            </div>
            <h4 className="text-sm font-semibold text-gray-800 leading-snug mb-2 line-clamp-3 group-hover:text-emerald-700 transition-colors">
              {day.topic}
            </h4>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-auto truncate">
              {day.angle}
            </span>
            
            {day.isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Premium Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md" onClick={closeDetail}>
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border-white/50 animate-fadeIn overflow-hidden" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header - Fixed */}
            <div className="p-6 border-b border-gray-200/50 flex justify-between items-start bg-white/80 backdrop-blur-xl z-10 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">Ngày {selectedDay.day}</span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{selectedDay.angle}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight">{selectedDay.topic}</h3>
                
                {/* Internal Tabs */}
                <div className="flex mt-4 space-x-2">
                    <button 
                        onClick={() => setActiveTab('content')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        📝 Content & Media
                    </button>
                    <button 
                        onClick={() => setActiveTab('tiktok')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tiktok' ? 'bg-black text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        <span>🎬 TikTok Studio</span>
                        {selectedDay.details?.tiktokScript && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                    </button>
                </div>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8 bg-white/40 flex-1 overflow-y-auto">
              {selectedDay.isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                  <LoadingSpinner size="lg" color="text-emerald-500" />
                  <p className="mt-6 text-sm font-medium animate-pulse text-emerald-600">Đang soạn thảo nội dung chất lượng cao...</p>
                </div>
              ) : selectedDay.details ? (
                <>
                  {/* TAB 1: CONTENT & MEDIA (Existing Logic) */}
                  {activeTab === 'content' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Caption Section */}
                        <div className="glass-panel bg-white/60 p-6 rounded-2xl border-l-4 border-l-emerald-500">
                            <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                            ✍️ Nội dung bài viết (Caption)
                            </h4>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap font-sans leading-7">
                            {selectedDay.details.caption}
                            </p>
                        </div>

                        {/* Visual Section */}
                        <div className="glass-panel bg-white/60 p-6 rounded-2xl">
                            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">
                            🎨 Studio Sáng Tạo
                            </h4>
                            <p className="text-gray-500 text-xs italic mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            Câu lệnh (Prompt): "{selectedDay.details.visualPrompt}"
                            </p>

                            <div className="border-t border-gray-200/50 pt-6">
                            {selectedDay.details.isGeneratingMedia ? (
                                <div className="flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-purple-200">
                                <LoadingSpinner size="md" color="text-purple-600" />
                                <span className="text-xs text-purple-600 mt-3 font-bold uppercase tracking-wider">Đang tạo tài nguyên...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Image Gen */}
                                    {!selectedDay.details.generatedImage ? (
                                        <button 
                                        onClick={() => selectedDayIndex !== null && onGenerateMedia(selectedDayIndex, 'image', selectedDay.details?.visualPrompt)}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                                        >
                                        ✨ Tạo Hình Ảnh (Imagen 3)
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                        <MediaViewer 
                                            src={selectedDay.details.generatedImage} 
                                            type="image" 
                                            onDownload={() => {
                                                const a = document.createElement('a');
                                                a.href = selectedDay.details?.generatedImage || '';
                                                a.download = `${projectName}_Ngay${selectedDay.day}_Anh.jpg`;
                                                a.click();
                                            }}
                                        />
                                        
                                        {/* Video Gen */}
                                        {!selectedDay.details.generatedVideo ? (
                                            <button 
                                                onClick={() => selectedDayIndex !== null && onGenerateMedia(selectedDayIndex, 'video', selectedDay.details?.visualPrompt)}
                                                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-pink-500/30 transition-all flex items-center justify-center gap-2"
                                            >
                                                🎥 Tạo Video (Veo)
                                            </button>
                                        ) : (
                                            <MediaViewer 
                                                src={selectedDay.details.generatedVideo} 
                                                type="video" 
                                                onDownload={() => {
                                                    const a = document.createElement('a');
                                                    a.href = selectedDay.details?.generatedVideo || '';
                                                    a.download = `${projectName}_Ngay${selectedDay.day}_Video.mp4`;
                                                    a.click();
                                                }}
                                            />
                                        )}
                                        </div>
                                    )}
                                </div>
                            )}
                            </div>
                        </div>

                        {/* Seeding Section */}
                        <div className="glass-panel bg-orange-50/30 p-6 rounded-2xl border-l-4 border-l-orange-400">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-orange-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                                🌱 Kịch bản Seeding (Tương tác mẫu)
                                </h4>
                                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-1 rounded font-bold">CHAT MODE</span>
                            </div>
                            
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 shadow-inner">
                                <SeedingChat script={selectedDay.details.seedingScript} />
                            </div>
                        </div>
                    </div>
                  )}

                  {/* TAB 2: TIKTOK STUDIO (New Logic) */}
                  {activeTab === 'tiktok' && (
                      <div className="animate-fadeIn">
                          {!selectedDay.details.tiktokScript ? (
                              <div className="text-center py-16 bg-black/5 rounded-2xl border border-dashed border-gray-300">
                                  <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">🎵</div>
                                  <h3 className="text-xl font-bold text-gray-800 mb-2">TikTok/Reels Script Generator</h3>
                                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                      Tạo kịch bản video ngắn (30-60s) tối ưu hóa khả năng giữ chân người xem (Retention) với cấu trúc Hook - Value - Twist.
                                  </p>
                                  <button 
                                      onClick={() => selectedDayIndex !== null && onGenerateTikTokScript(selectedDayIndex)}
                                      disabled={selectedDay.details.isGeneratingScript}
                                      className="px-8 py-3 bg-black hover:bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-3 mx-auto"
                                  >
                                      {selectedDay.details.isGeneratingScript ? (
                                          <><LoadingSpinner size="sm" color="text-white" /> Đang viết kịch bản...</>
                                      ) : (
                                          <>🚀 Tạo Kịch Bản Ngay</>
                                      )}
                                  </button>
                              </div>
                          ) : (
                              <div className="space-y-6">
                                  {/* Script Header */}
                                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg">
                                      <h3 className="text-xl font-bold mb-1">🎬 {selectedDay.details.tiktokScript.title}</h3>
                                      <div className="flex gap-2 mt-2">
                                          <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Format: Short Video</span>
                                          <span className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider">Angle: {selectedDay.angle}</span>
                                      </div>
                                  </div>

                                  {/* Script Table */}
                                  <div className="glass-panel overflow-hidden rounded-2xl border-0 shadow-md">
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-4 py-3 w-20">Time</th>
                                                    <th className="px-4 py-3 min-w-[200px]">Visual / Action</th>
                                                    <th className="px-4 py-3 min-w-[200px]">Audio / Script</th>
                                                    <th className="px-4 py-3 w-12">AI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 bg-white">
                                                {selectedDay.details.tiktokScript.segments?.map((seg, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-600 whitespace-nowrap align-top">{seg.time}</td>
                                                        <td className="px-4 py-3 text-gray-800 align-top">
                                                            <div className="font-medium leading-relaxed">{seg.visual}</div>
                                                            {/* Veo Prompt Display */}
                                                            <div className="mt-2 text-[10px] text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 font-mono">
                                                                🤖 Prompt: {seg.veoPrompt}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-600 align-top italic bg-gray-50/30">"{seg.audio}"</td>
                                                        <td className="px-4 py-3 align-top text-center">
                                                            <button 
                                                                onClick={() => navigator.clipboard.writeText(seg.veoPrompt)}
                                                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                                title="Copy Prompt for Veo/Sora"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                      </div>
                                  </div>

                                  <div className="text-center">
                                     <button 
                                        onClick={() => selectedDayIndex !== null && onGenerateTikTokScript(selectedDayIndex)}
                                        className="text-gray-500 hover:text-gray-800 text-sm font-medium hover:underline transition-all"
                                     >
                                        🔄 Tạo lại kịch bản khác
                                     </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                </>
              ) : (
                <div className="text-center py-8">
                   <button 
                    onClick={() => selectedDayIndex !== null && onGenerateDetail(selectedDayIndex)}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-medium text-sm transition-colors"
                  >
                    Làm mới nội dung
                  </button>
                </div>
              )}
            </div>
            
            {/* Modal Footer - Fixed */}
            <div className="p-4 border-t border-gray-200/50 bg-white/60 backdrop-blur-md flex justify-end shrink-0">
                <button onClick={closeDetail} className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 font-bold text-sm transition-colors">
                    Đóng
                </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC INSERT MODAL */}
      {isInsertModalOpen && (
          <div className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setIsInsertModalOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="bg-[#FFD700] p-6 text-black">
                      <h3 className="font-bold text-xl flex items-center gap-2">
                         ⚡ Chèn & Thích Nghi (Dynamic Insert)
                      </h3>
                      <p className="text-sm opacity-80 mt-1">AI sẽ quét 30 ngày hiện tại, tìm các ngày "nhạt" và thay thế bằng nội dung cho sản phẩm mới này.</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">1. Hình ảnh sản phẩm (Để AI phân tích)</label>
                          <div 
                             onClick={() => insertFileInputRef.current?.click()}
                             className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                             {insertImage ? (
                                 <img src={insertImage} alt="Preview" className="h-32 mx-auto object-contain rounded-lg" />
                             ) : (
                                 <div className="text-gray-400">
                                     <span className="text-2xl block mb-2">📸</span>
                                     <span>Click để tải ảnh lên</span>
                                 </div>
                             )}
                             <input ref={insertFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertFileUpload} />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">2. Tên & USP Sản phẩm mới</label>
                          <textarea 
                             className="glass-input w-full p-4 rounded-xl text-sm"
                             rows={3}
                             placeholder="VD: Son dưỡng môi gấc tự nhiên, trị thâm, an toàn cho mẹ bầu..."
                             value={insertText}
                             onChange={(e) => setInsertText(e.target.value)}
                          />
                      </div>

                      <div className="flex gap-3 pt-2">
                          <button 
                             onClick={() => setIsInsertModalOpen(false)}
                             className="flex-1 py-3 bg-gray-100 font-bold text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                          >
                             Hủy bỏ
                          </button>
                          <button 
                             onClick={handleInsertSubmit}
                             disabled={isInserting || !insertText}
                             className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                             {isInserting ? <LoadingSpinner size="sm" color="text-white"/> : '🚀 Quét & Chèn Ngay'}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Step2Calendar;
