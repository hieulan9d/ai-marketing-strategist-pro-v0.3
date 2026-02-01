
import React, { useEffect, useState } from 'react';
import * as ProjectService from '../services/projectService';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (id: string) => void;
  onNewProject: () => void;
  currentProjectId?: string;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose, onLoadProject, onNewProject, currentProjectId }) => {
  const [projects, setProjects] = useState<ProjectService.ProjectMetadata[]>([]);

  const refreshList = () => {
    const list = ProjectService.getProjectList();
    setProjects(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc muốn xóa dự án này? Hành động này không thể hoàn tác.")) {
      ProjectService.deleteProjectFromStorage(id);
      refreshList();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-white/80 p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
               📂 Quản Lý Dự Án
             </h2>
             <p className="text-xs text-gray-500 mt-1">Các dự án được lưu tự động trong trình duyệt này.</p>
          </div>
          <button 
             onClick={onNewProject}
             className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
          >
             <span>+ Dự Án Mới</span>
          </button>
        </div>

        {/* List */}
        <div className="p-6 bg-slate-50/50 max-h-[60vh] overflow-y-auto space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-50">📭</div>
              <p className="text-gray-500 font-medium">Chưa có dự án nào được lưu.</p>
              <p className="text-xs text-gray-400 mt-2">Hãy lưu dự án hiện tại của bạn để thấy nó ở đây.</p>
            </div>
          ) : (
            projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => onLoadProject(proj.id)}
                className={`group p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center
                  ${proj.id === currentProjectId 
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                    : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                  }
                `}
              >
                <div className="flex-1 min-w-0">
                   <h3 className={`font-bold text-sm truncate ${proj.id === currentProjectId ? 'text-emerald-800' : 'text-gray-800'}`}>
                     {proj.name}
                   </h3>
                   <p className="text-xs text-gray-500 mt-1 truncate max-w-[90%]">
                     {proj.preview}
                   </p>
                   <p className="text-[10px] text-gray-400 mt-2">
                     Cập nhật: {new Date(proj.lastSaved).toLocaleString('vi-VN')}
                   </p>
                </div>

                <div className="flex items-center gap-3 pl-4">
                    {proj.id === currentProjectId && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-600 font-bold px-2 py-1 rounded-full uppercase">Đang mở</span>
                    )}
                    <button 
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa dự án"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                    <button className="p-2 bg-gray-100 rounded-lg text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white/50 text-center">
           <button onClick={onClose} className="text-sm font-bold text-gray-500 hover:text-gray-800">Đóng</button>
        </div>

      </div>
    </div>
  );
};

export default ProjectManager;
