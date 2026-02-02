import React from 'react';
import { InfographicData } from '../../types';
import { getIcon } from './utils';
import { motion } from 'framer-motion';
import { Check, X, Shield, Zap } from 'lucide-react';

interface Props {
  data: InfographicData;
}

const InfographicComparison: React.FC<Props> = ({ data }) => {
  return (
    <div 
        className="w-full min-h-[800px] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{ 
            background: `linear-gradient(to bottom, #f8fafc 0%, ${data.brand_colors.background || '#eef2ff'} 100%)` 
        }}
    >
         {/* Background Split */}
         <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-white/50 backdrop-blur-sm hidden md:block border-r border-gray-100"></div>

         {/* Header */}
         <div className="relative z-10 p-12 text-center pb-6">
             <div className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold tracking-widest uppercase mb-4">
                 Comparison
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-2 text-gray-900">
                 {data.hook}
             </h1>
             {data.sub_headline && (
                 <p className="text-xl text-gray-500 font-light italic">"{data.sub_headline}"</p>
             )}
         </div>

         {/* HEADERS ROW */}
         <div className="relative z-10 grid grid-cols-2 max-w-5xl mx-auto w-full px-8 mb-6 gap-4">
             <div className="p-6 rounded-2xl bg-white shadow-lg border-t-4 border-green-500 text-center">
                 <div className="w-12 h-12 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                     <Shield className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Giải Pháp Của Chúng Tôi</h2>
             </div>
             <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 text-center opacity-80">
                 <div className="w-12 h-12 mx-auto bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mb-3">
                     <X className="w-6 h-6" />
                 </div>
                 <h2 className="text-xl font-bold text-gray-500 uppercase tracking-tight">Thị Trường Chung</h2>
             </div>
         </div>

         {/* Comparison Rows */}
         <div className="flex-1 px-8 pb-12 relative z-10 max-w-5xl mx-auto w-full space-y-4">
             {data.comparison_items?.map((item, index) => (
                 <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 group"
                 >
                     {/* OUR SIDE */}
                     <div className={`
                         p-6 rounded-2xl shadow-md border flex items-center gap-4 transition-all duration-300
                         ${item.is_a_better ? 'bg-green-50 border-green-200 shadow-green-100 hover:shadow-green-200' : 'bg-white border-gray-100'}
                     `}>
                         <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.is_a_better ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                             {item.is_a_better ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                         </div>
                         <div className="flex-1">
                             <div className="text-xs font-bold uppercase text-gray-400 mb-1 md:hidden">Chúng tôi</div>
                             <h3 className={`font-bold text-lg ${item.is_a_better ? 'text-gray-900' : 'text-gray-500'}`}>{item.value_a}</h3>
                             <p className="text-sm text-gray-500">{item.feature}</p>
                         </div>
                     </div>

                     {/* THEIR SIDE */}
                     <div className={`
                         p-6 rounded-2xl border flex items-center gap-4 transition-all duration-300
                         ${!item.is_a_better ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 opacity-70 grayscale group-hover:grayscale-0'}
                     `}>
                         <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!item.is_a_better ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
                             {item.is_a_better ? <X className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                         </div>
                         <div className="flex-1 text-right md:text-left">
                             <div className="text-xs font-bold uppercase text-gray-400 mb-1 md:hidden">Khác</div>
                             <h3 className="font-bold text-lg text-gray-600">{item.value_b}</h3>
                             <p className="text-sm text-gray-400">{item.feature}</p>
                         </div>
                     </div>
                 </motion.div>
             ))}

             {/* Steps Fallback (If no comparison items but steps exist) */}
             {(!data.comparison_items || data.comparison_items.length === 0) && data.steps.map((step, index) => {
                  const Icon = getIcon(step.icon);
                  return (
                    <motion.div 
                        key={index}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                    >
                         <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                             <Icon className="w-6 h-6" />
                         </div>
                         <div>
                             <h3 className="font-bold text-gray-800">{step.label}</h3>
                             <p className="text-sm text-gray-600">{step.desc}</p>
                         </div>
                    </motion.div>
                  );
             })}
         </div>

         {/* Bottom Stat */}
         <div className="bg-gray-900 text-white p-8 text-center relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6">
                 <div className="text-left">
                     <div className="text-sm text-gray-400 uppercase tracking-widest">Sự Khác Biệt</div>
                     <div className="text-3xl font-bold">Vượt Trội Hơn</div>
                 </div>
                 <div className="text-6xl font-black text-green-400">{data.key_stat}</div>
             </div>
             {/* Decorative */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 opacity-20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
         </div>
    </div>
  );
};

export default InfographicComparison;
