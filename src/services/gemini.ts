import { GoogleGenAI, Type } from "@google/genai";
import { ProductionPackage, StoryboardFrame } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Utility to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseModelResponse = (text: string) => {
  try {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(cleanJson.trim());
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    throw new Error("The AI returned an invalid format. This usually happens when the concept is too complex. Try a simpler prompt.");
  }
};

/**
 * Helper to execute an image generation with localized retry logic for 429/Resource Exhausted
 */
const generateImageWithRetry = async (prompt: string, retries = 1): Promise<string | null> => {
  try {
    const ai = getAI();
    const imgRes = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        imageConfig: { 
          aspectRatio: "16:9"
        } 
      }
    });

    const imagePart = imgRes.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return `data:image/png;base64,${imagePart.inlineData.data}`;
    }
    return null;
  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isRateLimit = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || error?.message?.includes('quota');

    if (isRateLimit && retries > 0) {
      const waitTime = 5000 + Math.random() * 5000;
      console.warn(`Quota hit for image. Retrying in ${Math.round(waitTime/1000)}s...`);
      await sleep(waitTime);
      return generateImageWithRetry(prompt, retries - 1);
    }

    console.error("Image generation skipped due to quota or error:", error?.message || error);
    return null;
  }
};

export const generateFullProductionPackage = async (concept: string): Promise<ProductionPackage> => {
  const ai = getAI();

  // 1. Generate Core Text Content
  let response;
  try {
    response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a world-class film producer. Create a comprehensive pre-production bible for: "${concept}".

      Return a single JSON object with:
      1. "screenplay": Industry-standard short screenplay (Markdown).
      2. "characters": 3-5 deep profiles.
      3. "breakdown": Scene-by-scene assets.
      4. "budget": Realistic cost estimates + 15% contingency.
      5. "pitchDeck": Business slides.
      6. "crewNeeds": Department heads.
      7. "locations": Scouting requirements for 3 sets.
      8. "schedule": 5-day plan.
      9. "soundDesign": Auditory plan.
      10. "storyboardPrompts": Exactly 3 detailed objects with "sceneDescription" and "prompt".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            screenplay: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  description: { type: Type.STRING },
                  motivation: { type: Type.STRING },
                  arc: { type: Type.STRING },
                  psychologicalDepth: { type: Type.STRING }
                }
              }
            },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scene: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                  timeOfDay: { type: Type.STRING },
                  characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                  props: { type: Type.ARRAY, items: { type: Type.STRING } },
                  costumes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                  vfx: { type: Type.ARRAY, items: { type: Type.STRING } },
                  vehicles: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            budget: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  label: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            },
            pitchDeck: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            },
            crewNeeds: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            locations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  requirements: { type: Type.STRING },
                  aesthetic: { type: Type.STRING }
                }
              }
            },
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  scenes: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                  estimatedHours: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                }
              }
            },
            soundDesign: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  sceneNumber: { type: Type.INTEGER }, 
                  environment: { type: Type.STRING }, 
                  emotionalGoal: { type: Type.STRING }, 
                  cues: { type: Type.ARRAY, items: { type: Type.STRING } } 
                } 
              } 
            },
            storyboardPrompts: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  sceneDescription: { type: Type.STRING }, 
                  prompt: { type: Type.STRING } 
                } 
              } 
            }
          }
        }
      }
    });
  } catch (error: any) {
    if (JSON.stringify(error).includes('429')) {
      throw new Error("The studio is currently out of credits (API Quota reached). Please wait a minute before brewing another project.");
    }
    throw error;
  }

  const data = parseModelResponse(response.text || "{}");

  // 2. Parallel Visual Frame Generation
  const storyboardPrompts = data.storyboardPrompts || [];

  const framePromises = storyboardPrompts.map(async (item: any, index: number) => {
    await sleep(index * 1500);
    const visualPrompt = item.prompt || `Cinematic film still of: ${item.sceneDescription}. 35mm photography, movie lighting.`;
    const imageUrl = await generateImageWithRetry(visualPrompt, 1);

    return {
      sceneDescription: item.sceneDescription,
      imageUrl: imageUrl || ''
    } as StoryboardFrame;
  });

  const storyboard = await Promise.all(framePromises);

  return {
    ...data,
    concept,
    storyboard,
    isLocked: false
  };
};
