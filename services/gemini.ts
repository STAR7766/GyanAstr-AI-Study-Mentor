import { GoogleGenAI, Type, Schema, Tool, Modality } from "@google/genai";
import { AnalysisResult, TestQuestion } from "../types";

const apiKey = process.env.VITE_API_KEY || '';

// Create a singleton instance
export const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    alchemy: {
      type: Type.OBJECT,
      properties: {
        summaryPoints: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "For Theory: Clear, bulleted summary. For Math/Physics: Detailed STEP-BY-STEP derivation/solution lines."
        },
        examAlerts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "For Theory: Key formulas/dates. For Math: The Final Answer and key constraints."
        },
        realWorldConnection: {
          type: Type.STRING,
          description: "Explanation of why this matters with a practical engineering example."
        }
      },
      required: ["summaryPoints", "examAlerts", "realWorldConnection"]
    },
    mermaidCode: {
      type: Type.STRING,
      description: "A valid Mermaid.js graph definition. Start with 'graph TD'. STRICTLY use alphanumeric Node IDs with bracketed labels, e.g., A[\"Topic\"] --> B[\"Subtopic\"]. Do not use the topic name as the ID."
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["question", "answer"]
      },
      description: "5 Question-Answer pairs."
    },
    vivaQuestion: {
      type: Type.STRING,
      description: "One distinct 'Thought-Provoking Question'."
    }
  },
  required: ["alchemy", "mermaidCode", "flashcards", "vivaQuestion"]
};

// Now accepts either a string (text/url) OR an object with base64 data
export const analyzeLecture = async (input: string | { data: string; mimeType: string }): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key is missing");

  const systemInstruction = `You are GyanAstr, an elite AI Academic Mentor.
  
  CORE RULES:
  1. **Math/Problem Solving**: If the input is a problem, you MUST provide the solution STEP-BY-STEP. Every calculation step must be a separate point in 'summaryPoints'. State the final answer clearly in 'examAlerts'.
  2. **Handwritten Converter**: If the input is a PDF/Text, structure the 'summaryPoints' so they look like beautiful lecture notes when rendered.
  3. **Theory**: Use concise bullet points.
  4. **Mermaid Graph**: Ensure the graph syntax is valid. Create a conceptual Mind Map or Flowchart summarizing the key topics. Essential for Theory. Use alphanumeric IDs (e.g., Node1, Node2) and put text in ["quotes"].
  
  Output strict JSON.`;

  try {
    let contents;
    let tools: Tool[] | undefined = undefined;

    if (typeof input === 'string') {
        const isYoutube = input.includes('youtube.com') || input.includes('youtu.be');
        
        if (isYoutube) {
            // Logic for YouTube inputs
            tools = [{ googleSearch: {} }];
            contents = [{ text: `Analyze the YouTube video at this link: ${input}.
            
            CRITICAL INSTRUCTION: 
            1. You MUST attempt to retrieve the video transcript or captions using your search tools to generate the notes. 
            2. If you find the content, generate the full JSON output as per the schema.
            3. IF THE VIDEO DOES NOT HAVE TRANSCRIPTS or you CANNOT access the content, you MUST return a valid JSON object where:
               - 'alchemy.summaryPoints' contains exactly one string: "This video cannot be summarized because the transcript is not available or accessible."
               - 'alchemy.examAlerts' contains: ["N/A"]
               - 'alchemy.realWorldConnection' is: "N/A"
               - 'mermaidCode' is: "graph TD\nError[\"No Transcript Found\"]"
               - 'flashcards' is an empty list or a placeholder.
               - 'vivaQuestion' is: "N/A"
            ` }];
        } else {
            contents = [{ text: input }];
        }
    } else {
        // Multimodal input (Image/PDF)
        contents = [
            { 
                inlineData: {
                    mimeType: input.mimeType,
                    data: input.data
                }
            },
            { text: "Analyze this study material. If it is a problem, solve it step-by-step. If it is notes, summarize it." }
        ];
    }

    // UPDATED: Using gemini-3-pro-preview with thinking budget for complex analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for deep reasoning
        tools: tools,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response text received");
    
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const chatWithMentor = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  if (!apiKey) throw new Error("API Key is missing");

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash-lite', // UPDATED: Using Flash-Lite for low-latency chat
    history: history,
    config: {
      systemInstruction: `You are GyanAstr. 
      1. If asked to solve a problem, provide a detailed, step-by-step mathematical derivation using clear formatting.
      2. If asked for a diagram, flowchart, or if a theory concept is complex and needs visualization, generate a Mermaid.js diagram code block.
      3. STRICTLY enclose the Mermaid code in a code block like this:
      \`\`\`mermaid
      graph TD
      A[Start] --> B[End]
      \`\`\`
      4. Ensure the graph syntax is valid. Use alphanumeric IDs.`,
    }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text;
};

export const generateTest = async (contextText: string, numQuestions: number): Promise<TestQuestion[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        question: { type: Type.STRING },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Exactly 4 options" 
        },
        correctAnswerIndex: { type: Type.INTEGER }
      },
      required: ["id", "question", "options", "correctAnswerIndex"]
    }
  };

  const safeContext = contextText.length > 100000 ? contextText.substring(0, 100000) : contextText;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate ${numQuestions} multiple choice questions based on the provided context. Context: ${safeContext}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
    }
  });

  if (!response.text) return [];
  return JSON.parse(response.text) as TestQuestion[];
};

// NEW: Generate Image for Visual Aids
export const generateStudyImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");
    
    // Using gemini-3-pro-image-preview for high quality images
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any, 
                imageSize: "1K"
            }
        }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated");
};

// NEW: Transcribe Audio
export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is missing");

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Audio, mimeType: mimeType } },
                { text: "Transcribe this audio exactly as spoken." }
            ]
        }
    });
    return response.text || "";
};

// NEW: Text to Speech (Gemini 2.5 Flash TTS)
export const generateSpeech = async (text: string): Promise<string | null> => {
    if (!apiKey) return null;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) {
        console.error("TTS generation failed", e);
        return null;
    }
};

// Helper for Live API Encoding
export const encodeAudio = (bytes: Uint8Array) => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper for Live API Decoding
export const decodeAudio = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
