
import 'server-only';

export const AI_FEATURES = [
  'tutor',
  'notes',
  'document_explanation',
  'summary',
  'glossary',
  'flashcards',
  'cbt',
  'answer_explanation',
  'revision',
  'study_plan',
  'diagram',
  'audio_script',
  'video_storyboard',
] as const;

export type AIFeature = (typeof AI_FEATURES)[number];

const DEFAULT_MODEL = 'deepseek/deepseek-v3.2';

function readPositiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function aiConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const baseURL = (
    process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  ).replace(/\/+$/, '');

  const primaryModel =
    process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  // Optional paid or free fallbacks. None are enabled by default.
  const fallbackModels = (
    process.env.OPENROUTER_FALLBACK_MODELS || ''
  )
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  const models = [...new Set([primaryModel, ...fallbackModels])];

  if (!/^https:\/\/[^/]+(?:\/.*)?$/.test(baseURL)) {
    throw new Error('OPENROUTER_BASE_URL must use HTTPS');
  }

  if (models.some((model) => !/^[\w.-]+\/[\w.-]+(?::[\w.-]+)?$/.test(model))) {
    throw new Error('An OpenRouter model ID is invalid');
  }

  return {
    apiKey,
    baseURL,
    models,
    timeout: readPositiveNumber(process.env.AI_TIMEOUT_MS, 45000),
    dailyLimit: readPositiveNumber(
      process.env.AI_DAILY_REQUEST_LIMIT,
      20,
    ),
  };
}
