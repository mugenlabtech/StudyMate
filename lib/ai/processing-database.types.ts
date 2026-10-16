/** Minimal typed schema for the processing route. Verify columns against the live DB. */
type SourceRow = {id:string; owner_id:string; course_id:string; kind:string; object_path:string|null; processing_state:string; created_at:string};
type ChunkRow = {source_id:string; ordinal:number; content:string};
type NoteRow = {id:string; owner_id:string; course_id:string; source_id:string|null; body:string};
export type ProcessingDatabase = {
  public: {
    Tables: {
      sources: {
        Row: SourceRow;
        Insert: Omit<SourceRow,'id'|'created_at'> & {id?:string;created_at?:string};
        Update: Partial<SourceRow>;
        Relationships: [];
      };
      source_chunks: {
        Row: ChunkRow;
        Insert: ChunkRow;
        Update: Partial<ChunkRow>;
        Relationships: [];
      };
      notes: {
        Row: NoteRow;
        Insert: Omit<NoteRow,'id'> & {id?:string};
        Update: Partial<NoteRow>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
