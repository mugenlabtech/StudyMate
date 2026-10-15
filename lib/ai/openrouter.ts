import 'server-only';
import OpenAI from 'openai';
import {aiConfig} from './config';
export class AIError extends Error {constructor(public code:string,public status:number,message:string){super(message);}}
export function normalizeError(e:unknown):AIError {
 if(e instanceof AIError)return e;
 if(e instanceof OpenAI.APIError){const code=e.status===401?'AI_INVALID_KEY':e.status===429?'AI_RATE_LIMIT':e.status===402?'AI_PAYMENT_REQUIRED':e.status===400?'AI_UNSUPPORTED_CAPABILITY':e.status && e.status>=500?'AI_PROVIDER_UNAVAILABLE':'AI_PROVIDER_ERROR';return new AIError(code,e.status||502,code);}
 if(e instanceof Error && /timeout|abort/i.test(e.message))return new AIError('AI_TIMEOUT',504,'AI_TIMEOUT');
 return new AIError('AI_PROVIDER_ERROR',502,'AI_PROVIDER_ERROR');
}
export async function complete(messages:OpenAI.Chat.ChatCompletionMessageParam[], opts:{model?:string;signal?:AbortSignal;maxTokens?:number}={}) {
 const cfg=aiConfig();if(!cfg.apiKey)throw new AIError('AI_NOT_CONFIGURED',503,'OpenRouter API key is not configured');
 const model=opts.model || cfg.models[0];if(!cfg.models.includes(model))throw new AIError('AI_MODEL_NOT_ALLOWED',400,'Model is not in the configured free-model allowlist');
 const client=new OpenAI({apiKey:cfg.apiKey,baseURL:cfg.baseURL,timeout:cfg.timeout,maxRetries:0});
 try {const response=await client.chat.completions.create({model,messages,max_tokens:opts.maxTokens||1600,temperature:0.2},{signal:opts.signal});const text=response.choices[0]?.message?.content;if(!text)throw new AIError('AI_EMPTY_RESPONSE',502,'Model returned no text');return {text,model:response.model||model,usage:response.usage,requestId:response.id};}
 catch(e){throw normalizeError(e);}
}
