import {z} from 'zod';
const ref=z.object({source_id:z.string().uuid(),chunk_id:z.string().uuid().optional(),page_number:z.number().int().nullable().optional(),start_ms:z.number().int().nullable().optional()});
export const schemas = {
 flashcards:z.object({cards:z.array(z.object({question:z.string().min(3),answer:z.string().min(1),source_refs:z.array(ref)})).min(1).max(30)}),
 cbt:z.object({questions:z.array(z.object({stem:z.string(),options:z.array(z.string()).length(4),correct_index:z.number().int().min(0).max(3),explanation:z.string(),source_refs:z.array(ref)})).min(1).max(30)}),
 study_plan:z.object({sessions:z.array(z.object({topic:z.string(),minutes:z.number().int().min(5).max(240),reason:z.string()})).min(1).max(30)}),
 notes:z.object({title:z.string(),sections:z.array(z.object({heading:z.string(),body:z.string(),source_refs:z.array(ref),uncertainty:z.string().optional()})).min(1)}),
 diagram:z.object({title:z.string(),type:z.enum(['flowchart','concept_map','timeline']),nodes:z.array(z.object({id:z.string(),label:z.string()})),edges:z.array(z.object({from:z.string(),to:z.string()})),alt_text:z.string(),source_refs:z.array(ref)}),
 video_storyboard:z.object({title:z.string(),scenes:z.array(z.object({duration_seconds:z.number().min(1).max(180),narration:z.string(),visual_instructions:z.string(),captions:z.string(),source_refs:z.array(ref)})).min(1).max(20)}),
 glossary:z.object({terms:z.array(z.object({term:z.string(),definition:z.string(),source_refs:z.array(ref)})).min(1).max(40)}),
 audio_script:z.object({title:z.string(),segments:z.array(z.object({speaker:z.string(),text:z.string(),source_refs:z.array(ref)})).min(1)}),
 revision:z.object({weak_topics:z.array(z.object({topic:z.string(),reason:z.string(),recommended_action:z.string()}))}),
 summary:z.object({summary:z.string(),source_refs:z.array(ref)}),
 document_explanation:z.object({explanation:z.string(),source_refs:z.array(ref),limitations:z.array(z.string())}),
 answer_explanation:z.object({explanation:z.string(),source_refs:z.array(ref)}),
} as const;
export type StructuredFeature = keyof typeof schemas;
export function parseStructured(feature:StructuredFeature, raw:string) {
 let data:unknown; try {data=JSON.parse(raw);} catch {const match=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);if(!match)throw new Error('AI_INVALID_JSON');data=JSON.parse(match[1]);}
 return schemas[feature].parse(data);
}
