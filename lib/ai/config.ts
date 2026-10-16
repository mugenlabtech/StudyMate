import 'server-only';
export const AI_FEATURES = ['tutor','notes','document_explanation','summary','glossary','flashcards','cbt','answer_explanation','revision','study_plan','diagram','audio_script','video_storyboard'] as const;
export type AIFeature = typeof AI_FEATURES[number];
export function aiConfig() {
  const models = [process.env.OPENROUTER_MODEL || 'openrouter/free', ...(process.env.OPENROUTER_FREE_FALLBACK_MODELS || '').split(',').map(x=>x.trim()).filter(Boolean)];
  if (models.some(x => x !== 'openrouter/free' && !x.endsWith(':free'))) throw new Error('Only explicitly configured free models are allowed');
  return {apiKey: process.env.OPENROUTER_API_KEY, baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1', models, timeout: Number(process.env.AI_TIMEOUT_MS || 18000), dailyLimit: Number(process.env.AI_DAILY_REQUEST_LIMIT || 20)};
}
