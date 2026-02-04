import { GoogleGenAI } from "@google/genai";
import { ProcessingConfig, GeminiModel, PoseMode, SubjectMode } from '../types';
import { SCENES, DEFAULT_PROMPT_TEMPLATE, POSE_INSTRUCTIONS, FAMILY_MODE_INSTRUCTION } from '../constants';
import { fetchImageAsBase64 } from './utils';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to strip data:image/xyz;base64, prefix
const stripBase64Header = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export const generateComposite = async (
  userImageBase64: string,
  config: ProcessingConfig
): Promise<string> => {
  try {
    const sceneUrl = SCENES[config.sceneId].url;
    // We need to fetch the background image to send it to Gemini
    // Using an external URL directly in `contents` works for some models/setups, 
    // but sending base64 is safer for "Image-to-Image" consistency here.
    const bgImageBase64 = await fetchImageAsBase64(sceneUrl);

    let prompt = DEFAULT_PROMPT_TEMPLATE
      .replace('{{SUBJECT_MODE}}', config.subjectMode)
      .replace('{{POSE_INSTRUCTION}}', POSE_INSTRUCTIONS[config.poseMode]);

    if (config.subjectMode === SubjectMode.FAMILY) {
      prompt += `\n ${FAMILY_MODE_INSTRUCTION}`;
    }

    // Construct parts
    const parts: any[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: stripBase64Header(userImageBase64)
        }
      },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: stripBase64Header(bgImageBase64)
        }
      }
    ];

    // Config options
    const modelConfig: any = {};

    if (config.model === GeminiModel.PRO) {
      // Add specific config for Pro model if available
      if (config.imageSize) {
         modelConfig.imageConfig = modelConfig.imageConfig || {};
         modelConfig.imageConfig.imageSize = config.imageSize;
      }
      if (config.aspectRatio) {
         modelConfig.imageConfig = modelConfig.imageConfig || {};
         modelConfig.imageConfig.aspectRatio = config.aspectRatio;
      }
    } else {
        // Flash model supports aspect ratio
        if (config.aspectRatio) {
             modelConfig.imageConfig = modelConfig.imageConfig || {};
             modelConfig.imageConfig.aspectRatio = config.aspectRatio;
        }
    }

    const response = await ai.models.generateContent({
      model: config.model,
      contents: { parts },
      config: modelConfig
    });

    // Extract image from response
    // Logic for Gemini Vision response extraction
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const editImageWithPrompt = async (
  imageBase64: string,
  promptText: string
): Promise<string> => {
    try {
        const parts = [
            { text: promptText },
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: stripBase64Header(imageBase64)
                }
            }
        ];

        // Use Flash for editing as per request "Nano Banana powered app"
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts }
        });

         if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No edited image returned.");
    } catch (error) {
        console.error("Edit Error:", error);
        throw error;
    }
}
