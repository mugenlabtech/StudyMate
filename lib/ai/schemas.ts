export const schemas={
 flashcards:['cards'],cbt:['questions'],study_plan:['sessions'],notes:['title','sections'],diagram:['title','type','nodes','edges','alt_text','source_refs'],video_storyboard:['title','scenes'],glossary:['terms'],audio_script:['title','segments'],revision:['weak_topics'],summary:['summary','source_refs'],document_explanation:['explanation','source_refs','limitations'],answer_explanation:['explanation','source_refs']
} as const;
export type StructuredFeature=keyof typeof schemas;
export function parseStructured(feature:StructuredFeature,raw:string):Record<string,unknown>{
 const candidates=[raw.trim()];
 const fenced=raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
 if(fenced)candidates.push(fenced[1].trim());
 const first=raw.indexOf('{'),last=raw.lastIndexOf('}');
 if(first>=0&&last>first)candidates.push(raw.slice(first,last+1));
 let data:unknown;
 for(const candidate of candidates){try{data=JSON.parse(candidate);break;}catch{continue;}}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('AI_INVALID_JSON');
 const value=data as Record<string,unknown>;
 for(const field of schemas[feature])if(!(field in value)||value[field]===null)throw new Error('AI_MISSING_FIELD_'+field);
 return value;
}
