import {NextResponse} from 'next/server';
import {authenticatedDatabase} from '../../../../lib/ai/auth';
import {aiConfig} from '../../../../lib/ai/config';
import {complete,normalizeError} from '../../../../lib/ai/openrouter';
export const runtime='nodejs';
export async function POST(request:Request){try{await authenticatedDatabase(request);const config=aiConfig();const result=await complete([{role:'user',content:'Reply with exactly OK.'}],{maxTokens:16});return NextResponse.json({connected:true,model:result.model,replyReceived:!!result.text,configuredModels:config.models},{headers:{'Cache-Control':'no-store'}});}catch(error){const e=normalizeError(error);return NextResponse.json({connected:false,error:e.code},{status:e.status});}}
