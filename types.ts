export enum AppState {
  IDLE = 'IDLE',
  CAPTURE = 'CAPTURE',
  CONFIGURE = 'CONFIGURE',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash-image', // Optimized for speed
  PRO = 'gemini-3-pro-image-preview' // Optimized for quality/control
}

export enum SceneId {
  BOOK_COLLECTION = 'BOOK_COLLECTION',
  LEARNING_RESOURCES = 'LEARNING_RESOURCES'
}

export enum SubjectMode {
  SINGLE = 'Single Person',
  GROUP = 'Group Photo',
  FAMILY = 'Family Mode (Children/Strollers)'
}

export enum PoseMode {
  NATURAL = 'Natural',
  VSIGN = 'V-Sign',
  HEART = 'Heart Shape',
  CANDID = 'Candid Profile',
  FREE = 'Free Expression (Keep Original Pose)'
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K'
}

export enum AspectRatio {
  AR_1_1 = '1:1',
  AR_2_3 = '2:3',
  AR_3_2 = '3:2',
  AR_3_4 = '3:4',
  AR_4_3 = '4:3',
  AR_9_16 = '9:16',
  AR_16_9 = '16:9',
  AR_21_9 = '21:9'
}

export interface ProcessingConfig {
  model: GeminiModel;
  sceneId: SceneId;
  subjectMode: SubjectMode;
  poseMode: PoseMode;
  imgBbApiKey: string;
  imageSize?: ImageSize;
  aspectRatio?: AspectRatio;
}

export interface GeneratedResult {
  imageUrl: string; // The base64 or blob url of the processed image
  publicUrl?: string; // The imgbb url
}