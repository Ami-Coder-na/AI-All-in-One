import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ModelNames, AspectRatio, ImageSize } from "../types";

// Helper to handle Paid Key selection for Veo/Imagen
const getClient = async (requirePaidKey: boolean = false): Promise<GoogleGenAI> => {
  if (requirePaidKey && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// --- CHAT & TEXT ---
export const generateChatResponse = async (
  model: string,
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  useThinking: boolean = false,
  useSearch: boolean = false,
  useMaps: boolean = false,
  location?: { latitude: number; longitude: number }
) => {
  const ai = await getClient();
  const tools: any[] = [];
  const toolConfig: any = {};

  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) {
    tools.push({ googleMaps: {} });
    if (location) {
      toolConfig.retrievalConfig = { latLng: location };
    }
  }

  const config: any = {
    tools: tools.length > 0 ? tools : undefined,
    toolConfig: tools.length > 0 && Object.keys(toolConfig).length > 0 ? toolConfig : undefined,
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
    // DO NOT set maxOutputTokens when using thinking budget
  }

  const chat = ai.chats.create({
    model: model,
    history: history,
    config,
  });

  const response = await chat.sendMessage({ message: newMessage });
  return {
    text: response.text,
    groundingMetadata: response.candidates?.[0]?.groundingMetadata
  };
};

// --- IMAGE GENERATION (PRO) ---
export const generateProImage = async (prompt: string, aspectRatio: AspectRatio, size: ImageSize) => {
  const ai = await getClient(true); // Requires paid key
  
  const response = await ai.models.generateContent({
    model: ModelNames.PRO_IMAGE,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
         images.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

// --- IMAGEN GENERATION ---
export const generateImagen = async (prompt: string, aspectRatio: string) => {
  const ai = await getClient(true);
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: aspectRatio as any,
      outputMimeType: 'image/jpeg',
    }
  });
  
  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
  }
  return null;
};

// --- IMAGE EDITING (FLASH) ---
export const editImage = async (base64Image: string, mimeType: string, prompt: string) => {
  const ai = await getClient();
  const response = await ai.models.generateContent({
    model: ModelNames.FLASH_IMAGE,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
         images.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return images;
};

// --- VIDEO GENERATION (VEO) ---
export const generateVeoVideo = async (
  prompt: string, 
  aspectRatio: '16:9' | '9:16', 
  imageBase64?: string, 
  imageMimeType?: string
) => {
  const ai = await getClient(true); // Requires paid key

  let operation;
  
  if (imageBase64 && imageMimeType) {
    operation = await ai.models.generateVideos({
      model: ModelNames.VEO_FAST,
      prompt: prompt || "Animate this image",
      image: {
        imageBytes: imageBase64,
        mimeType: imageMimeType
      },
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });
  } else {
    operation = await ai.models.generateVideos({
      model: ModelNames.VEO_FAST,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });
  }

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed or returned no URI");
  
  // Use a proxy fetch to append key. 
  // In a real browser app, we can just return the URI with key appended for <video src="...">
  return `${videoUri}&key=${process.env.API_KEY}`;
};


// --- VISION & ANALYSIS ---
export const analyzeMedia = async (
  model: string,
  prompt: string,
  fileBase64: string,
  mimeType: string
) => {
  const ai = await getClient();
  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [
        {
          inlineData: {
            data: fileBase64,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });
  return response.text;
};

// --- AUDIO TRANSCRIPTION ---
export const transcribeAudio = async (audioBase64: string, mimeType: string) => {
  const ai = await getClient();
  const response = await ai.models.generateContent({
    model: ModelNames.FLASH,
    contents: {
      parts: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType
          }
        },
        { text: "Transcribe this audio exactly." }
      ]
    }
  });
  return response.text;
};

// --- TEXT TO SPEECH ---
export const generateSpeech = async (text: string) => {
  const ai = await getClient();
  const response = await ai.models.generateContent({
    model: ModelNames.TTS,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};

// --- LIVE API UTILS ---
// (Live API logic is complex and stateful, better handled in the component or a custom hook, 
//  but we export the connection initializer here for consistency)
export const initLiveSession = async (
  onOpen: () => void,
  onMessage: (msg: any) => void,
  onError: (e: any) => void,
  onClose: (e: any) => void
) => {
  const ai = await getClient();
  return ai.live.connect({
    model: ModelNames.LIVE,
    callbacks: { onopen: onOpen, onmessage: onMessage, onerror: onError, onclose: onClose },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
    },
  });
};