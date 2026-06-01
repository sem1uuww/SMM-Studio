/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GenerationSettings {
  platform: 'Telegram' | 'VK' | 'Universal';
  contentType: string;
  toneOfVoice: string;
  creativity: number; // 0 - 100
  length: 'Very short' | 'Short' | 'Medium' | 'Long' | 'Very long';
  structure: {
    header: boolean;
    subtitle: boolean;
    paragraphs: boolean;
    lists: boolean;
    cta: boolean;
    conclusion: boolean;
  };
  emojiLevel: 'None' | 'Minimum' | 'Moderate' | 'Many';
  ctaGoal: string;
  customCta: string;
  brandStyle: string;
  
  // Additional toggles
  addHashtags: boolean;
  useStorytelling: boolean;
  addSocialProof: boolean;
  addDeadline: boolean;
  boostEngagement: boolean;
  boostSales: boolean;
  boostExpertise: boolean;
  useQuestions: boolean;
  addCommentCall: boolean;
}

export interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 data url for images/docs, or plain text
}

export interface GenerationProfile {
  id: string;
  name: string;
  settings: GenerationSettings;
  isCustom?: boolean;
}

export interface GenerationResults {
  analysis: {
    goal: string;
    audience: string;
    structure: string;
  };
  mainVariant: string;
  alternatives: Array<{
    title: string;
    text: string;
  }>;
}

export interface GenerationProject {
  id: string;
  title: string;
  inputText: string;
  extraContext: string;
  attachments: AttachmentFile[];
  settings: GenerationSettings;
  timestamp: string;
  isFavorite: boolean;
  results: GenerationResults | null;
  companyInfo?: string;
  createdAt?: string;
}
