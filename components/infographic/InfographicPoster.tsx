import React from 'react';
import { InfographicData } from '../../types';
import { getIcon } from './utils';
import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';

interface Props {
  data: InfographicData;
}

const InfographicPoster: React.FC<Props> = ({ data }) => {
  return (
    <div 
        className="w-full min-h-[800px] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{ 
            background: `radial-gradient(circle at center, #ffffff 0%, ${data.brand_colors.background || '#f0f0f0'} 100%)` 
        }}
    >
         {/* Background Elements */}
         <div className="absolute top-0 w-full h-1/3" style={{ background: data.brand_colors.primary }}></div>
         <div className="absolute top-1/3 left-0 right-0 h-32 bg-gradient-to-b from-[${data.brand_colors.primary}] to-transparent opacity-50"></div>
         
         {/* Content Wrapper */}
         <div className="relative z-10 flex-1 flex flex-col items-center p-8 md:p-12">
             
             {/* HEADER */}
             <div className="text-center text-white mb-8 w-full max-w-4xl">
                 <div className="inline-block px-3 py-1 mb-4 rounded-full bg-white/20 border border-white/30 backdrop-blur text-xs font-bold uppercase tracking-widest">
                     Product Showcase
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tight drop-shadow-xl uppercase">
                     {data.hook}
                 </h1>
                 {data.sub_headline && (
                     <div className="text-2xl md:text-3xl font-light opacity-90 italic bg-black/20 inline-block px-6 py-2 rounded-xl backdrop-blur-sm">
                         {data.sub_headline}
                     </div>
                 )}
             </div>

             {/* HERO SECTION */}
             <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12 mt-4">
                 
                 {/* LEFT FEATURES */}
                 <div className="flex-1 space-y-6 hidden md:block">
                     {data.poster_points?.slice(0, 3).map((point, i) => (
                         <motion.div 
                            key={`l-${i}`}
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-center justify-end gap-4 text-right"
                         >
                             <div>
                                 <h3 className="font-bold text-gray-800 text-lg">{point}</h3>
                             </div>
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: data.brand_colors.secondary }}>
                                 <CheckCircle className="w-5 h-5" />
                             </div>
                         </motion.div>
                     ))}
                 </div>

                 {/* CENTER IMAGE PLACEHOLDER */}
                 <div className="relative w-80 h-80 md:w-96 md:h-96 shrink-0">
                     <div className="absolute inset-0 rounded-full blur-3xl opacity-30 animate-pulse" style={{ background: data.brand_colors.primary }}></div>
                     <div className="relative w-full h-full rounded-3xl bg-white shadow-2xl border-4 border-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                         {/* If we had a real image, it would go here. For now, we show the PROMPT or a placeholder icon */}
                         <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                             <Star className="w-12 h-12 text-indigo-600" />
                         </div>
                         <p className="text-xs text-gray-400 font-mono uppercase mb-2">AI Image Prompt</p>
                         <p className="text-sm text-gray-600 line-clamp-4 italic">
                             "{data.poster_main_image || 'No image prompt generated'}"
                         </p>
                         
                         {/* Key Stat Floating */}
                         <div className="absolute -bottom-6 -right-6 bg-yellow-400 text-black font-black text-4xl p-6 rounded-full shadow-xl border-4 border-white transform rotate-12">
                             {data.key_stat}
                         </div>
                     </div>
                 </div>

                 {/* RIGHT FEATURES */}
                 <div className="flex-1 space-y-6">
                     {data.poster_points?.slice(3).concat(data.poster_points?.slice(0, 3).filter((_, i, arr) => arr.length <= 3 && false) || []).map((point, i) => ( // Fallback logic
                         <motion.div 
                            key={`r-${i}`}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="flex items-center gap-4 text-left"
                         >
                             <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg shrink-0" style={{ background: data.brand_colors.secondary }}>
                                 <CheckCircle className="w-5 h-5" />
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-800 text-lg">{point}</h3>
                             </div>
                         </motion.div>
                     ))}
                     {/* Show all points on mobile if hidden on desktop */}
                     <div className="md:hidden space-y-4">
                         {data.poster_points?.slice(0, 3).map((point, i) => (
                             <div key={`mob-${i}`} className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                     <CheckCircle className="w-4 h-4 text-gray-600" />
                                 </div>
                                 <span className="font-medium text-gray-700">{point}</span>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>

             {/* BOTTOM CALL TO ACTION */}
             <div className="mt-16 w-full max-w-3xl bg-white rounded-2xl p-6 shadow-xl border border-gray-100 flex items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                         <Star className="w-6 h-6" />
                     </div>
                     <div>
                         <h4 className="font-bold text-gray-800">Highlights</h4>
                         <p className="text-sm text-gray-500">Key features overview</p>
                     </div>
                 </div>
                 <div className="h-10 w-[1px] bg-gray-200"></div>
                 <div className="text-right">
                     <div className="text-sm text-gray-500">Rating</div>
                     <div className="text-xl font-bold text-yellow-500">★★★★★</div>
                 </div>
             </div>

         </div>

         {/* Footer */}
         <div className="p-4 text-center text-gray-400 text-xs relative z-10">
             Generated by AI Marketing Strategist Pro
         </div>
    </div>
  );
};

export default InfographicPoster;
