// Run with env vars loaded: node --env-file=.env.local scripts/openrouter-smoke.mjs
const key=process.env.OPENROUTER_API_KEY;
if(!key){console.error('NOT RUN: OPENROUTER_API_KEY missing');process.exit(2)}
const model=process.env.OPENROUTER_MODEL||'openrouter/free';if(model!=='openrouter/free'&&!model.endsWith(':free'))throw new Error('Paid model blocked');
const response=await fetch((process.env.OPENROUTER_BASE_URL||'https://openrouter.ai/api/v1')+'/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:'Reply with OK'}],max_tokens:16}),signal:AbortSignal.timeout(30000)});
const body=await response.json();console.log(JSON.stringify({http_status:response.status,model:body.model||model,has_reply:!!body.choices?.[0]?.message?.content,error_code:body.error?.code||null}));if(!response.ok)process.exit(1);
