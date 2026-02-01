import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSave(key.trim());
      setKey('');
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            🔑 Kết nối Gemini API Key
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Nhập API Key của bạn để sử dụng các tính năng AI. Key sẽ được lưu an toàn trong trình duyệt của bạn (hoặc sử dụng biến môi trường nếu đã cấu hình).
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">API Key</label>
              <input 
                type="password" 
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Nhập API Key tại đây..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all font-mono text-sm"
                autoFocus
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                disabled={!key.trim()}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lưu Key
              </button>
            </div>
          </form>
          
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline">
               Chưa có Key? Lấy miễn phí tại Google AI Studio
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
