
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, RodId, GeminiHint, Move } from "../types";

// Initialize with empty key if env not present, handling will occur in UI
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean JSON string if it contains markdown
const cleanJson = (text: string) => {
  if (!text) return "";
  // Remove ```json and ``` wrappers if present
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
};

export const getGameHint = async (gameState: GameState): Promise<GeminiHint> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const rodA = gameState.rods['A'].map(d => d.size).join(',');
  const rodB = gameState.rods['B'].map(d => d.size).join(',');
  const rodC = gameState.rods['C'].map(d => d.size).join(',');

  const prompt = `
    You are a Tower of Hanoi expert tutor.
    The goal is to move all disks to Rod C.
    
    Current State (Disk sizes, smallest to largest allowed on rod):
    Rod A: [${rodA}] (Top is last)
    Rod B: [${rodB}]
    Rod C: [${rodC}]
    
    Total Disks: ${gameState.diskCount}.
    
    Analyze the board. 
    1. Determine the mathematically optimal next move.
    2. Explain WHY this move is strategic in 1 brief sentence (max 20 words).
    
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            suggestedMove: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING, enum: ["A", "B", "C"] },
                to: { type: Type.STRING, enum: ["A", "B", "C"] }
              },
              required: ["from", "to"]
            }
          },
          required: ["explanation", "suggestedMove"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(cleanJson(text)) as GeminiHint;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const solveTowerOfHanoi = async (
  diskCount: number, 
  model: string, 
  useReasoning: boolean
): Promise<Move[]> => {
  if (!apiKey) throw new Error("API Key is missing.");

  const prompt = `
    Solve the Tower of Hanoi puzzle for ${diskCount} disks.
    The goal is to move all disks from Rod A to Rod C.
    Return the complete sequence of moves required to solve the puzzle.
    Format the output as a JSON object containing an array of moves.
  `;

  // Configure Thinking if enabled and supported (2.5 series or 3-pro)
  const isThinkingModel = model.includes('2.5') || model.includes('3-pro');
  
  // Determine max budget based on model
  // Flash max: 24576, Pro max: 32768
  const maxBudget = (model.includes('flash') || model.includes('lite')) ? 24576 : 32768;

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        moves: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING, enum: ["A", "B", "C"] },
              to: { type: Type.STRING, enum: ["A", "B", "C"] },
            },
            required: ["from", "to"],
          },
        },
      },
      required: ["moves"],
    },
  };

  if (isThinkingModel) {
    // If reasoning is on, use MAX budget. If off, use 0 (standard generation).
    config.thinkingConfig = { thinkingBudget: useReasoning ? maxBudget : 0 };
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: config,
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(cleanJson(text));
    return result.moves as Move[];
  } catch (error) {
    console.error("Gemini Solve Error:", error);
    throw error;
  }
};
