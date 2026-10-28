
import 'server-only';
import { aiConfig } from './config';

export class AIError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export function normalizeError(error: unknown): AIError {
  if (error instanceof AIError) return error;

  if (error instanceof Error && /abort|timeout/i.test(error.message)) {
    return new AIError(
      'AI_TIMEOUT',
      504,
      'The AI provider timed out. Please try again.',
    );
  }

  return new AIError(
    'AI_PROVIDER_ERROR',
    502,
    'The AI provider request failed. Please try again.',
  );
}

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type ResponsePayload = {
  error?: {
    message?: string;
    code?: string | number;
    metadata?: {
      error_type?: string;
    };
  };
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  model?: string;
  usage?: Usage;
  id?: string;
};

const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);

export async function complete(
  messages: Message[],
  opts: {
    model?: string;
    signal?: AbortSignal;
    maxTokens?: number;
  } = {},
) {
  const cfg = aiConfig();

  if (!cfg.apiKey) {
    throw new AIError(
      'AI_NOT_CONFIGURED',
      503,
      'OpenRouter API key is not configured.',
    );
  }

  const models = opts.model ? [opts.model] : cfg.models;

  // Only allow the primary model and fallbacks configured on the server.
  if (models.some((model) => !cfg.models.includes(model))) {
    throw new AIError(
      'AI_MODEL_NOT_ALLOWED',
      400,
      'The requested model is not configured for StudyMate.',
    );
  }

  let lastError = new AIError(
    'AI_PROVIDER_UNAVAILABLE',
    502,
    'No configured model returned a response.',
  );

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const controller = new AbortController();

    const timer = setTimeout(
      () => controller.abort(),
      Math.min(Math.max(cfg.timeout, 5000), 60000),
    );

    const abort = () => controller.abort();
    opts.signal?.addEventListener('abort', abort, { once: true });

    try {
      const response = await fetch(
        `${cfg.baseURL}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://studymate.cloud',
            'X-OpenRouter-Title': 'StudyMate',
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: opts.maxTokens ?? 1600,
            temperature: 0.2,
          }),
          signal: controller.signal,
          cache: 'no-store',
        },
      );

      const raw = await response.text();

      let data: ResponsePayload;
      try {
        data = JSON.parse(raw) as ResponsePayload;
      } catch {
        throw new AIError(
          'AI_INVALID_PROVIDER_RESPONSE',
          502,
          'OpenRouter returned an unreadable response.',
        );
      }

      if (!response.ok || data.error) {
        const status = response.status || 502;

        const code =
          status === 401
            ? 'AI_INVALID_KEY'
            : status === 402
              ? 'AI_PAYMENT_REQUIRED'
              : status === 403
                ? 'AI_ACCESS_DENIED'
                : status === 404
                  ? 'AI_MODEL_UNAVAILABLE'
                  : status === 429
                    ? 'AI_RATE_LIMIT'
                    : status === 408 || status === 504
                      ? 'AI_TIMEOUT'
                      : 'AI_PROVIDER_ERROR';

        // Do not expose raw upstream details to end users.
        throw new AIError(
          code,
          status,
          `OpenRouter request failed (HTTP ${status}).`,
        );
      }

      const result = data.choices?.[0]?.message?.content;

      if (typeof result !== 'string' || !result.trim()) {
        throw new AIError(
          'AI_EMPTY_RESPONSE',
          502,
          'The selected model returned no text.',
        );
      }

      return {
        text: result,
        model: data.model || model,
        usage: data.usage,
        requestId: data.id,
      };
    } catch (error) {
      lastError =
        controller.signal.aborted && !opts.signal?.aborted
          ? new AIError(
              'AI_TIMEOUT',
              504,
              'The AI provider timed out. Please try again.',
            )
          : normalizeError(error);

      if (opts.signal?.aborted) throw lastError;

      const shouldTryFallback =
        i < models.length - 1 &&
        retryableStatuses.has(lastError.status);

      if (!shouldTryFallback) throw lastError;
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', abort);
    }
  }

  throw lastError;
}
