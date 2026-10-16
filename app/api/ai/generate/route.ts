import {NextResponse} from 'next/server';
import {authenticatedDatabase} from '../../../../lib/ai/auth';
import {generateAcademicAI} from '../../../../lib/ai/service';
import {AI_FEATURES,type AIFeature} from '../../../../lib/ai/config';
import {normalizeError} from '../../../../lib/ai/openrouter';
export const runtime='nodejs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function validate(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid request');
 const v=value as Record<string,unknown>;
 if(typeof v.courseId!=='string'||!uuid.test(v.courseId)||typeof v.feature!=='string'||!AI_FEATURES.includes(v.feature as AIFeature)||typeof v.prompt!=='string'||!v.prompt.trim()||v.prompt.length>12000)throw new Error('Invalid AI request');
 for(const k of ['topicId','conversationId'])if(v[k]!==undefined&&(typeof v[k]!=='string'||!uuid.test(v[k] as string)))throw new Error('Invalid '+k);
 if(v.sourceIds!==undefined&&(!Array.isArray(v.sourceIds)||v.sourceIds.length>15||!v.sourceIds.every(x=>typeof x==='string'&&uuid.test(x))))throw new Error('Invalid sources');
 if(v.model!==undefined&&typeof v.model!=='string')throw new Error('Invalid model');
 return {courseId:v.courseId,feature:v.feature as AIFeature,prompt:v.prompt,topicId:v.topicId as string|undefined,conversationId:v.conversationId as string|undefined,sourceIds:v.sourceIds as string[]|undefined,model:v.model as string|undefined};
}
export async function POST(request:Request){try{const {db,user}=await authenticatedDatabase(request);const body=validate(await request.json());const result=await generateAcademicAI(db,{userId:user.id,...body,signal:request.signal});return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch(error){const e=normalizeError(error);return NextResponse.json({error:e.code,message:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});}}
