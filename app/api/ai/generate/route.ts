import {NextResponse} from 'next/server';
import {z} from 'zod';
import {authenticatedDatabase} from '../../../../lib/ai/auth';
import {generateAcademicAI} from '../../../../lib/ai/service';
import {AI_FEATURES} from '../../../../lib/ai/config';
import {normalizeError} from '../../../../lib/ai/openrouter';
export const runtime='nodejs';
const requestSchema=z.object({courseId:z.string().uuid(),topicId:z.string().uuid().optional(),sourceIds:z.array(z.string().uuid()).max(15).optional(),feature:z.enum(AI_FEATURES),prompt:z.string().min(1).max(12000),model:z.string().optional(),conversationId:z.string().uuid().optional()});
export async function POST(request:Request){try{const {db,user}=await authenticatedDatabase(request);const body=requestSchema.parse(await request.json());const result=await generateAcademicAI(db,{userId:user.id,...body,signal:request.signal});return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch(error){const e=normalizeError(error);return NextResponse.json({error:e.code,message:e.message},{status:e.status,headers:{'Cache-Control':'no-store'}});}}
