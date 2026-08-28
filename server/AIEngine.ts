import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getAiInstance } from "./ChatEngine.js";

async function getAi(db?: any) {
  return await getAiInstance(db);
}

/**
 * Handles multi-turn chat using appropriate models based on modes.
 * Support modes: 'general' | 'low-latency' | 'thinking' | 'maps'
 */
export async function runAIChat(params: {
  message: string;
  history?: any[];
  mode?: 'general' | 'low-latency' | 'thinking' | 'maps';
  systemInstruction?: string;
  db?: any;
}) {
  const { db } = params;
  const ai = await getAi(db);
  if (!ai) {
    return {
      text: "The Omorfi AI assistant is currently offline because the Gemini API key is not configured in environment variables or Settings.",
      model: "gemini-1.5-flash",
      groundingChunks: null
    };
  }
  const { message, history = [], mode = 'general', systemInstruction } = params;

  // Select model and configuration based on mode
  let modelName = "gemini-1.5-flash";
  const options: any = {
    systemInstruction: systemInstruction || "You are a helpful and professional customer care assistant for OmorfiHub, a secure multi-user logistics and escrow platform.",
  };

  if (mode === 'low-latency') {
    modelName = "gemini-1.5-flash";
  } else if (mode === 'thinking') {
    modelName = "gemini-1.5-pro";
  } else if (mode === 'maps') {
    modelName = "gemini-1.5-flash";
    options.tools = [{ googleSearch: {} }];
  }

  // Build full message contents representing the chat history + current message
  const safeHistory = Array.isArray(history) ? history : [];
  const contents = [
    ...safeHistory,
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      ...options
    });

    const text = response.text || "No response received.";

    // Extract grounding metadata if Maps or Search grounding is used
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || null;

    return {
      text,
      model: modelName,
      groundingChunks
    };
  } catch (err: any) {
    console.error("[runAIChat] Gemini generateContent error:", err);
    let fallbackText = "I am currently having trouble reaching the AI assistant service. Please try again or open a support ticket.";
    if (err.message && (err.message.includes("GEMINI_API_KEY") || err.message.includes("API key") || err.message.includes("apiKey"))) {
      fallbackText = "The Omorfi AI assistant is currently offline because GEMINI_API_KEY is not configured in settings.";
    }
    return {
      text: fallbackText,
      model: modelName,
      groundingChunks: null
    };
  }
}

/**
 * Performs image or video understanding using gemini-3.1-pro-preview.
 */
export async function analyzeMedia(params: {
  mediaBase64: string;
  mimeType: string;
  prompt: string;
  db?: any;
}) {
  const { db } = params;
  const ai = await getAi(db);
  if (!ai) {
    return { text: "AI media analysis is offline because GEMINI_API_KEY is not configured in settings." };
  }
  const { mediaBase64, mimeType, prompt } = params;

  const mediaPart = {
    inlineData: {
      data: mediaBase64,
      mimeType: mimeType
    }
  };

  const textPart = {
    text: prompt || "Analyze this media content and describe key details, security compliance, or packaging status."
  };

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [mediaPart, textPart]
    }
  });

  return {
    text: response.text || "No response received."
  };
}

/**
 * Generates an image using gemini-3.1-flash-image or gemini-3-pro-image with specific aspect ratio controls.
 */
export async function generateAIImage(params: {
  prompt: string;
  aspectRatio: string;
  quality: 'general' | 'studio';
  db?: any;
}) {
  const { db } = params;
  const ai = await getAi(db);
  if (!ai) {
    throw new Error("AI image generation is offline because GEMINI_API_KEY is not configured in settings.");
  }
  const { prompt, aspectRatio, quality } = params;

  const modelName = quality === 'studio' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

  // Supported ratios in config: "1:1", "3:4", "4:3", "9:16", "16:9", etc.
  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio || "1:1",
      }
    }
  });

  let imageUrl: string | null = null;

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) {
    throw new Error("No image was returned by the AI image generation model.");
  }

  return {
    imageUrl,
    model: modelName
  };
}

/**
 * Scans an ID document and extracts structured information using Gemini multimodal capabilities.
 */
export async function scanIdDocument(params: {
  mediaBase64: string;
  mimeType: string;
  expectedName: string;
  db?: any;
}) {
  const { mediaBase64, mimeType, expectedName, db } = params;
  const ai = await getAi(db);
  if (!ai) {
    return {
      documentType: "OTHER",
      fullName: expectedName || "Unknown",
      docNumber: "Unknown",
      expiryDate: "N/A",
      dob: "N/A",
      confidence: 50,
      verified: false,
      message: "AI document scanning requires GEMINI_API_KEY to be configured in settings."
    };
  }

  // Clean base64 data to remove any data URL prefixes
  let cleanBase64 = mediaBase64;
  if (mediaBase64.includes(';base64,')) {
    cleanBase64 = mediaBase64.split(';base64,')[1];
  }

  const mediaPart = {
    inlineData: {
      data: cleanBase64,
      mimeType: mimeType || "image/jpeg"
    }
  };

  const promptText = `
    You are OmorfiHub's Secure Identity Verification system. Analyze this identity document (Passport, Driver's License, National ID Card, etc.) and extract the details.
    Compare the extracted Full Name with the user's expected profile name: "${expectedName}".

    Please return a JSON response with the following keys. Do not include markdown wraps.
    {
      "documentType": "PASSPORT" | "NIN_CARD" | "DRIVERS_LICENSE" | "OTHER",
      "fullName": "Extracted name from the ID",
      "docNumber": "Extracted ID number",
      "expiryDate": "Extracted expiry date or 'N/A' if not found",
      "dob": "Extracted date of birth or 'N/A' if not found",
      "confidence": number from 0 to 100,
      "verified": boolean (true if confidence is >= 75 and name matches expectedName sufficiently, otherwise false),
      "message": "Detailed explanation of verification result"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [mediaPart, { text: promptText }]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const responseText = response.text || "{}";
  try {
    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON. Response text:", responseText, err);
    return {
      documentType: "OTHER",
      fullName: "Unknown",
      docNumber: "Unknown",
      expiryDate: "N/A",
      dob: "N/A",
      confidence: 0,
      verified: false,
      message: "Failed to parse document text or image is unreadable. Please upload a clear photo of your ID."
    };
  }
}

/**
 * Predicts arrival times based on current logistics traffic and parcel size data.
 */
export async function estimateDelivery(params: {
  origin: string;
  destination: string;
  parcelSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  trafficLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  db?: any;
}) {
  const { db } = params;
  const ai = await getAi(db);
  if (!ai) {
    return {
      estimatedDays: 3,
      estimatedArrivalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      reasoning: "Standard estimated delivery timeframe.",
      confidence: 70,
      riskLevel: "LOW"
    };
  }
  const { origin, destination, parcelSize, trafficLevel = 'NORMAL' } = params;

  const prompt = `
    As the OmorfiHub Logistics AI, estimate the delivery time for a parcel with the following parameters:
    - Origin Hub: ${origin}
    - Destination Hub: ${destination}
    - Parcel Size: ${parcelSize} (Small, Medium, Large)
    - Current Logistics Network Traffic Level: ${trafficLevel}

    Consider typical distances in Nigeria, handling times for different parcel sizes, and the specified traffic level.
    Return a structured JSON response with the following keys. Do not include markdown wraps.
    {
      "estimatedDays": number (total days),
      "estimatedArrivalDate": "ISO string",
      "reasoning": "A brief explanation of the prediction focusing on distance and traffic",
      "confidence": number (0-100),
      "riskLevel": "LOW" | "MODERATE" | "HIGH"
    }

    IMPORTANT: Do NOT include any information about "hub storage", "storage capacity", or "warehouse space" in the reasoning or the output. Focus entirely on logistics traffic, transit distance, and parcel handling times.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      responseMimeType: "application/json"
    }
  });

  const responseText = response.text || "{}";
  try {
    return JSON.parse(responseText.trim());
  } catch (err) {
    console.error("Failed to parse delivery estimate response:", responseText);
    return {
      estimatedDays: 3,
      estimatedArrivalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      reasoning: "Standard delivery time based on hub distance.",
      confidence: 70,
      riskLevel: "LOW"
    };
  }
}
