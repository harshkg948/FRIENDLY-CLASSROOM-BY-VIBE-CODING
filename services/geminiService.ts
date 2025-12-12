import { GoogleGenAI, Modality, Type, LiveServerMessage } from "@google/genai";

const getAIClient = (apiKey?: string) => {
    // In a real app, you might want to allow users to input their own key if env is missing,
    // but per instructions we rely on process.env.API_KEY usually.
    // However, for Veo we might need a dynamic key.
    const key = apiKey || process.env.API_KEY;
    if (!key) throw new Error("API Key missing");
    return new GoogleGenAI({ apiKey: key });
};

// --- IMAGE EDITING ---
export const editImage = async (base64Image: string, prompt: string, mimeType: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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

    // Check for image in response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    return null;
};

// --- SEARCH GROUNDING ---
export const searchAssistant = async (query: string) => {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    const text = response.text;
    const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { text, grounding };
};

// --- VEO VIDEO GENERATION ---
export const generateVideo = async (prompt: string, imageBase64: string, apiKey: string) => {
    // Note: Veo requires the user's selected API key usually passed in here.
    const ai = getAIClient(apiKey);
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || "Animate this image",
        image: {
            imageBytes: imageBase64,
            mimeType: 'image/jpeg' // Assuming jpeg for simplicity, or detect
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
        return `${videoUri}&key=${apiKey}`;
    }
    throw new Error("Failed to generate video");
};

// --- LIVE API ---
export const connectLiveSession = async (
    onAudioData: (base64: string) => void,
    onClose: () => void,
    onError: () => void,
    onTranscription?: (text: string, type: 'user' | 'model', endOfTurn: boolean) => void
) => {
    const ai = getAIClient();
    const session = await ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log("Live session opened");
            },
            onmessage: (message: LiveServerMessage) => {
                 const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                 if (base64EncodedAudioString) {
                     onAudioData(base64EncodedAudioString);
                 }
                 
                 // Handle Transcriptions
                 if (onTranscription) {
                     if (message.serverContent?.outputTranscription) {
                        onTranscription(message.serverContent.outputTranscription.text, 'model', false);
                     }
                     if (message.serverContent?.inputTranscription) {
                        onTranscription(message.serverContent.inputTranscription.text, 'user', false);
                     }
                     if (message.serverContent?.turnComplete) {
                         onTranscription('', 'model', true);
                     }
                 }
            },
            onclose: (e) => {
                console.log("Live session closed", e);
                onClose();
            },
            onerror: (e) => {
                console.error("Live session error", e);
                onError();
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            },
            systemInstruction: "You are a helpful teaching assistant for a college class. Be concise, friendly, and engaging. Encourage follow-up questions and guide the student to the answer.",
            inputAudioTranscription: {},
            outputAudioTranscription: {}
        }
    });
    return session;
};

// Helper to encode raw PCM for Live API
export const pcmToBlob = (data: Float32Array): { data: string, mimeType: string } => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return {
        data: base64,
        mimeType: 'audio/pcm;rate=16000'
    };
};

// Helper to decode raw PCM from Live API
export const decodeAudio = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const createAudioBuffer = (data: Uint8Array, ctx: AudioContext) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000); // 24kHz is standard for Gemini output
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
}