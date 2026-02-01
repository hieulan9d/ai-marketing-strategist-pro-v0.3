
import { AppState } from "../types";

const STORAGE_KEY_PREFIX = 'ai_strategist_proj_';
const INDEX_KEY = 'ai_strategist_index';

export interface ProjectMetadata {
  id: string;
  name: string;
  lastSaved: number;
  preview: string; // Short preview text
}

// Helper: Safe ID Generator (No Crypto Dependency)
const generateSafeId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Get list of all saved projects
export const getProjectList = (): ProjectMetadata[] => {
  try {
    const indexStr = localStorage.getItem(INDEX_KEY);
    return indexStr ? JSON.parse(indexStr) : [];
  } catch (e) {
    console.error("Error reading project index", e);
    return [];
  }
};

// Save a project
export const saveProjectToStorage = (state: AppState): AppState => {
  try {
    // 1. Ensure ID exists using safe generator
    const projectId = state.id || generateSafeId();
    
    // 2. Generate Project Name if missing
    const projectName = state.projectName && state.projectName.trim() !== "" 
      ? state.projectName 
      : (state.productInput 
        ? (state.productInput.substring(0, 30) + (state.productInput.length > 30 ? '...' : '')) 
        : `Dự án ${new Date().toLocaleDateString('vi-VN')}`);
    
    const timestamp = Date.now();

    // 3. Clone and Clean state (Remove heavy Base64 images to avoid LocalStorage Quota Exceeded)
    // We keep the structure but empty the image strings for browser storage
    const stateToSave = JSON.parse(JSON.stringify(state));
    stateToSave.id = projectId;
    stateToSave.projectName = projectName;
    stateToSave.lastSaved = timestamp;

    // Strip images from Calendar
    if (stateToSave.calendar) {
      stateToSave.calendar.forEach((day: any) => {
        if (day.details) {
          if (day.details.generatedImage) day.details.generatedImage = null;
          if (day.details.generatedVideo) day.details.generatedVideo = null; // Blob URLs are invalid anyway after reload
        }
      });
    }

    // Strip images from Ads
    if (stateToSave.adsCampaigns) {
      stateToSave.adsCampaigns.forEach((camp: any) => {
        if (camp.data && camp.data.adContent) {
           if (camp.data.adContent.generatedImage) camp.data.adContent.generatedImage = null;
           if (camp.data.adContent.generatedVideo) camp.data.adContent.generatedVideo = null;
        }
      });
    }

    // 4. Save to LocalStorage
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(stateToSave));

    // 5. Update Index
    const currentIndex = getProjectList();
    const existingEntryIndex = currentIndex.findIndex(p => p.id === projectId);
    
    // SAFE PREVIEW GENERATION
    const previewText = (state.strategy && state.strategy.usp) 
      ? state.strategy.usp 
      : "Chưa có chiến lược";

    const meta: ProjectMetadata = {
      id: projectId,
      name: projectName,
      lastSaved: timestamp,
      preview: previewText
    };

    if (existingEntryIndex >= 0) {
      currentIndex[existingEntryIndex] = meta;
    } else {
      currentIndex.unshift(meta); // Add to top
    }

    localStorage.setItem(INDEX_KEY, JSON.stringify(currentIndex));

    // Return the state with ID/Name updated so UI reflects it
    return { ...state, id: projectId, projectName: projectName, lastSaved: timestamp };

  } catch (e: any) {
    console.error("Save failed", e);
    if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
        throw new Error("Bộ nhớ trình duyệt đã đầy. Vui lòng xóa bớt các dự án cũ hoặc sử dụng 'Tải Trọn Bộ (ZIP)' để lưu trữ.");
    }
    throw new Error("Không thể lưu dự án. Vui lòng thử lại hoặc tải file JSON.");
  }
};

// Load a project
export const loadProjectFromStorage = (id: string): AppState | null => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY_PREFIX + id);
    if (!dataStr) return null;
    return JSON.parse(dataStr);
  } catch (e) {
    console.error("Load failed", e);
    return null;
  }
};

// Delete a project
export const deleteProjectFromStorage = (id: string) => {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + id);
    const currentIndex = getProjectList();
    const newIndex = currentIndex.filter(p => p.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
  } catch (e) {
    console.error("Delete failed", e);
  }
};
