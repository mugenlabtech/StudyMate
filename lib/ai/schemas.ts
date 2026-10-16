export const schemas={
 flashcards:['cards'],cbt:['questions'],study_plan:['sessions'],notes:['title','sections'],diagram:['title','type','nodes','edges','alt_text','source_refs'],video_storyboard:['title','scenes'],glossary:['terms'],audio_script:['title','segments'],revision:['weak_topics'],summary:['summary','source_refs'],document_explanation:['explanation','source_refs','limitations'],answer_explanation:['explanation','source_refs']
} as const;
export type StructuredFeature=keyof typeof schemas;
export function parseStructured(feature:StructuredFeature,raw:string):Record<string,unknown>{
 let data:unknown;try{data=JSON.parse(raw);}catch{const match=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);if(!match)throw new Error('AI_INVALID_JSON');data=JSON.parse(match[1]);}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('AI_INVALID_JSON');
 const value=data as Record<string,unknown>;
 for(const field of schemas[feature])if(!(field in value)||value[field]===null)throw new Error('AI_MISSING_FIELD_'+field);
 return value;
}
