import {NextResponse} from 'next/server';
import {adminContext,adminFailure} from '../../../lib/admin/server';
export const runtime='nodejs';
export async function GET(request:Request){
 try{
  const {admin,user}=await adminContext(request);
  const tables=['academic_institutions','academic_courses','academic_papers','academic_questions','admin_expenses','admin_payments'];
  const results=await Promise.all(tables.map(t=>admin.from(t).select('*',{count:'exact',head:true})));
  const counts=Object.fromEntries(tables.map((t,i)=>[t,results[i].error?null:results[i].count]));
  const {data:payments}=await admin.from('admin_payments').select('amount,currency,status').eq('status','paid').limit(1000);
  const {data:expenses}=await admin.from('admin_expenses').select('amount,currency').limit(1000);
  const totals=(items:{amount:number;currency:string}[]|null|undefined)=>items?.reduce<Record<string,number>>((a,v)=>{a[v.currency]=(a[v.currency]||0)+Number(v.amount);return a;},{})||{};
  return NextResponse.json({user:{email:user.email},counts,revenue:totals(payments),expenses:totals(expenses),financeNote:'Totals cover at most 1,000 records per category; use verified payment records for accounting.'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return adminFailure(error);}
}
