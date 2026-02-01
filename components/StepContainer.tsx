import React, { ReactNode } from 'react';
import { StepStatus } from '../types';

interface StepContainerProps {
  title: string;
  stepNumber: number;
  status: StepStatus;
  isActive: boolean;
  onStepClick?: () => void;
  children: ReactNode;
  icon?: string;
}

const StepContainer: React.FC<StepContainerProps> = ({ title, stepNumber, status, isActive, onStepClick, children, icon }) => {
  const isLocked = status === StepStatus.LOCKED;
  
  // If not active, we hide it in the new dashboard layout (tabbed view), 
  // OR we can keep it as a section. 
  // Based on the new design, we will render ONLY the active step content 
  // to keep the UI clean, so we don't need "collapsed" states here.
  
  if (!isActive) return null;

  return (
    <div className="animate-fadeIn w-full">
      {/* Header Area for the Active Step */}
      <div className="flex items-end justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl text-white shadow-lg shadow-emerald-200">
             {icon || stepNumber}
           </div>
           <div>
             <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{title}</h2>
             <p className="text-sm text-gray-500 font-medium">Bước {stepNumber} • Quy trình Marketing tự động</p>
           </div>
        </div>
        
        {/* Status Badge */}
        <div className="hidden md:block">
           <span className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-100">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Đang làm việc
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/50 rounded-2xl p-1">
        {children}
      </div>
    </div>
  );
};

export default StepContainer;