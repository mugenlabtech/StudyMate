import {NextResponse} from 'next/server';
import {adminContext,adminFailure,AdminError,audit} from '../../../../lib/admin/server';
export const runtime='nodejs';
const resources={institutions:'academic_institutions',faculties:'academic_faculties',departments:'academic_departments',courses:'academic_courses',questions:'academic_questions',papers:'academic_papers',expenses:'admin_expenses',payments:'admin_payments',audit:'admin_audit_logs'} as const;
type Resource=keyof typeof resources;
const writable=new Set<Resource>(['institutions','faculties','departments','courses','questions','papers','expenses']);
const editable:Record<string,string[]>={
 institutions:['name','short_name','type','state','status'],faculties:['institution_id','name'],departments:['faculty_id','name'],
 courses:['institution_id','department_id','code','title','level','semester','status'],
 papers:['institution_id','course_id','year','session','semester','exam_type','storage_path','status'],
 questions:['paper_id','course_id','body','answer','options','topic','difficulty','question_type','year','status'],
 expenses:['amount','currency','category','description','spent_at']
};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function tableOf(resource:string){if(!(resource in resources))throw new AdminError(404,'Unknown module');return resources[resource as Resource];}
export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}){
 try{
  const {admin}=await adminContext(request);const {resource}=await params;const table=tableOf(resource);
  const query=new URL(request.url).searchParams;
  const limit=Math.min(Math.max(Number(query.get('limit'))||50,1),100);
  const page=Math.max(Number(query.get('page'))||1,1);
  let req=admin.from(table).select('*',{count:'exact'}).range((page-1)*limit,page*limit-1);
  if(resource==='courses'&&query.get('institution_id')&&uuid.test(query.get('institution_id')!))req=req.eq('institution_id',query.get('institution_id')!);
  if(resource==='questions'&&query.get('course_id')&&uuid.test(query.get('course_id')!))req=req.eq('course_id',query.get('course_id')!);
  if(resource==='papers'&&query.get('course_id')&&uuid.test(query.get('course_id')!))req=req.eq('course_id',query.get('course_id')!);
  const {data,error,count}=await req;
  if(error)throw new AdminError(503,'Database read failed: '+error.message);
  return NextResponse.json({data,count,page,limit},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return adminFailure(error);}
}
export async function POST(request:Request,{params}:{params:Promise<{resource:string}>}){
 try{
  const {admin,user}=await adminContext(request);const {resource}=await params;const table=tableOf(resource);
  if(!writable.has(resource as Resource))throw new AdminError(405,'Read-only module');
  const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body))throw new AdminError(400,'Invalid record');
  const allowed=editable[resource];const record=Object.fromEntries(Object.entries(body).filter(([k])=>allowed.includes(k)));
  if(!Object.keys(record).length)throw new AdminError(400,'No valid fields');
  if(resource==='expenses'&&(!(typeof record.amount==='number')||record.amount<=0))throw new AdminError(400,'Amount must be positive');
  const {data,error}=await admin.from(table).insert(record).select('*').single();
  if(error)throw new AdminError(400,error.message);
  await audit(admin,user.id,'create',resource+':'+data.id,{fields:Object.keys(record)});
  return NextResponse.json({data},{status:201});
 }catch(error){return adminFailure(error);}
}
export async function PATCH(request:Request,{params}:{params:Promise<{resource:string}>}){
 try{
  const {admin,user}=await adminContext(request);const {resource}=await params;const table=tableOf(resource);
  if(!writable.has(resource as Resource))throw new AdminError(405,'Read-only module');
  const body=await request.json();if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.id!=='string'||!uuid.test(body.id))throw new AdminError(400,'Invalid record');
  const record=Object.fromEntries(Object.entries(body).filter(([k])=>editable[resource].includes(k)));
  if(!Object.keys(record).length)throw new AdminError(400,'No valid fields');
  const {data,error}=await admin.from(table).update(record).eq('id',body.id).select('*').single();
  if(error)throw new AdminError(400,error.message);
  await audit(admin,user.id,'update',resource+':'+body.id,{fields:Object.keys(record)});
  return NextResponse.json({data});
 }catch(error){return adminFailure(error);}
}
