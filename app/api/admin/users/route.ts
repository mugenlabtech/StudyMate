import {NextResponse} from 'next/server';
import {adminContext,adminFailure,AdminError,audit} from '../../../../lib/admin/server';

export const runtime='nodejs';
const noStore={'Cache-Control':'no-store'};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Only return fields required for account administration; never expose user metadata or auth secrets.
function publicUser(u:{id:string;email?:string;created_at:string;last_sign_in_at?:string;email_confirmed_at?:string;ban_duration?:string;banned_until?:string;user_metadata?:Record<string,unknown>}){
 const banned=Boolean(u.banned_until&&new Date(u.banned_until).getTime()>Date.now());
 const name=u.user_metadata?.full_name??u.user_metadata?.name;
 return {id:u.id,email:u.email??'',name:typeof name==='string'?name.slice(0,120):'',created_at:u.created_at,last_sign_in_at:u.last_sign_in_at??null,email_confirmed:Boolean(u.email_confirmed_at),status:banned?'suspended':'active'};
}
export async function GET(request:Request){
 try{
  const {admin}=await adminContext(request);
  const query=new URL(request.url).searchParams;
  const page=Math.max(1,Math.min(100000,Math.floor(Number(query.get('page'))||1)));
  const perPage=25;
  const {data,error}=await admin.auth.admin.listUsers({page,perPage});
  if(error)throw new AdminError(503,'Unable to load user accounts');
  return NextResponse.json({data:data.users.map(publicUser),page,limit:perPage,total:data.total??null,hasNext:data.nextPage!=null&&data.nextPage>page},{headers:noStore});
 }catch(e){return adminFailure(e);}
}
export async function PATCH(request:Request){
 try{
  const {admin,user}=await adminContext(request);
  const body:unknown=await request.json();
  if(!body||typeof body!=='object'||Array.isArray(body))throw new AdminError(400,'Invalid request');
  const {id,action}=body as Record<string,unknown>;
  if(typeof id!=='string'||!uuid.test(id)||!['suspend','reactivate'].includes(String(action)))throw new AdminError(400,'Invalid account action');
  if(id===user.id)throw new AdminError(403,'You cannot change your own account status');
  const {data:target,error:lookupError}=await admin.auth.admin.getUserById(id);
  if(lookupError||!target.user)throw new AdminError(404,'User not found');
  const allow=new Set((process.env.STUDYMATE_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()));
  if(target.user.email&&allow.has(target.user.email.toLowerCase()))throw new AdminError(403,'Administrator accounts cannot be changed here');
  const {data,error}=await admin.auth.admin.updateUserById(id,{ban_duration:action==='suspend'?'876000h':'none'});
  if(error||!data.user)throw new AdminError(503,'Unable to change account status');
  await audit(admin,user.id,String(action),'user:'+id,{target_email:target.user.email??null});
  return NextResponse.json({data:publicUser(data.user)},{headers:noStore});
 }catch(e){return adminFailure(e);}
}
