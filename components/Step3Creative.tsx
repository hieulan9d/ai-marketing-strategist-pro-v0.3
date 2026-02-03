import React from 'react';
import { CreativeData } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface Step3Props {
  onGenerate: () => Promise<void>;
  data: CreativeData | null;
  isLoading: boolean;
  mediaConfig?: { imageCount: number; videoCount: number };
  onUpdateMediaConfig?: (config: Partial<{ imageCount: number; videoCount: number }>) => void;
}

const Step3Creative: React.FC<Step3Props> = ({ onGenerate, data, isLoading, mediaConfig, onUpdateMediaConfig }) => {
  // CONFIG PANEL
  const ConfigPanel = () => (
      mediaConfig && onUpdateMediaConfig ? (
          <div className="flex gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm mx-auto w-fit mb-6 animate-fadeIn">
              <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                      🖼️ Số lượng KOL Concepts ({mediaConfig.imageCount})
                  </label>
                  <input 
                      type="range" min="1" max="5" step="1"
                      value={mediaConfig.imageCount}
                      onChange={(e) => onUpdateMediaConfig({ imageCount: parseInt(e.target.value) })}
                      className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
              </div>
              <div className="w-px bg-gray-200"></div>
              <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1">
                      🎥 Số lượng Viral Hooks ({mediaConfig.videoCount})
                  </label>
                  <input 
                      type="range" min="1" max="3" step="1"
                      value={mediaConfig.videoCount}
                      onChange={(e) => onUpdateMediaConfig({ videoCount: parseInt(e.target.value) })}
                      className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                  />
              </div>
          </div>
      ) : null
  );

  if (!data) {
    return (
      <div className="text-center py-12">
         <p className="text-gray-600 mb-4 text-lg">
          Kích hoạt chiến dịch với các Hooks viral và ý tưởng KOL đột phá.
        </p>
        
        <ConfigPanel />

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="glass-button-primary text-white py-3 px-10 rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-bold tracking-wide"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" color="text-white" />
              <span>Đang tạo {mediaConfig?.videoCount || 3} Viral Hooks & {mediaConfig?.imageCount || 3} Concepts...</span>
            </div>
          ) : (
            'Tạo Tài Nguyên Sáng Tạo'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-end">
          <button onClick={onGenerate} disabled={isLoading} className="text-sm text-gray-500 hover:text-gray-900 underline">
              {isLoading ? "Đang làm mới..." : "Tạo lại bộ ý tưởng khác"}
          </button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Viral Hooks */}
        <div className="glass-panel p-0 rounded-2xl overflow-hidden shadow-sm border-0">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-5">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">🔥 10 Viral Hooks (Tiêu đề)</h3>
            <p className="text-pink-100 text-xs mt-1">Các tiêu đề này được tối ưu cho CTR cao nhất</p>
          </div>
          <ul className="divide-y divide-gray-100 bg-white">
            {data.viralHooks.map((hook, idx) => (
              <li key={idx} className="px-6 py-4 text-sm text-gray-700 hover:bg-pink-50/50 transition-colors flex gap-4 items-start group">
                <span className="text-pink-300 font-black text-lg leading-none group-hover:text-pink-500 transition-colors">{String(idx + 1).padStart(2, '0')}</span>
                <span className="font-medium leading-relaxed">{hook}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
             {/* Seeding Plan */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500 bg-blue-50/20">
                <h3 className="font-bold text-gray-800 mb-4 border-b border-blue-100 pb-2 uppercase tracking-wide text-xs text-blue-600 flex items-center gap-2">
                    📢 Kế Hoạch Seeding Tổng Thể
                </h3>
                <div className="bg-white/60 p-5 rounded-xl border border-white shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-7 font-sans">
                        {data.seedingMasterPlan}
                    </p>
                </div>
            </div>

            {/* KOL Concepts */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500 bg-purple-50/20">
                <h3 className="font-bold text-gray-800 mb-4 border-b border-purple-100 pb-2 uppercase tracking-wide text-xs text-purple-600 flex items-center gap-2">
                    🤝 Ý Tưởng KOL / Avatar
                </h3>
                <ul className="space-y-3">
                    {data.kolConcepts.map((concept, idx) => (
                         <li key={idx} className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-purple-50 shadow-sm flex gap-3 items-start hover:shadow-md transition-shadow">
                            <span className="mt-1 w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>
                            <span className="leading-relaxed">{concept}</span>
                         </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Creative;