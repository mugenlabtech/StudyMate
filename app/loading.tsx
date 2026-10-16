export default function Loading() {
  return <main id="main" className="main" aria-busy="true" aria-label="Loading StudyMate">
    <div className="skeleton" style={{width:'45%',height:20,marginBottom:18}} />
    <div className="skeleton" style={{width:'70%',height:44,marginBottom:28}} />
    <div className="panel stack"><div className="skeleton" style={{height:26,width:'40%'}} />
    <div className="skeleton" style={{height:52}} />
    <div className="studio-menu">{Array.from({length:5},(_,i)=><div key={i} className="skeleton" style={{height:150}} />)}</div></div>
  </main>;
}
