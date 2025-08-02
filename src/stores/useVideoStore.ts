// src/stores/useVideoStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface StoredVideo {
  id: string;
  name: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  duration?: number; // in seconds
  uploadedAt: Date;
  thumbnail?: string; // Base64 thumbnail for quick preview
}

interface VideoState {
  videos: StoredVideo[];
  isLoading: boolean;
  lastError: string | null;
}

interface VideoActions {
  loadVideos: () => Promise<void>;
  uploadVideo: (file: File) => Promise<StoredVideo | null>;
  deleteVideo: (videoId: string) => Promise<boolean>;
  getVideo: (videoId: string) => StoredVideo | null;
  clearError: () => void;
}

export const useVideoStore = create<VideoState & VideoActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    videos: [],
    isLoading: false,
    lastError: null,

    // Actions
    loadVideos: async () => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically to avoid SSR issues
        const { invoke } = await import('@tauri-apps/api/core');
        
        const videos = await invoke<StoredVideo[]>('get_stored_videos');
        set({ videos, isLoading: false });
      } catch (error) {
        console.error('Failed to load videos:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to load videos',
          isLoading: false 
        });
      }
    },

    uploadVideo: async (file: File) => {
      set({ isLoading: true, lastError: null });
      
      try {
        // Import Tauri APIs dynamically
        const { invoke } = await import('@tauri-apps/api/core');
        
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:video/mp4;base64,)
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload video to Tauri backend
        const storedVideo = await invoke<StoredVideo>('upload_video', {
          fileName: file.name,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size
        });

        // Add to local state
        set(state => ({
          videos: [...state.videos, storedVideo],
          isLoading: false
        }));

        return storedVideo;
      } catch (error) {
        console.error('Failed to upload video:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to upload video',
          isLoading: false 
        });
        return null;
      }
    },

    deleteVideo: async (videoId: string) => {
      set({ isLoading: true, lastError: null });
      
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        
        await invoke('delete_video', { videoId });
        
        // Remove from local state
        set(state => ({
          videos: state.videos.filter(video => video.id !== videoId),
          isLoading: false
        }));

        return true;
      } catch (error) {
        console.error('Failed to delete video:', error);
        set({ 
          lastError: error instanceof Error ? error.message : 'Failed to delete video',
          isLoading: false 
        });
        return false;
      }
    },

    getVideo: (videoId: string) => {
      const { videos } = get();
      return videos.find(video => video.id === videoId) || null;
    },

    clearError: () => {
      set({ lastError: null });
    },
  }))
);