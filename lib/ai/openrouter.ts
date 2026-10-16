import 'server-only';
import {aiConfig} from './config';

export class AIError extends Error {
  constructor(public code:string, public status:number, message:string) {super(message);this.name='AIError';}
}
export function normalizeError(error:unknown):AIError {
  if(error instanceof AIError)return error;
  if(error instanceof Error && /abort|timeout/i.test(error.message))return new AIError('AI_TIMEOUT',504,'The AI provider did not respond in time. Please retry.');
  return new AIError('AI_PROVIDER_ERROR',502,error instanceof Error?error.message:'The AI provider request failed');
}
type Message={role:'system'|'user'|'assistant';content:string};
type Usage={prompt_tokens?:number;completion_tokens?:number};
type ResponsePayload={error?:{message?:string;code?:string|number};choices?:Array<{message?:{content?:string|null}}> ;model?:string;usage?:Usage;id?:string};
const retryable=new Set([408,429,500,502,503,504]);
export async function complete(messages:Message[],opts:{model?:string;signal?:AbortSignal;maxTokens?:number}={}) {
  const cfg=aiConfig();
  if(!cfg.apiKey)throw new AIError('AI_NOT_CONFIGURED',503,'OpenRouter API key is not configured');
  if(opts.model && !cfg.models.includes(opts.model))throw new AIError('AI_MODEL_NOT_ALLOWED',400,'This model is not on the configured free-model allowlist');
  const models=opts.model?[opts.model]:[...new Set(cfg.models)];
  let last:AIError=new AIError('AI_PROVIDER_UNAVAILABLE',502,'No free model returned a response');
  for(let i=0;i<models.length;i++){
    const model=models[i];
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),Math.min(Math.max(cfg.timeout,5000),25000));
    const abort=()=>controller.abort();opts.signal?.addEventListener('abort',abort,{once:true});
    try{
      const response=await fetch(cfg.baseURL.replace(/\/$/,'')+'/chat/completions',{
        method:'POST',headers:{Authorization:`Bearer ${cfg.apiKey}`,'Content-Type':'application/json','HTTP-Referer':'https://studymate.cloud','X-Title':'StudyMate'},
        body:JSON.stringify({model,messages,max_tokens:opts.maxTokens??1600,temperature:0.2}),
        signal:controller.signal,cache:'no-store'
      });
      const raw=await response.text();let data:ResponsePayload={};
      try{data=JSON.parse(raw) as ResponsePayload;}catch{throw new AIError('AI_INVALID_PROVIDER_RESPONSE',502,'OpenRouter returned an unreadable response');}
      if(!response.ok){
        const code=response.status===429?'AI_RATE_LIMIT':response.status===401?'AI_INVALID_KEY':response.status===402?'AI_PAYMENT_REQUIRED':'AI_PROVIDER_ERROR';
        throw new AIError(code,response.status,data.error?.message||`OpenRouter returned HTTP ${response.status}`);
      }
      const result=data.choices?.[0]?.message?.content;
      if(typeof result!=='string'||!result.trim())throw new AIError('AI_EMPTY_RESPONSE',502,'The selected free model returned no text');
      return {text:result,model:data.model||model,usage:data.usage,requestId:data.id};
    }catch(error){
      last=controller.signal.aborted&&!opts.signal?.aborted?new AIError('AI_TIMEOUT',504,'The free model timed out'):normalizeError(error);
      if(opts.signal?.aborted)throw last;
      if(i===models.length-1 || !retryable.has(last.status))throw last;
    }finally{clearTimeout(timer);opts.signal?.removeEventListener('abort',abort);}
  }
  throw last;
}
