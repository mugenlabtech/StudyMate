import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {AIError} from './openrouter';
export async function loadCourseContext(db:SupabaseClient,userId:string,courseId:string,topicId?:string,sourceIds?:string[]){
 const {data:course,error:courseError}=await db.from('courses').select('id,code,title').eq('id',courseId).eq('owner_id',userId).single();
 if(courseError||!course)throw new AIError('COURSE_NOT_FOUND',404,'Course not found');
 let query=db.from('sources').select('id,kind,version,topic_id').eq('owner_id',userId).eq('course_id',courseId);
 if(topicId)query=query.eq('topic_id',topicId);
 if(sourceIds?.length)query=query.in('id',sourceIds);
 const {data:sources,error:sourceError}=await query.limit(15);if(sourceError)throw new AIError('SOURCE_RETRIEVAL_FAILED',503,'Could not load authorized sources');
 if(sourceIds?.length && sourceIds.some(id=>!sources?.some(s=>s.id===id)))throw new AIError('SOURCE_NOT_FOUND',404,'One or more sources are unavailable');
 const ids=(sources||[]).map(s=>s.id);if(!ids.length)return {course,chunks:[] as Array<{id:string;source_id:string;content:string;page_number:number|null;start_ms:number|null}>};
 const {data:chunks,error}=await db.from('source_chunks').select('id,source_id,content,page_number,start_ms').in('source_id',ids).order('ordinal').limit(36);
 if(error)throw new AIError('SOURCE_RETRIEVAL_FAILED',503,'Source retrieval failed');
 return {course,chunks:chunks||[]};
}
