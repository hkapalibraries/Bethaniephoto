import { SceneId, PoseMode, SubjectMode } from './types';

export const SCENES = {
  [SceneId.BOOK_COLLECTION]: {
    name: "Book Collection Area",
    url: "https://raw.githubusercontent.com/hkapalibraries/bethaniepuzzle/main/Book%20Collection%20Area.jpg", // Fixed spaces
    description: "Classic deep-aisle library setting."
  },
  [SceneId.LEARNING_RESOURCES]: {
    name: "Learning Resources",
    url: "https://raw.githubusercontent.com/hkapalibraries/bethaniepuzzle/main/Learning%20Resources%20Area%20.jpg", // Fixed spaces
    description: "Modern, open-space study environment."
  }
};

export const DEFAULT_PROMPT_TEMPLATE = `
You are a professional cinematic compositor for the HKAPA Film & TV Library.
Your task is to create a hyper-realistic photo composite.

Inputs:
1. An image of a user (or group).
2. A background image of a historical architectural setting.

Primary Goal:
Seamlessly integrate the subject into the environment with perfect perspective and scale.

Instructions:
1. **Perspective & Scale Analysis (CRITICAL):** 
   - Analyze the vanishing point and floor plane of the background image.
   - Scale the subject so their height is realistic relative to the surrounding architecture (e.g., bookshelves, doorways, tables). 
   - Ensure the subject appears to be standing *inside* the 3D space of the room, not floating on top.
   - Align the subject's feet firmly with the perspective of the floor carpet/tiles.

2. **Lighting Match:** 
   - Completely re-grade the subject's lighting to match the background.
   - If the background is warm/golden, the subject must be warm/golden.
   - Add rim lighting to the subject's edges corresponding to the light sources in the background.

3. **Shadow Integration:** 
   - Generate realistic cast shadows on the floor extending from the subject's feet, matching the direction of shadows in the scene.
   - Add ambient occlusion (contact shadows) where feet touch the ground.

4. **blending:** 
   - Match the depth of field. If the background is slightly soft, soften the subject edges slightly to match.

Specific Constraints:
- Mode: {{SUBJECT_MODE}}
- Pose: {{POSE_INSTRUCTION}}
`;

export const POSE_INSTRUCTIONS: Record<PoseMode, string> = {
  [PoseMode.NATURAL]: "Adjust the subject to stand naturally, looking confident.",
  [PoseMode.VSIGN]: "Have the subject make a V-sign gesture if possible, or look cheerful.",
  [PoseMode.HEART]: "Have the subject make a Heart gesture or look loving.",
  [PoseMode.CANDID]: "Make the subject look like they are candidly reading or looking away.",
  [PoseMode.FREE]: "STRICTLY KEEP the user's exact original pose and expression. Do not alter their body language."
};

export const FAMILY_MODE_INSTRUCTION = "Ensure children and strollers are preserved and naturally integrated into the floor space.";