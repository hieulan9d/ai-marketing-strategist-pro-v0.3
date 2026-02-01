
import React, { useState } from 'react';
import { AdCampaign, AdMetrics } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface Step4Props {
  campaigns: AdCampaign[];
  isLoading: boolean;
  onCreateCampaign: (customReq?: string) => Promise<void>;
  onDeleteCampaign: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onGenerateMedia: (campaignId: string, type: 'image' | 'video', prompt?: string) => Promise<void>;
  onAnalyzePerformance?: (campaignId: string, metrics: AdMetrics) => Promise<void>;
  projectName?: string;
}

const Step4Ads: React.FC<Step4Props> = ({ 
  campaigns, 
  isLoading, 
  onCreateCampaign, 
  onDeleteCampaign, 
  onToggleStatus,
  onGenerateMedia,
  onAnalyzePerformance,
  projectName = 'du-an'
}) => {
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'CREATE' | 'DETAIL'>('DASHBOARD');
  const [customReq, setCustomReq] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'CONTENT' | 'PERFORMANCE'>('CONTENT');
  
  // Metrics State
  const [metricsInput, setMetricsInput] = useState<AdMetrics>({ spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  // --- HANDLERS ---
  const handleCreateSubmit = async () => {
    await onCreateCampaign(customReq);
    setCustomReq('');
    setViewMode('DASHBOARD');
  };

  const openDetail = (id: string) => {
    setSelectedCampaignId(id);
    const campaign = campaigns.find(c => c.id === id);
    if (campaign && campaign.metrics) {
        setMetricsInput(campaign.metrics);
    } else {
        setMetricsInput({ spend: 0, impressions: 0, clicks: 0, conversions: 0 });
    }
    setDetailTab('CONTENT'); // Default to content
    setViewMode('DETAIL');
  };

  const backToDashboard = () => {
    setViewMode('DASHBOARD');
    setSelectedCampaignId(null);
  };

  const handleAnalyzeClick = async () => {
    if (selectedCampaignId && onAnalyzePerformance) {
        await onAnalyzePerformance(selectedCampaignId, metricsInput);
    }
  };

  // --- RENDER: DASHBOARD VIEW ---
  if (viewMode === 'DASHBOARD') {
    return (
      <div className="animate-fadeIn">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quản Lý Vòng Đời Chiến Dịch</h3>
                <p className="text-xs text-gray-500">{campaigns.length} chiến dịch đang quản lý</p>
              </div>
           </div>
           <button 
             onClick={() => setViewMode('CREATE')}
             className="glass-button-primary text-white py-2 px-5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
           >
             <span>➕ Tạo Chiến Dịch Mới</span>
           </button>
        </div>

        {/* Empty State */}
        {campaigns.length === 0 ? (
           <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 mb-4">Chưa có chiến dịch quảng cáo nào.</p>
              <button 
                onClick={() => setViewMode('CREATE')}
                className="text-emerald-600 font-bold hover:underline"
              >
                Bắt đầu tạo ngay
              </button>
           </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white/60 backdrop-blur-sm">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-200">
                   <tr>
                      <th className="px-6 py-4 font-bold">STT</th>
                      <th className="px-6 py-4 font-bold">Tên Chiến Dịch / Sản Phẩm</th>
                      <th className="px-6 py-4 font-bold">Trạng Thái</th>
                      <th className="px-6 py-4 font-bold">Hiệu Quả</th>
                      <th className="px-6 py-4 font-bold text-right">Hành Động</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {campaigns.map((campaign, idx) => {
                      const isCompleted = campaign.status === 'COMPLETED';
                      const rowClass = isCompleted ? 'bg-gray-50/50 opacity-75' : 'hover:bg-emerald-50/30 transition-colors';
                      
                      return (
                        <tr key={campaign.id} className={rowClass}>
                           <td className="px-6 py-4 font-medium text-gray-500">#{idx + 1}</td>
                           <td className={`px-6 py-4 font-bold ${isCompleted ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>
                              {campaign.data.campaignName || "Chiến dịch chưa đặt tên"}
                           </td>
                           <td className="px-6 py-4">
                              <button 
                                onClick={() => onToggleStatus(campaign.id)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                  isCompleted 
                                  ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-emerald-100 hover:text-emerald-600 hover:border-emerald-200'
                                  : 'bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-gray-100 hover:text-gray-500'
                                }`}
                              >
                                {isCompleted ? 'Đã hoàn thành' : 'Đang chạy'}
                              </button>
                           </td>
                           <td className="px-6 py-4">
                              {campaign.analysis ? (
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      campaign.analysis.score >= 7 ? 'text-green-600 bg-green-50' : 
                                      campaign.analysis.score >= 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'
                                  }`}>
                                      {campaign.analysis.score}/10 ({campaign.analysis.assessment})
                                  </span>
                              ) : (
                                  <span className="text-gray-400 text-xs italic">Chưa phân tích</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openDetail(campaign.id)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Xem chi tiết & Chỉnh sửa"
                              >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              </button>
                              <button 
                                onClick={() => onToggleStatus(campaign.id)}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                title={isCompleted ? "Đánh dấu đang chạy" : "Đánh dấu xong"}
                              >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button 
                                onClick={() => onDeleteCampaign(campaign.id)}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa chiến dịch"
                              >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                           </td>
                        </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER: CREATE VIEW ---
  if (viewMode === 'CREATE') {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="bg-emerald-50/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-emerald-100">🚀</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Khởi Tạo Chiến Dịch Mới</h3>
          <p className="text-gray-500 text-sm">
            AI sẽ sử dụng chiến lược gốc nhưng tối ưu theo yêu cầu cụ thể của bạn.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl mb-6 border border-emerald-100 shadow-sm bg-white/80">
           <label className="block text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
             🎯 Yêu cầu đặc biệt (Target/Góc độ/Sản phẩm cụ thể)
           </label>
           <textarea
             className="glass-input w-full rounded-xl p-4 text-sm focus:outline-none placeholder-gray-400 min-h-[120px]"
             placeholder="Ví dụ: Tập trung bán combo quà tặng 8/3, đối tượng nam giới văn phòng, giọng hài hước..."
             value={customReq}
             onChange={(e) => setCustomReq(e.target.value)}
             disabled={isLoading}
             autoFocus
           />
        </div>

        <div className="flex gap-4">
           <button
            onClick={() => setViewMode('DASHBOARD')}
            disabled={isLoading}
            className="flex-1 py-3 px-6 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
           >
             Hủy bỏ
           </button>
           <button
            onClick={handleCreateSubmit}
            disabled={isLoading}
            className="flex-[2] glass-button-primary text-white py-3 px-6 rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-bold tracking-wide flex items-center justify-center gap-3"
           >
             {isLoading ? (
              <>
                <LoadingSpinner size="sm" color="text-white" />
                <span>Đang phân tích & tối ưu...</span>
              </>
            ) : (
              '🚀 Tạo Ngay'
            )}
           </button>
        </div>
      </div>
    );
  }

  // --- RENDER: DETAIL VIEW ---
  if (viewMode === 'DETAIL' && selectedCampaign) {
    const data = selectedCampaign.data;
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Navigation & Title */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-200/50">
           <button onClick={backToDashboard} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           </button>
           <div className="flex-1">
               <h3 className="text-xl font-bold text-gray-800">{data.campaignName}</h3>
               <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${selectedCampaign.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
                 {selectedCampaign.status === 'COMPLETED' ? 'Đã xong' : 'Đang chạy'}
               </span>
           </div>
           
           {/* Detail Tabs */}
           <div className="flex bg-gray-100/50 p-1 rounded-lg">
               <button 
                  onClick={() => setDetailTab('CONTENT')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${detailTab === 'CONTENT' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-200/50'}`}
               >
                  📝 Nội Dung & Setup
               </button>
               <button 
                  onClick={() => setDetailTab('PERFORMANCE')} 
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${detailTab === 'PERFORMANCE' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:bg-gray-200/50'}`}
               >
                  <span>📈 Phân Tích Hiệu Quả</span>
                  {selectedCampaign.analysis && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
               </button>
           </div>
        </div>

        {/* CONTENT TAB */}
        {detailTab === 'CONTENT' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900 text-white rounded-2xl shadow-xl p-8 border border-slate-700">
                <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <span className="bg-emerald-500/20 p-1.5 rounded-lg">🏗</span> Cấu Trúc Chiến Dịch
                </h3>
                <p className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed opacity-90">{data.campaignStructure}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <h4 className="font-bold text-gray-400 mb-3 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">✍️ Sales Copy</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{data.adContent.salesCopy}</p>
                </div>

                <div className="glass-panel p-6 rounded-2xl md:col-span-2">
                    <h4 className="font-bold text-gray-400 mb-3 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">🖼 Media</h4>
                    <div className="bg-gray-50/50 p-4 rounded-xl text-xs text-gray-500 italic mb-6 border border-dashed border-gray-300">
                        <span className="font-bold text-gray-600">PROMPT:</span> {data.adContent.imagePrompt}
                    </div>

                    {data.isGeneratingMedia ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white/40 rounded-xl border border-gray-100">
                            <LoadingSpinner size="md" color="text-emerald-500" />
                            <span className="text-xs text-emerald-600 mt-4 font-bold uppercase tracking-wider">Đang sản xuất...</span>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {!data.adContent.generatedImage ? (
                                    <button 
                                        onClick={() => onGenerateMedia(selectedCampaign.id, 'image', data.adContent.imagePrompt)}
                                        className="w-full py-3 bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
                                    >
                                        Tạo Ảnh Ads
                                    </button>
                                ) : (
                                    <div className="group relative rounded-xl overflow-hidden border border-gray-200 shadow-md transition-transform hover:scale-[1.02]">
                                        <img src={data.adContent.generatedImage} alt="Ad Creative" className="w-full h-auto" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <button 
                                              onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = data.adContent.generatedImage || '';
                                                a.download = `${projectName}_${selectedCampaign.id}_Anh.jpg`;
                                                a.click();
                                              }}
                                              className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" 
                                              title="Tải ảnh"
                                            >
                                                <span className="text-xs font-bold">⬇️</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {data.adContent.generatedImage && !data.adContent.generatedVideo && (
                                    <button 
                                        onClick={() => onGenerateMedia(selectedCampaign.id, 'video', data.adContent.imagePrompt)}
                                        className="w-full py-3 bg-white border border-gray-200 hover:border-pink-400 hover:text-pink-600 text-gray-600 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
                                    >
                                        Tạo Video Ads
                                    </button>
                                )}
                                {data.adContent.generatedVideo && (
                                    <div className="group relative rounded-xl overflow-hidden border border-gray-200 bg-black shadow-md">
                                        <video controls src={data.adContent.generatedVideo} className="w-full h-auto" />
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                              onClick={() => {
                                                const a = document.createElement('a');
                                                a.href = data.adContent.generatedVideo || '';
                                                a.download = `${projectName}_${selectedCampaign.id}_Video.mp4`;
                                                a.click();
                                              }}
                                              className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition-colors" 
                                              title="Tải video"
                                            >
                                                <span className="text-xs font-bold">⬇️</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {!data.adContent.generatedImage && (
                                    <div className="h-full flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300 rounded-xl bg-gray-50 p-6 text-center">
                                        Cần tạo ảnh trước khi tạo video
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-2xl md:col-span-3">
                    <h4 className="font-bold text-gray-400 mb-3 text-xs uppercase tracking-widest border-b border-gray-100 pb-2">🎬 Kịch Bản Video</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{data.adContent.videoScript}</p>
                </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE TAB (NEW) */}
        {detailTab === 'PERFORMANCE' && (
           <div className="animate-fadeIn grid md:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="glass-panel p-6 rounded-2xl md:col-span-1 h-fit">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    🔢 Nhập Số Liệu
                 </h4>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Ngân sách đã tiêu (VND)</label>
                        <input type="number" className="glass-input w-full p-2 rounded-lg" value={metricsInput.spend} onChange={e => setMetricsInput({...metricsInput, spend: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Lượt hiển thị (Impressions)</label>
                        <input type="number" className="glass-input w-full p-2 rounded-lg" value={metricsInput.impressions} onChange={e => setMetricsInput({...metricsInput, impressions: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Lượt nhấp (Clicks)</label>
                        <input type="number" className="glass-input w-full p-2 rounded-lg" value={metricsInput.clicks} onChange={e => setMetricsInput({...metricsInput, clicks: parseInt(e.target.value) || 0})} />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Chuyển đổi (Conversions)</label>
                        <input type="number" className="glass-input w-full p-2 rounded-lg" value={metricsInput.conversions} onChange={e => setMetricsInput({...metricsInput, conversions: parseInt(e.target.value) || 0})} />
                     </div>
                     
                     <button 
                        onClick={handleAnalyzeClick}
                        disabled={selectedCampaign.isAnalyzing}
                        className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                     >
                        {selectedCampaign.isAnalyzing ? <LoadingSpinner size="sm" color="text-white"/> : '🚀 Phân Tích Ngay'}
                     </button>
                 </div>
              </div>

              {/* Result Panel */}
              <div className="glass-panel p-6 rounded-2xl md:col-span-2 min-h-[400px]">
                 {selectedCampaign.analysis ? (
                    <div className="animate-fadeIn space-y-6">
                        {/* Score Header */}
                        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-4 ${selectedCampaign.analysis.score >= 7 ? 'border-green-500 text-green-600' : selectedCampaign.analysis.score >= 5 ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                                {selectedCampaign.analysis.score}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">{selectedCampaign.analysis.assessment}</h4>
                                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                    <span>CTR: <strong>{selectedCampaign.analysis.kpiCalc.ctr}%</strong></span>
                                    <span>CPC: <strong>{selectedCampaign.analysis.kpiCalc.cpc}đ</strong></span>
                                    <span>CPA: <strong>{selectedCampaign.analysis.kpiCalc.cpa}đ</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Pros & Cons */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                 <h5 className="font-bold text-green-800 text-xs uppercase mb-2">✅ Điểm Tốt</h5>
                                 <ul className="space-y-1">
                                    {selectedCampaign.analysis.pros.map((p, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500">•</span> {p}</li>
                                    ))}
                                 </ul>
                             </div>
                             <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                 <h5 className="font-bold text-red-800 text-xs uppercase mb-2">⚠️ Vấn Đề</h5>
                                 <ul className="space-y-1">
                                    {selectedCampaign.analysis.cons.map((p, i) => (
                                        <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-red-500">•</span> {p}</li>
                                    ))}
                                 </ul>
                             </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-blue-50/50 p-5 rounded-xl border-l-4 border-l-blue-500">
                            <h5 className="font-bold text-blue-800 text-xs uppercase mb-3 flex items-center gap-2">💡 Đề Xuất Tối Ưu</h5>
                            <ul className="space-y-2">
                                {selectedCampaign.analysis.recommendations.map((rec, i) => (
                                    <li key={i} className="text-sm text-gray-800 bg-white p-3 rounded-lg shadow-sm">{rec}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-4 opacity-30">📈</span>
                        <p>Nhập số liệu bên trái và nhấn "Phân Tích" để nhận đánh giá từ AI.</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>
    );
  }

  return null;
};

export default Step4Ads;
