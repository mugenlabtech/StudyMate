import {NextResponse} from 'next/server';
import {adminContext,adminFailure,AdminError,audit} from '../../../../lib/admin/server';
import {randomUUID,createHash} from 'node:crypto';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 try{
  const {admin,user}=await adminContext(request);
  const form=await request.formData();const file=form.get('file');const courseId=form.get('courseId');const institutionId=form.get('institutionId');
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!(file instanceof File)||typeof courseId!=='string'||!uuid.test(courseId)||typeof institutionId!=='string'||!uuid.test(institutionId))throw new AdminError(400,'Choose a file, institution and course');
  if(file.size>5*1024*1024||file.size===0)throw new AdminError(413,'File must be between 1 byte and 5 MB');
  const extension=file.name.split('.').pop()?.toLowerCase();if(!extension||!['pdf','txt','docx'].includes(extension))throw new AdminError(415,'Only PDF, TXT and DOCX files are supported');
  const {data:course}=await admin.from('academic_courses').select('id').eq('id',courseId).eq('institution_id',institutionId).maybeSingle();
  if(!course)throw new AdminError(400,'Course does not belong to this institution');
  const bytes=Buffer.from(await file.arrayBuffer());
  if(extension==='pdf'&&bytes.subarray(0,5).toString()!=='%PDF-')throw new AdminError(415,'Invalid PDF');
  if(extension==='docx'&&bytes.subarray(0,2).toString()!=='PK')throw new AdminError(415,'Invalid DOCX');
  const sha256=createHash('sha256').update(bytes).digest('hex');
  const {data:existing}=await admin.from('academic_papers').select('id').eq('file_hash',sha256).eq('course_id',courseId).maybeSingle();
  if(existing)return NextResponse.json({id:existing.id,duplicate:true});
  const path=`${institutionId}/${courseId}/${randomUUID()}.${extension}`;
  const {error:uploadError}=await admin.storage.from('academic-papers').upload(path,bytes,{contentType:extension==='pdf'?'application/pdf':extension==='txt'?'text/plain':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',upsert:false});
  if(uploadError)throw new AdminError(503,'Storage upload failed: '+uploadError.message);
  const year=Number(form.get('year'));const session=String(form.get('session')||'').slice(0,40);
  const {data,error}=await admin.from('academic_papers').insert({institution_id:institutionId,course_id:courseId,year:Number.isInteger(year)&&year>=1990&&year<=2100?year:null,session:session||null,storage_path:path,file_hash:sha256,original_name:file.name.slice(0,200),status:'pending',uploaded_by:user.id}).select('id').single();
  if(error){await admin.storage.from('academic-papers').remove([path]);throw new AdminError(503,'Metadata save failed: '+error.message);}
  await audit(admin,user.id,'upload','papers:'+data.id,{file_hash:sha256});
  return NextResponse.json({id:data.id,status:'pending',message:'File uploaded. Extraction and academic review are separate steps.'},{status:201});
 }catch(error){return adminFailure(error);}
}
