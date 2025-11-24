import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateTaskDetails = async (taskTitle: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `For a task management card titled "${taskTitle}", provide a professional, concise description (max 2 sentences) and a list of 3-5 actionable subtasks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A concise description of the task."
            },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "Actionable subtask item."
              }
            }
          },
          required: ["description", "subtasks"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
