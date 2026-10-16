import 'server-only';
import {aiConfig} from './config';
export class AIError extends Error {constructor(public code:string,public status:number,message:string){super(message);}}
export function normalizeError(e:unknown):AIError {
 if(e instanceof AIError)return e;
 if(e instanceof Error && /abort|timeout/i.test(e.message))return new AIError('AI_TIMEOUT',504,'AI request timed out');
 return new AIError('AI_PROVIDER_ERROR',502,e instanceof Error?e.message:'AI request failed');
}
type Message={role:'system'|'user'|'assistant';content:string};
type Usage={prompt_tokens?:number;completion_tokens?:number};
export async function complete(messages:Message[],opts:{model?:string;signal?:AbortSignal;maxTokens?:number}={}) {
 const cfg=aiConfig();if(!cfg.apiKey)throw new AIError('AI_NOT_CONFIGURED',503,'OpenRouter API key is not configured');
 const model=opts.model||cfg.models[0];if(!cfg.models.includes(model))throw new AIError('AI_MODEL_NOT_ALLOWED',400,'Model is not in the configured free-model allowlist');
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),cfg.timeout);
 const onAbort=()=>controller.abort();opts.signal?.addEventListener('abort',onAbort,{once:true});
 try {
  const response=await fetch(cfg.baseURL.replace(/\/$/,'')+'/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${cfg.apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://studymate.cloud','X-Title':'StudyMate'},body:JSON.stringify({model,messages,max_tokens:opts.maxTokens||1600,temperature:0.2}),signal:controller.signal,cache:'no-store'});
  const payload:unknown=await response.json();const data=payload as {error?:{message?:string;code?:string|number};choices?:Array<{message?:{content?:string|null}}> ;model?:string;usage?:Usage;id?:string};
  if(!response.ok)throw new AIError(response.status===429?'AI_RATE_LIMIT':response.status===401?'AI_INVALID_KEY':response.status===402?'AI_PAYMENT_REQUIRED':'AI_PROVIDER_ERROR',response.status,data.error?.message||'OpenRouter request failed');
  const result=data.choices?.[0]?.message?.content;if(!result)throw new AIError('AI_EMPTY_RESPONSE',502,'OpenRouter returned no text');
  return {text:result,model:data.model||model,usage:data.usage,requestId:data.id};
 }catch(e){throw normalizeError(e);}finally{clearTimeout(timeout);opts.signal?.removeEventListener('abort',onAbort);}
}
