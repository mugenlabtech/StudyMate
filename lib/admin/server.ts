import 'server-only';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {NextResponse} from 'next/server';

export class AdminError extends Error { constructor(public status:number, message:string){super(message);} }
export async function adminContext(request:Request){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allow=(process.env.STUDYMATE_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(!url||!anon||!service||!allow.length)throw new AdminError(503,'Admin service is not configured');
  const auth=request.headers.get('authorization');
  if(!auth?.startsWith('Bearer '))throw new AdminError(401,'Sign in required');
  const token=auth.slice(7);
  const publicClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error}=await publicClient.auth.getUser(token);
  if(error||!user)throw new AdminError(401,'Session expired');
  if(!user.email||!allow.includes(user.email.toLowerCase())||!user.email_confirmed_at)throw new AdminError(403,'Admin access denied');
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  return {admin,user};
}
export function adminFailure(error:unknown){
  const status=error instanceof AdminError?error.status:500;
  console.error('Admin operation failed:',error instanceof Error?error.message:'Unknown error');
  return NextResponse.json({error:status===500?'Unable to complete request':(error as Error).message},{status,headers:{'Cache-Control':'no-store'}});
}
export async function audit(admin:SupabaseClient<any,'public'>,userId:string,action:string,target:string,details:Record<string,unknown>={}){
  const {error}=await admin.from('admin_audit_logs').insert({actor_id:userId,action,target,details});
  if(error)console.error('Admin audit logging failed:',error.message);
}
