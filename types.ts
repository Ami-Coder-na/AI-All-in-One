export enum ModelNames {
  FLASH = 'gemini-2.5-flash',
  FLASH_LITE = 'gemini-flash-lite-latest',
  PRO = 'gemini-3-pro-preview',
  PRO_VISION = 'gemini-3-pro-preview',
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  TTS = 'gemini-2.5-flash-preview-tts',
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO_PRO = 'veo-3.1-generate-preview',
  LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025'
}

export enum AppSection {
  DASHBOARD = 'dashboard',
  CHAT = 'chat',
  LIVE = 'live',
  MEDIA_GEN = 'media_gen',
  ANALYSIS = 'analysis',
  AUDIO = 'audio'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
  isThinking?: boolean;
  groundingMetadata?: any;
}

export interface GeneratedMedia {
  type: 'image' | 'video';
  url: string;
  prompt: string;
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";
export type VideoResolution = "720p" | "1080p";
