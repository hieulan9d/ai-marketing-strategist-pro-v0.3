import React from 'react';
import { InfographicData } from '../../types';
import { getIcon } from './utils';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface Props {
  data: InfographicData;
}

const InfographicProcess: React.FC<Props> = ({ data }) => {
  return (
    <div 
        className="w-full min-h-[800px] bg-white rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{ 
            background: `linear-gradient(135deg, ${data.brand_colors.primary} 0%, ${data.brand_colors.secondary} 100%)` 
        }}
    >
         {/* Decorative Background */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-black opacity-10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
         
         {/* Texture Overlay */}
         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

         {/* Header */}
         <div className="relative z-10 p-12 text-center text-white pb-6">
             <div className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-bold tracking-widest uppercase mb-4 border border-white/20 shadow-lg">
                 Process Flow
             </div>
             <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 drop-shadow-md">
                 {data.hook}
             </h1>
             {data.sub_headline && (
                 <p className="text-xl opacity-90 font-light mb-6 italic">"{data.sub_headline}"</p>
             )}
             
             {/* Key Stat Badge */}
             <div className="inline-flex items-center gap-3 bg-white text-indigo-900 px-6 py-3 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 border border-white/50">
                 <div className="bg-indigo-100 p-2 rounded-full">
                     <TrendingUp className="w-6 h-6 text-indigo-600" />
                 </div>
                 <div className="text-left">
                     <div className="text-xs font-bold text-indigo-400 uppercase">Key Stat</div>
                     <div className="text-3xl font-black">{data.key_stat}</div>
                 </div>
             </div>
         </div>

         {/* Steps Layout (Zig-Zag) */}
         <div className="flex-1 p-8 md:p-12 relative z-10 max-w-5xl mx-auto w-full space-y-8">
             {data.steps.map((step, index) => {
                 const Icon = getIcon(step.icon);
                 return (
                     <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className={`flex items-center gap-6 ${index % 2 !== 0 ? 'flex-row-reverse text-right' : 'text-left'}`}
                     >
                         {/* Number Bubble */}
                         <div className={`
                            w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg z-20 shrink-0
                            bg-white text-[${data.brand_colors.primary}]
                         `} style={{ color: data.brand_colors.primary }}>
                             {index + 1}
                         </div>

                         {/* Content Card */}
                         <div className="flex-1 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                             <div className={`absolute top-0 bottom-0 w-2 ${index % 2 !== 0 ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-[${data.brand_colors.secondary}] to-transparent opacity-50`}></div>
                             
                             <div className={`flex items-center gap-4 ${index % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
                                <div className="p-3 bg-gray-50 rounded-xl text-gray-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-xl mb-1">{step.label}</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                             </div>
                         </div>
                     </motion.div>
                 );
             })}

             {/* Connecting Line (Simulated) */}
             <div className="absolute top-12 bottom-12 left-1/2 w-1 bg-white/30 -translate-x-1/2 hidden md:block rounded-full"></div>
         </div>

         {/* Footer */}
         <div className="p-8 text-center text-white/60 text-sm relative z-10 border-t border-white/10 mt-auto">
             Generated by AI Marketing Strategist Pro • {new Date().getFullYear()}
         </div>
    </div>
  );
};

export default InfographicProcess;
