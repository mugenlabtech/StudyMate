import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export async function GET(request:Request){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return NextResponse.json({error:'Not configured'},{status:503});
 const token=request.headers.get('authorization');if(!token?.startsWith('Bearer '))return NextResponse.json({error:'Sign in required'},{status:401});
 const db=createClient(url,key,{global:{headers:{Authorization:token}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user}}=await db.auth.getUser(token.slice(7));if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
 const params=new URL(request.url).searchParams;
 const institution=params.get('institutionId'),term=(params.get('q')||'').trim();
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!institution||!uuid.test(institution)||term.length>40)return NextResponse.json({error:'Invalid query'},{status:400});
 const safe=term.replace(/[%,()]/g,'');
 let query=db.from('academic_courses').select('id,code,title,level,semester').eq('institution_id',institution).eq('status','approved').order('code').limit(15);
 if(safe)query=query.or(`code.ilike.${safe}%,title.ilike.%${safe}%`);
 const {data,error}=await query;
 if(error)return NextResponse.json({error:'Catalogue unavailable'},{status:503});
 return NextResponse.json({courses:data},{headers:{'Cache-Control':'private, max-age=30'}});
}
