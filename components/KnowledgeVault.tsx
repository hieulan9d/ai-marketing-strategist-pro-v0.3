import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { KnowledgeFile } from '../types';
import { processFile } from '../services/knowledgeService';
import { FileText, Image as ImageIcon, Trash2, Upload, Loader2, FileJson, FileSpreadsheet } from 'lucide-react';

interface KnowledgeVaultProps {
    files: KnowledgeFile[];
    onUpdate: (files: KnowledgeFile[]) => void;
    onTrain?: (files: KnowledgeFile[]) => void;
}

const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({ files, onUpdate, onTrain }) => {
    const [isProcessing, setIsProcessing] = React.useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsProcessing(true);
        try {
            const newFiles = await Promise.all(acceptedFiles.map(processFile));
            // Append new files to existing ones
            // Mark new files as 'pending'
            const filesWithStatus = newFiles.map(f => ({ ...f, status: 'pending' as const }));
            onUpdate([...files, ...filesWithStatus]);
        } catch (error) {
            console.error("Upload error", error);
            alert("Lỗi khi tải file. Vui lòng thử lại.");
        } finally {
            setIsProcessing(false);
        }
    }, [files, onUpdate]);

    // @ts-ignore - Dropzone types compatibility
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/json': ['.json'],
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        }
    });

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc muốn xóa tài liệu này khỏi bộ nhớ?")) {
            onUpdate(files.filter(f => f.id !== id));
        }
    };

    const getFileIcon = (file: KnowledgeFile) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (file.name.endsWith('.json')) return <FileJson className="w-8 h-8 text-orange-500" />;
        if (file.name.endsWith('.csv')) return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
        return <FileText className="w-8 h-8 text-blue-500" />;
    };

    return (
        <div className="space-y-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-2xl shadow-lg text-white">
                <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                    🧠 Bộ Não Marketing (Knowledge Vault)
                </h2>
                <p className="text-emerald-100 text-lg">
                    Nơi lưu trữ tất cả tài liệu, hình ảnh, và dữ liệu thương hiệu. 
                    AI sẽ tự động học từ các file này để tạo nội dung chính xác hơn.
                </p>
            </div>

            {/* Dropzone */}
            <div 
                {...getRootProps()} 
                className={`border-3 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300
                    ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400 hover:bg-gray-50'}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    {isProcessing ? (
                        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    ) : (
                        <Upload className={`w-12 h-12 ${isDragActive ? 'text-emerald-500' : 'text-gray-400'}`} />
                    )}
                    
                    {isProcessing ? (
                        <p className="text-lg font-medium">Đang xử lý tài liệu...</p>
                    ) : isDragActive ? (
                        <p className="text-lg font-medium text-emerald-600">Thả file vào đây ngay...</p>
                    ) : (
                        <div>
                            <p className="text-lg font-medium text-gray-700">Kéo thả file hoặc click để tải lên</p>
                            <p className="text-sm mt-2">Hỗ trợ: .txt, .json, .csv, .docx, .jpg, .png</p>
                        </div>
                    )}
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                        <div key={file.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
                            <div className="flex items-start gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg flex-shrink-0">
                                    {file.preview ? (
                                        <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded-md" />
                                    ) : (
                                        getFileIcon(file)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800 truncate pr-2" title={file.name}>{file.name}</h4>
                                        {/* STATUS BADGE */}
                                        {file.status === 'learned' ? (
                                            <span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                                                ✅ Đã học
                                            </span>
                                        ) : (
                                            <span className="shrink-0 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                                                ⏳ Chờ nạp
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(file.size / 1024).toFixed(1)} KB • {new Date(file.lastModified).toLocaleDateString()}
                                    </p>
                                    <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                                        {file.type.split('/')[1] || 'FILE'}
                                    </span>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                                    className="absolute bottom-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa file"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TRAINING BUTTON */}
            {files.length > 0 && onTrain && (
                <div className="flex justify-center pt-6 border-t border-gray-200">
                    <button
                        onClick={() => onTrain(files)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-3 text-lg"
                    >
                        <span>💾</span> Nạp Kiến Thức & Phong Cách Vào AI
                    </button>
                </div>
            )}
        </div>
    );
};

export default KnowledgeVault;