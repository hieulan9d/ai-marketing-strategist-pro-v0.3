import mammoth from 'mammoth';
import { KnowledgeFile } from '../types';
import { analyzeUploadedAsset } from './geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const processFile = async (file: File): Promise<KnowledgeFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Failed to read file"));

    // 1. Handle Images
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        let description = "";
        try {
            // Attempt auto-analysis
            description = await analyzeUploadedAsset(reader.result as string, file.type);
        } catch (e) {
            console.warn("Image analysis failed (ignoring for now):", e);
        }

        resolve({
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string, // Base64
          preview: reader.result as string,
          description: description,
          lastModified: file.lastModified
        });
      };
    } 
    // 2. Handle DOCX
    else if (file.name.endsWith('.docx')) {
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const { value } = await mammoth.extractRawText({ arrayBuffer });
          resolve({
            id: generateId(),
            name: file.name,
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: file.size,
            content: value, // Extracted Text
            lastModified: file.lastModified
          });
        } catch (e) {
          console.error("DOCX extraction failed", e);
          // Fallback to empty content or error message
          resolve({
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            content: "[Error: Could not extract text from DOCX]",
            lastModified: file.lastModified
          });
        }
      };
    }
    // 3. Handle Text Files (txt, json, csv, md)
    else {
      reader.readAsText(file);
      reader.onload = () => {
        resolve({
          id: generateId(),
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: reader.result as string,
          lastModified: file.lastModified
        });
      };
    }
  });
};

export const buildVaultContext = (files: KnowledgeFile[]): string => {
  if (!files || files.length === 0) return "";

  const contextParts = files.map(f => {
    // Include Image Analysis in context if available
    if (f.type.startsWith('image/')) {
      return `[Visual Asset: ${f.name}] (Type: ${f.type})\n${f.description ? `[Visual Analysis/Style]: ${f.description}` : ''}`;
    }
    
    // Truncate huge files to avoid context overflow (e.g., 20k chars per file)
    const safeContent = f.content.length > 20000 
      ? f.content.substring(0, 20000) + "...[TRUNCATED]" 
      : f.content;

    return `=== KNOWLEDGE SOURCE: ${f.name} ===\n${safeContent}\n==============================\n`;
  });

  return `
    === KNOWLEDGE VAULT (USER UPLOADED) ===
    The user has provided the following specific knowledge documents. 
    Use this information as the PRIMARY source of truth.
    
    ${contextParts.join('\n')}
    =======================================
  `;
};
