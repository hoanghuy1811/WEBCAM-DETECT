import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReferenceFace, MatchResult } from '../types';

const MODEL_NAME = 'gemini-2.5-flash'; // Fast, multimodal, good at reasoning

export const identifyFace = async (
  currentFrameBase64: string,
  referenceFaces: ReferenceFace[]
): Promise<MatchResult[]> => {
  
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return [];
  }

  if (referenceFaces.length === 0) {
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct the prompt parts
    const parts: any[] = [];

    // 1. Add the target frame (Webcam capture)
    parts.push({
      text: "Here is the IMAGE_TO_ANALYZE (Current Webcam Frame):"
    });
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: currentFrameBase64
      }
    });

    // 2. Add reference images
    parts.push({
      text: "Below are the REFERENCE_FACES from the database. Compare ANY person found in the IMAGE_TO_ANALYZE against these reference faces."
    });

    // Limit reference faces to prevent payload explosion (e.g., take first 10 or user selected)
    const activeReferences = referenceFaces.slice(0, 8); 
    
    activeReferences.forEach((face, index) => {
      parts.push({
        text: `Reference Face #${index + 1}: Name="${face.name}"`
      });
      parts.push({
        inlineData: {
          mimeType: face.mimeType,
          data: face.data
        }
      });
    });

    // 3. Define the schema - Now an ARRAY of MatchResult objects
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          matchFound: { type: Type.BOOLEAN, description: "True if this specific face matches a reference face with > 50% confidence." },
          matchedName: { type: Type.STRING, description: "The name of the matched person from the reference list. Null if no match." },
          confidence: { type: Type.NUMBER, description: "A score from 0.0 to 1.0 indicating confidence of the match." },
          maskDetected: { type: Type.BOOLEAN, description: "True if this person is wearing a face mask." },
          reasoning: { type: Type.STRING, description: "Brief explanation of visual features compared." }
        },
        required: ["matchFound", "confidence", "maskDetected"],
      }
    };

    // 4. System Instruction
    const systemInstruction = `
      You are a high-security biometric authentication system. 
      Your task is to analyze the 'IMAGE_TO_ANALYZE' and detect ALL faces present in the frame.
      
      Rules:
      1. Detect ALL distinct faces in the image.
      2. For EACH detected face, compare it against the provided 'REFERENCE_FACES'.
      3. If a face matches a reference face, calculate a confidence score.
      4. Return 'matchFound': true ONLY if the confidence score is strictly greater than 0.5 (50%). If confidence is 0.5 or lower, 'matchFound' must be false.
      5. Ignore background differences.
      6. Identify if a mask is worn for each face.
      7. Return the result as a JSON ARRAY, with one object for each detected face. If no faces are detected, return an empty array.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1, // Low temperature for analytical precision
      }
    });

    if (response.text) {
      const results = JSON.parse(response.text) as MatchResult[];
      // Ensure we return an array even if the model somehow returns a single object (edge case handling)
      return Array.isArray(results) ? results : [results];
    } else {
      throw new Error("No response text from Gemini");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};