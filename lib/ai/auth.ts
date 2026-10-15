import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {AIError} from './openrouter';
export async function authenticatedDatabase(request:Request){
 const header=request.headers.get('authorization');if(!header?.startsWith('Bearer '))throw new AIError('UNAUTHENTICATED',401,'Sign in required');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw new AIError('SUPABASE_NOT_CONFIGURED',503,'Supabase not configured');
 const token=header.slice(7);const db=createClient(url,key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error}=await db.auth.getUser(token);if(error||!user)throw new AIError('UNAUTHENTICATED',401,'Sign in required');return {db,user};
}
