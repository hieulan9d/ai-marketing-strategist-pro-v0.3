import React, { useState } from 'react';
import { SpyData } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface StepSpyProps {
  spyData: SpyData;
  onAnalyzeCompetitor: (content: string) => Promise<void>;
  onMineInsights: (comments: string) => Promise<void>;
  onPredictTrends: (keyword: string) => Promise<void>;
}

const StepSpyResearch: React.FC<StepSpyProps> = ({ 
  spyData, 
  onAnalyzeCompetitor, 
  onMineInsights, 
  onPredictTrends 
}) => {
  const [activeTab, setActiveTab] = useState<'competitor' | 'insights' | 'trends'>('competitor');
  const [compInput, setCompInput] = useState('');
  const [insightInput, setInsightInput] = useState('');
  const [trendInput, setTrendInput] = useState('');

  const renderTabs = () => (
    <div className="flex bg-gray-100/50 p-1 rounded-xl mb-6 overflow-x-auto border border-gray-200/50">
      <button
        onClick={() => setActiveTab('competitor')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'competitor' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        🕵️ Soi Đối Thủ
      </button>
      <button
        onClick={() => setActiveTab('insights')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'insights' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        🧠 Đào Insight
      </button>
      <button
        onClick={() => setActiveTab('trends')}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'trends' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
        }`}
      >
        📈 Tiên Tri Xu Hướng
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6 text-sm text-emerald-700 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <span className="mt-0.5"><strong>Trung Tâm Dữ Liệu:</strong> Thu thập dữ liệu tại đây để tối ưu chiến lược ở Bước 1.</span>
      </div>
      
      {renderTabs()}

      {/* COMPETITOR AUDIT TAB */}
      {activeTab === 'competitor' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Nội dung đối thủ (Quảng cáo/Bài viết/Web)</label>
            <textarea
              rows={4}
              className="glass-input w-full rounded-xl p-3 text-sm focus:outline-none placeholder-gray-400"
              placeholder="Dán nội dung vào đây..."
              value={compInput}
              onChange={(e) => setCompInput(e.target.value)}
            />
            <button
              onClick={() => onAnalyzeCompetitor(compInput)}
              disabled={spyData.isAnalyzingCompetitor || !compInput.trim()}
              className="w-full bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex justify-center items-center gap-2"
            >
              {spyData.isAnalyzingCompetitor ? <LoadingSpinner size="sm" /> : 'Phân Tích Đối Thủ'}
            </button>
          </div>

          {spyData.competitorResult && (
            <div className="grid md:grid-cols-3 gap-5 mt-6 animate-fadeIn">
              <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-red-400">
                <h4 className="font-bold text-gray-800 text-xs uppercase mb-3">🎣 Chiến lược Hook</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{spyData.competitorResult.hookStrategy}</p>
              </div>
              <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-yellow-400">
                <h4 className="font-bold text-gray-800 text-xs uppercase mb-3">⚠️ Điểm yếu & Lỗ hổng</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{spyData.competitorResult.weaknesses}</p>
              </div>
              <div className="glass-panel p-5 rounded-2xl border-t-4 border-t-emerald-400">
                <h4 className="font-bold text-gray-800 text-xs uppercase mb-3">⚔️ Cơ hội tấn công</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{spyData.competitorResult.attackOpportunities}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSIGHT MINING TAB */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Bình luận khách hàng (20-50 dòng)</label>
            <textarea
              rows={4}
              className="glass-input w-full rounded-xl p-3 text-sm focus:outline-none placeholder-gray-400"
              placeholder="Dán các bình luận vào đây..."
              value={insightInput}
              onChange={(e) => setInsightInput(e.target.value)}
            />
            <button
              onClick={() => onMineInsights(insightInput)}
              disabled={spyData.isMiningInsights || !insightInput.trim()}
              className="w-full bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex justify-center items-center gap-2"
            >
              {spyData.isMiningInsights ? <LoadingSpinner size="sm" /> : 'Đào Insight Sâu'}
            </button>
          </div>

          {spyData.insightResult && (
            <div className="space-y-5 mt-6 animate-fadeIn">
              <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
                 <h4 className="font-bold text-slate-400 text-xs uppercase mb-2 tracking-widest">💔 Nỗi Đau Thầm Kín (Hidden Pain)</h4>
                 <p className="text-lg font-light leading-relaxed">"{spyData.insightResult.hiddenPain}"</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-5">
                <div className="glass-panel p-5 rounded-2xl">
                  <h4 className="font-bold text-orange-600 text-xs uppercase mb-3 tracking-wide">🚧 Rào Cản Mua Hàng</h4>
                  <p className="text-sm text-gray-600">{spyData.insightResult.buyingBarriers}</p>
                </div>
                <div className="glass-panel p-5 rounded-2xl">
                  <h4 className="font-bold text-blue-600 text-xs uppercase mb-3 tracking-wide">🔑 Từ Khóa Cảm Xúc</h4>
                  <div className="flex flex-wrap gap-2">
                    {spyData.insightResult.triggerWords.map((word, i) => (
                      <span key={i} className="px-3 py-1 bg-white border border-blue-100 rounded-full text-xs text-blue-700 font-bold shadow-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TREND PREDICTION TAB */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Từ khóa ngách (Niche Keyword)</label>
            <div className="flex gap-3">
              <input
                type="text"
                className="glass-input flex-1 rounded-xl p-3 text-sm focus:outline-none placeholder-gray-400"
                placeholder="VD: Thời trang bền vững"
                value={trendInput}
                onChange={(e) => setTrendInput(e.target.value)}
              />
              <button
                onClick={() => onPredictTrends(trendInput)}
                disabled={spyData.isPredictingTrends || !trendInput.trim()}
                className="bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-600 px-6 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {spyData.isPredictingTrends ? <LoadingSpinner size="sm" /> : 'Dự Đoán'}
              </button>
            </div>
          </div>

          {spyData.trendResult && (
             <div className="grid gap-5 mt-6 animate-fadeIn">
               {/* Upcoming Trends */}
               <div className="glass-panel bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-6 rounded-2xl border-purple-100">
                 <h4 className="font-bold text-purple-700 text-xs uppercase mb-4 tracking-widest">🔥 Dự Báo 30 Ngày Tới</h4>
                 <ul className="space-y-3">
                   {spyData.trendResult.upcomingTrends.map((item, i) => (
                     <li key={i} className="text-sm text-gray-700 flex gap-3 items-start">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                        {item}
                     </li>
                   ))}
                 </ul>
               </div>

               <div className="grid md:grid-cols-2 gap-5">
                  <div className="glass-panel p-5 rounded-2xl">
                    <h4 className="font-bold text-gray-500 text-xs uppercase mb-3">🗣 Chủ Đề Tranh Luận</h4>
                    <ul className="space-y-3">
                       {spyData.trendResult.debateTopics.map((item, i) => (
                         <li key={i} className="text-xs bg-white/70 p-3 rounded-xl shadow-sm text-gray-700 border border-gray-100">
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
                  
                  <div className="glass-panel p-5 rounded-2xl">
                    <h4 className="font-bold text-gray-500 text-xs uppercase mb-3">💡 Góc Độ Tiên Phong</h4>
                    <ul className="space-y-3">
                       {spyData.trendResult.contentIdeas.map((item, i) => (
                         <li key={i} className="text-xs bg-white/70 p-3 rounded-xl shadow-sm text-gray-700 border border-gray-100">
                           {item}
                         </li>
                       ))}
                    </ul>
                  </div>
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepSpyResearch;