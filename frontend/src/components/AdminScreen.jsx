// src/components/AdminScreen.jsx
import { useState, useEffect } from "react";
import { styles, colors } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

const AMBITI = ['Cardiologia','Pneumologia','Gastroenterologia','Endocrinologia','Neurologia','Ortopedia','Dermatologia','Urologia','Ginecologia','Oncologia','Nefrologia','Reumatologia','Medicina Interna'];

const ArrowLeftIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const SyncIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
const ShieldIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
const CheckIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const XIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const UploadIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const FileIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
const FolderIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>;

export default function AdminScreen({ navigateBack }) {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [username, setUsername] = useState(localStorage.getItem('admin_user'));
  const [userRole, setUserRole] = useState(localStorage.getItem('admin_role'));
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState("richieste");
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [changelog, setChangelog] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [userForm, setUserForm] = useState({ username:"", password:"", role:"contributor" });
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAmbito, setUploadAmbito] = useState("Cardiologia");
  const [uploading, setUploading] = useState(false);

  const [changelogMdFile, setChangelogMdFile] = useState(null);
  const [uploadingChangelog, setUploadingChangelog] = useState(false);

  const [patologieList, setPatologieList] = useState([]);
  const [procedureList, setProcedureList] = useState([]);

  const headers = () => ({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` });

  const doLogin = async () => { setLoginError(""); setLoginLoading(true); try { const r = await fetch(`${API_BASE_URL}/admin/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:loginUser,password:loginPass})}); if(!r.ok){setLoginError("Credenziali non valide");setLoginLoading(false);return;} const d=await r.json(); setToken(d.token);setUsername(d.username);setUserRole(d.role);localStorage.setItem('admin_token',d.token);localStorage.setItem('admin_user',d.username);localStorage.setItem('admin_role',d.role);} catch{setLoginError("Errore di connessione");} setLoginLoading(false); };
  const doLogout = async () => { try{await fetch(`${API_BASE_URL}/admin/logout`,{method:"POST",headers:headers()});}catch{} setToken(null);setUsername(null);setUserRole(null);localStorage.removeItem('admin_token');localStorage.removeItem('admin_user');localStorage.removeItem('admin_role'); };

  const fetchSugg = async () => { try{const r=await fetch(`${API_BASE_URL}/admin/suggerimenti`,{headers:headers()});const d=await r.json();setSuggerimenti(d.suggerimenti||[]);}catch{} };
  const fetchCh = async () => { try{const r=await fetch(`${API_BASE_URL}/admin/changelog?limit=100`,{headers:headers()});const d=await r.json();setChangelog(d.entries||[]);}catch{} };
  const fetchU = async () => { try{const r=await fetch(`${API_BASE_URL}/admin/users`,{headers:headers()});const d=await r.json();setUsers(d.users||[]);}catch{} };
  const fetchPatologieList = async () => { try{const r=await fetch(`${API_BASE_URL}/admin/patologie-list`,{headers:headers()});const d=await r.json();setPatologieList(d.patologie||[]);}catch{} };
  const fetchProcedureList = async () => { try{const r=await fetch(`${API_BASE_URL}/admin/procedure-list`,{headers:headers()});const d=await r.json();setProcedureList(d.procedure||[]);}catch{} };

  useEffect(() => { if(token){fetchSugg();fetchCh();fetchPatologieList();fetchProcedureList();if(userRole==='admin')fetchU();} },[token,userRole]);

  const approveSugg = async (id, stato) => { setLoading(true);try{const r=await fetch(`${API_BASE_URL}/admin/suggerimenti/${id}`,{method:"PUT",headers:headers(),body:JSON.stringify({stato})});if(r.ok){setMsg(`Richiesta ${stato==='approved'?'approvata':stato==='rejected'?'respinta':'aggiornata'}`);fetchSugg();fetchCh();}}catch{setMsg("Errore");}setLoading(false); };

  const deleteSugg = async (id) => { if(!confirm('Eliminare questa richiesta?'))return;setLoading(true);try{const r=await fetch(`${API_BASE_URL}/admin/suggerimenti/${id}`,{method:"DELETE",headers:headers()});if(r.ok){setMsg("Richiesta eliminata");fetchSugg();fetchCh();}}catch{setMsg("Errore");}setLoading(false); };

  const doSync = async () => { setLoading(true);setMsg("Sincronizzazione...");try{const r=await fetch(`${API_BASE_URL}/admin/sync`,{method:"POST",headers:headers()});const d=await r.json();setMsg(`Sync: ${d.rows} righe`);fetchCh();}catch{setMsg("Errore sync");}setLoading(false); };

  const uploadMd = async (tipo) => {
    if(!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("tipo", tipo);
      fd.append("ambito", uploadAmbito);
      const r = await fetch(`${API_BASE_URL}/admin/upload-md`, { method:"POST", headers:{"Authorization":`Bearer ${token}`}, body:fd });
      if(r.ok) { const d = await r.json(); setMsg(`${tipo==='patologie'?'Patologia':'Procedura'} ${d.file} caricata in ${d.ambito}`); setUploadFile(null); fetchCh(); if(tipo==='patologie') fetchPatologieList(); else fetchProcedureList(); }
      else { const e = await r.json(); setMsg(`Errore: ${e.detail}`); }
    } catch { setMsg("Errore upload"); }
    setUploading(false);
  };

  const uploadChangelogMd = async () => {
    if(!changelogMdFile) return;
    setUploadingChangelog(true);
    try {
      const fd = new FormData();
      fd.append("file", changelogMdFile);
      const r = await fetch(`${API_BASE_URL}/admin/upload-changelog-md`, { method:"POST", headers:{"Authorization":`Bearer ${token}`}, body:fd });
      if(r.ok) { setMsg("Changelog aggiornato"); setChangelogMdFile(null); fetchCh(); }
      else { const e = await r.json(); setMsg(`Errore: ${e.detail}`); }
    } catch { setMsg("Errore upload changelog"); }
    setUploadingChangelog(false);
  };

  const deletePatologiaMd = async (ambito, filename) => {
    if(!confirm(`Cancellare ${filename}?`)) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/admin/patologie-md/${encodeURIComponent(ambito)}/${encodeURIComponent(filename)}`, { method:"DELETE", headers:headers() });
      if(r.ok) { setMsg(`${filename} cancellato`); fetchPatologieList(); fetchCh(); }
      else { const e = await r.json(); setMsg(`Errore: ${e.detail}`); }
    } catch { setMsg("Errore cancellazione"); }
    setLoading(false);
  };

  const deleteProcedureMd = async (ambito, filename) => {
    if(!confirm(`Cancellare ${filename}?`)) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/admin/procedure-md/${encodeURIComponent(ambito)}/${encodeURIComponent(filename)}`, { method:"DELETE", headers:headers() });
      if(r.ok) { setMsg(`${filename} cancellato`); fetchProcedureList(); fetchCh(); }
      else { const e = await r.json(); setMsg(`Errore: ${e.detail}`); }
    } catch { setMsg("Errore cancellazione"); }
    setLoading(false);
  };

  const createUser = async () => { if(!userForm.username||!userForm.password){setMsg("Username e password obbligatori");return;} setLoading(true);try{const r=await fetch(`${API_BASE_URL}/admin/users`,{method:"POST",headers:headers(),body:JSON.stringify(userForm)});if(r.ok){setMsg(`Utente '${userForm.username}' creato`);setShowCreateUser(false);setUserForm({username:"",password:"",role:"contributor"});fetchU();fetchCh();}else{const e=await r.json();setMsg(`Errore: ${e.detail}`);}}catch{setMsg("Errore");}setLoading(false); };
  const updateUser = async (tu) => { setLoading(true);try{const p={};if(userForm.password)p.password=userForm.password;if(userForm.role)p.role=userForm.role;const r=await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(tu)}`,{method:"PUT",headers:headers(),body:JSON.stringify(p)});if(r.ok){setMsg(`Utente aggiornato`);setEditingUser(null);fetchU();fetchCh();}}catch{setMsg("Errore");}setLoading(false); };
  const deleteUser = async (tu) => { if(!confirm(`Cancellare '${tu}'?`))return;setLoading(true);try{const r=await fetch(`${API_BASE_URL}/admin/users/${encodeURIComponent(tu)}`,{method:"DELETE",headers:headers()});if(r.ok){setMsg(`Utente cancellato`);fetchU();fetchCh();}}catch{setMsg("Errore");}setLoading(false); };

  if (!token) return (
    <div style={S.loginPage}>
      <div style={S.loginCard}>
        <div style={S.loginIcon}><ShieldIcon /></div>
        <h1 style={{fontSize:22,fontWeight:700,margin:'0 0 4px 0'}}>ClinGraph</h1>
        <p style={{fontSize:13,color:colors.textMuted,margin:'0 0 28px 0'}}>Pannello di Amministrazione</p>
        <div style={{textAlign:'left',marginBottom:16}}>
          <label style={S.label}>Username</label>
          <input style={S.input} placeholder="Username" value={loginUser} onChange={e=>setLoginUser(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} autoFocus />
        </div>
        <div style={{textAlign:'left',marginBottom:16}}>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="Password" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} />
        </div>
        {loginError && <div style={{padding:'8px 12px',borderRadius:6,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444',fontSize:12,marginBottom:16}}>{loginError}</div>}
        <button style={{...S.primaryBtn,width:'100%',opacity:loginLoading?0.7:1}} onClick={doLogin} disabled={loginLoading}>{loginLoading?'Accesso...':'Accedi'}</button>
        <button style={{background:'none',border:'none',color:colors.textMuted,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,margin:'16px auto 0'}} onClick={navigateBack}><ArrowLeftIcon /> Home</button>
      </div>
    </div>
  );

  const TABS = [
    { key:'richieste', label:'Richieste', count:suggerimenti.filter(s=>s.stato==='pending').length },
    { key:'patologie', label:'Patologie', count:patologieList.length },
    { key:'procedure', label:'Procedure', count:procedureList.length },
    { key:'changelog-md', label:'Changelog' },
    ...(userRole==='admin'?[{ key:'utenti', label:'Utenti', count:users.length }]:[]),
    { key:'log', label:'Log', count:changelog.length },
  ];

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',background:colors.bgDeep,overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'8px 20px',borderBottom:`1px solid ${colors.border}`,display:'flex',alignItems:'center',gap:12,flexShrink:0,background:'rgba(10,22,40,0.6)'}}>
        <button style={{background:'none',border:'none',color:colors.textMuted,cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'4px 8px',borderRadius:6}} onClick={navigateBack}><ArrowLeftIcon /> Home</button>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:700,color:colors.textPrimary}}><ShieldIcon /> Admin</div>
        <div style={{flex:1}} />
        <button style={{...S.secBtn,padding:'4px 10px',fontSize:10}} onClick={doSync} disabled={loading}>{loading?<SyncIcon />:'Sync DB'}</button>
        <button style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,border:`1px solid ${colors.border}`,background:'transparent',color:colors.textSecondary,fontWeight:600,fontSize:10,cursor:'pointer'}} onClick={() => window.open(`${API_BASE_URL}/admin/export-zip`, '_blank')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Esporta ZIP
        </button>
        <div style={{display:'flex',gap:2,background:'rgba(255,255,255,0.03)',borderRadius:8,padding:3}}>
          {TABS.map(t=>(
            <button key={t.key} style={{background:tab===t.key?colors.accentLight:'none',border:'none',color:tab===t.key?colors.accent:colors.textMuted,cursor:'pointer',padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,display:'flex',alignItems:'center',gap:4}} onClick={()=>{setTab(t.key);if(t.key==='log')fetchCh();if(t.key==='richieste')fetchSugg();if(t.key==='patologie')fetchPatologieList();if(t.key==='procedure')fetchProcedureList();}}>
              {t.label}{t.count>0&&<span style={{fontSize:9,background:tab===t.key?'rgba(0,0,0,0.1)':'rgba(255,255,255,0.06)',padding:'1px 5px',borderRadius:8,fontWeight:700}}>{t.count}</span>}
            </button>
          ))}
        </div>
        <span style={{fontSize:10,color:colors.textMuted}}>{username}</span>
        <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:8,background:userRole==='admin'?'rgba(245,158,11,0.15)':'rgba(16,185,129,0.15)',color:userRole==='admin'?'#f59e0b':'#10b981'}}>{userRole}</span>
        <button style={{background:'none',border:`1px solid ${colors.border}`,color:colors.textMuted,padding:'4px 10px',borderRadius:6,fontSize:10,fontWeight:600,cursor:'pointer'}} onClick={doLogout}>Esci</button>
      </div>

      <div style={{flex:1,overflow:'auto',padding:'16px 20px'}}>
        {msg&&<div style={{padding:'8px 12px',borderRadius:8,fontSize:12,marginBottom:12,background:msg.includes('Errore')?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)',color:msg.includes('Errore')?'#ef4444':'#10b981',border:`1px solid ${msg.includes('Errore')?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)'}`}}>{msg}</div>}

        {/* ===== RICHIESTE ===== */}
        {tab==='richieste'&&<div>
          <div style={{fontSize:12,fontWeight:600,color:colors.textSecondary,marginBottom:10}}>Richieste in attesa: {suggerimenti.filter(s=>s.stato==='pending').length} | Approvate: {suggerimenti.filter(s=>s.stato==='approved').length} | Respinte: {suggerimenti.filter(s=>s.stato==='rejected').length}</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {suggerimenti.map((s,i)=>(
              <div key={i} style={{...S.formCard,borderColor:s.stato==='approved'?'rgba(16,185,129,0.3)':s.stato==='rejected'?'rgba(239,68,68,0.3)':''}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <span style={{padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700,background:s.tipo==='nuova'||s.tipo==='nuova_patologia'?'rgba(16,185,129,0.1)':'rgba(59,130,246,0.1)',color:s.tipo==='nuova'||s.tipo==='nuova_patologia'?'#10b981':'#3b82f6'}}>{s.tipo==='nuova'||s.tipo==='nuova_patologia'?'NUOVA':s.tipo==='modifica'?'MODIFICA':s.tipo.toUpperCase()}</span>
                  <span style={{padding:'2px 6px',borderRadius:4,fontSize:10,fontWeight:700,background:s.stato==='pending'?'rgba(245,158,11,0.1)':s.stato==='approved'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',color:s.stato==='pending'?'#f59e0b':s.stato==='approved'?'#10b981':'#ef4444'}}>{s.stato.toUpperCase()}</span>
                  <span style={{fontSize:11,fontWeight:600,color:colors.textPrimary}}>{s.target}</span>
                  <span style={{fontSize:10,color:colors.textMuted,marginLeft:'auto'}}>{s.autore} - {new Date(s.timestamp).toLocaleDateString('it-IT')}</span>
                </div>
                {s.dati&&Object.keys(s.dati).length>0&&<div style={{fontSize:11,color:colors.textSecondary,marginBottom:8,background:colors.bgDeep,padding:8,borderRadius:6}}>
                  {Object.entries(s.dati).map(([k,v])=>(<div key={k}><strong>{k}:</strong> {typeof v==='object'?JSON.stringify(v):String(v)}</div>))}
                </div>}
                {s.stato==='pending'&&<div style={{display:'flex',gap:6}}>
                  <button style={{...S.primaryBtn,padding:'4px 10px',fontSize:10,background:'#10b981'}} onClick={()=>approveSugg(s.id,'approved')}><CheckIcon /> Approva</button>
                  <button style={{...S.secBtn,padding:'4px 10px',fontSize:10,color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}} onClick={()=>approveSugg(s.id,'rejected')}><XIcon /> Rifiuta</button>
                  <button style={{...S.secBtn,padding:'4px 10px',fontSize:10,color:'#ef4444',borderColor:'rgba(239,68,68,0.3)',marginLeft:'auto'}} onClick={()=>deleteSugg(s.id)}><TrashIcon /> Elimina</button>
                </div>}
                {s.stato!=='pending'&&<div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button style={{...S.secBtn,padding:'4px 10px',fontSize:10,color:'#ef4444',borderColor:'rgba(239,68,68,0.3)'}} onClick={()=>deleteSugg(s.id)}><TrashIcon /> Elimina</button>
                </div>}
              </div>
            ))}
            {suggerimenti.length===0&&<div style={{padding:20,textAlign:'center',color:colors.textMuted,fontSize:12}}>Nessuna richiesta.</div>}
          </div>
        </div>}

        {/* ===== PATOLOGIE ===== */}
        {tab==='patologie'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
            <div style={{fontSize:12,fontWeight:600,color:colors.textSecondary}}>Patologie caricate: {patologieList.length}</div>
            <button style={S.secBtn} onClick={fetchPatologieList} disabled={loading}>Aggiorna</button>
          </div>

          {/* Upload form */}
          <div style={S.formCard}>
            <div style={{fontSize:11,fontWeight:700,color:colors.textPrimary,marginBottom:10}}>Carica nuova patologia (.md)</div>
            <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}>
              <div style={{flex:'0 0 160px'}}>
                <label style={S.label}>Ambito</label>
                <select style={S.input} value={uploadAmbito} onChange={e=>setUploadAmbito(e.target.value)}>
                  {AMBITI.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <label style={S.label}>File .md</label>
                <input type="file" accept=".md" style={{fontSize:11,color:colors.textPrimary}} onChange={e=>setUploadFile(e.target.files?.[0]||null)} />
              </div>
              <button style={{...S.primaryBtn,opacity:(!uploadFile||uploading)?0.5:1,whiteSpace:'nowrap'}} onClick={()=>uploadMd('patologie')} disabled={!uploadFile||uploading}>
                <UploadIcon /> {uploading?'Caricamento...':'Carica'}
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {patologieList.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:colors.bgSurface,border:`1px solid ${colors.border}`,borderRadius:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#ef4444',flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:12,color:colors.textPrimary}}>{p.nome}</div>
                  <div style={{fontSize:10,color:colors.textMuted,display:'flex',gap:6,marginTop:1}}>
                    <span style={{background:'rgba(239,68,68,0.1)',color:'#ef4444',padding:'1px 5px',borderRadius:4,fontWeight:600}}>{p.ambito}</span>
                    <span style={{color:colors.textMuted}}>{p.file}</span>
                  </div>
                </div>
                <button style={{...S.iconBtn,color:colors.danger}} onClick={()=>deletePatologiaMd(p.ambito,p.filename)}><TrashIcon /></button>
              </div>
            ))}
            {patologieList.length===0&&<div style={{padding:20,textAlign:'center',color:colors.textMuted,fontSize:12}}>Nessuna patologia trovata.</div>}
          </div>
        </div>}

        {/* ===== PROCEDURE ===== */}
        {tab==='procedure'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:14,alignItems:'center'}}>
            <div style={{fontSize:12,fontWeight:600,color:colors.textSecondary}}>Procedure caricate: {procedureList.length}</div>
            <button style={S.secBtn} onClick={fetchProcedureList} disabled={loading}>Aggiorna</button>
          </div>

          {/* Upload form */}
          <div style={S.formCard}>
            <div style={{fontSize:11,fontWeight:700,color:colors.textPrimary,marginBottom:10}}>Carica nuova procedura (.md)</div>
            <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}>
              <div style={{flex:'0 0 160px'}}>
                <label style={S.label}>Ambito</label>
                <select style={S.input} value={uploadAmbito} onChange={e=>setUploadAmbito(e.target.value)}>
                  {AMBITI.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <label style={S.label}>File .md</label>
                <input type="file" accept=".md" style={{fontSize:11,color:colors.textPrimary}} onChange={e=>setUploadFile(e.target.files?.[0]||null)} />
              </div>
              <button style={{...S.primaryBtn,opacity:(!uploadFile||uploading)?0.5:1,whiteSpace:'nowrap'}} onClick={()=>uploadMd('procedure')} disabled={!uploadFile||uploading}>
                <UploadIcon /> {uploading?'Caricamento...':'Carica'}
              </button>
            </div>
          </div>

          {/* List */}
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {procedureList.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:colors.bgSurface,border:`1px solid ${colors.border}`,borderRadius:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#8b5cf6',flexShrink:0}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:12,color:colors.textPrimary}}>{p.nome}</div>
                  <div style={{fontSize:10,color:colors.textMuted,display:'flex',gap:6,marginTop:1}}>
                    <span style={{background:colors.accentLight,color:colors.accent,padding:'1px 5px',borderRadius:4,fontWeight:600}}>{p.ambito}</span>
                    <span style={{color:colors.textMuted}}>{p.file}</span>
                  </div>
                </div>
                <button style={{...S.iconBtn,color:colors.danger}} onClick={()=>deleteProcedureMd(p.ambito,p.filename)}><TrashIcon /></button>
              </div>
            ))}
            {procedureList.length===0&&<div style={{padding:20,textAlign:'center',color:colors.textMuted,fontSize:12}}>Nessuna procedura trovata.</div>}
          </div>
        </div>}

        {/* ===== CHANGELOG MD ===== */}
        {tab==='changelog-md'&&<div>
          <div style={{fontSize:12,fontWeight:600,color:colors.textSecondary,marginBottom:10}}>Carica un file changelog.md per aggiornare il changelog pubblico</div>
          <div style={S.formCard}>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label style={S.label}>File changelog.md *</label>
                <input type="file" accept=".md" style={{fontSize:11,color:colors.textPrimary}} onChange={e=>setChangelogMdFile(e.target.files?.[0]||null)} />
              </div>
              {changelogMdFile && <div style={{fontSize:11,color:colors.textSecondary}}><FileIcon /> {changelogMdFile.name}</div>}
              <button
                style={{...S.primaryBtn,opacity:(!changelogMdFile||uploadingChangelog)?0.5:1,width:'fit-content'}}
                onClick={uploadChangelogMd}
                disabled={!changelogMdFile||uploadingChangelog}
              >
                <UploadIcon /> {uploadingChangelog?'Caricamento...':'Aggiorna Changelog'}
              </button>
            </div>
          </div>
        </div>}

        {/* ===== UTENTI ===== */}
        {tab==='utenti'&&userRole==='admin'&&<div>
          <div style={{display:'flex',gap:8,marginBottom:14}}><button style={S.primaryBtn} onClick={()=>{setShowCreateUser(true);setEditingUser(null);setUserForm({username:"",password:"",role:"contributor"});}}><PlusIcon /> Nuovo Utente</button></div>
          {(showCreateUser||editingUser)&&<div style={S.formCard}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><h3 style={{fontSize:14,margin:0,color:colors.textPrimary}}>{editingUser?`Modifica: ${editingUser}`:'Nuovo Utente'}</h3><button style={S.closeBtn} onClick={()=>{setShowCreateUser(false);setEditingUser(null);}}>x</button></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,alignItems:'end'}}>
              <div><label style={S.label}>Username*</label><input style={{...S.input,opacity:editingUser?0.5:1}} value={userForm.username} onChange={e=>setUserForm({...userForm,username:e.target.value})} disabled={!!editingUser} /></div>
              <div><label style={S.label}>{editingUser?'Nuova Password':'Password*'}</label><input style={S.input} type="password" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} /></div>
              <div><label style={S.label}>Ruolo*</label><select style={S.input} value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="contributor">Contributor</option><option value="admin">Admin</option></select></div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button style={{...S.primaryBtn,opacity:loading?0.5:1}} onClick={()=>editingUser?updateUser(editingUser):createUser()} disabled={loading}>{editingUser?'Aggiorna':'Crea'}</button>
              <button style={S.secBtn} onClick={()=>{setShowCreateUser(false);setEditingUser(null);}}>Annulla</button>
            </div>
          </div>}
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {users.map((u,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:colors.bgSurface,border:`1px solid ${colors.border}`,borderRadius:8}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:u.role==='admin'?'#f59e0b':'#10b981',flexShrink:0}} />
                <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:colors.textPrimary}}>{u.username}</div><div style={{fontSize:10,color:colors.textMuted}}><span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:8,background:u.role==='admin'?'rgba(245,158,11,0.15)':'rgba(16,185,129,0.15)',color:u.role==='admin'?'#f59e0b':'#10b981'}}>{u.role}</span>{u.username==='admin'&&<span style={{marginLeft:6,fontSize:9,color:colors.textMuted}}>(predefinito)</span>}</div></div>
                <button style={S.iconBtn} onClick={()=>{setEditingUser(u.username);setShowCreateUser(false);setUserForm({username:u.username,password:"",role:u.role});}}><PlusIcon /></button>
                {u.username!=='admin'&&u.username!==username&&<button style={{...S.iconBtn,color:colors.danger}} onClick={()=>deleteUser(u.username)}><XIcon /></button>}
              </div>
            ))}
          </div>
        </div>}

        {/* ===== LOG ===== */}
        {tab==='log'&&<div>
          <div style={{fontSize:12,fontWeight:600,color:colors.textSecondary,marginBottom:10}}>Cronologia ({changelog.length})</div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            {changelog.map((e,i)=>(
              <div key={i} style={{padding:'8px 12px',background:colors.bgSurface,border:`1px solid ${colors.border}`,borderRadius:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <span style={{padding:'1px 6px',borderRadius:4,fontSize:9,fontWeight:700,background:e.action.includes('CREATE')?'rgba(16,185,129,0.1)':e.action.includes('DELETE')?'rgba(239,68,68,0.1)':e.action.includes('SYNC')?'rgba(59,130,246,0.1)':e.action.includes('RICHIESTA')?'rgba(139,92,246,0.1)':'rgba(245,158,11,0.1)',color:e.action.includes('CREATE')?'#10b981':e.action.includes('DELETE')?'#ef4444':e.action.includes('SYNC')?'#3b82f6':e.action.includes('RICHIESTA')?'#8b5cf6':'#f59e0b'}}>{e.action}</span>
                  <span style={{fontWeight:600,fontSize:12,color:colors.textPrimary}}>{e.target||e.patologia}</span>
                  <span style={{fontSize:10,color:colors.textMuted,marginLeft:'auto'}}>{e.username} - {new Date(e.timestamp).toLocaleString('it-IT')}</span>
                </div>
              </div>
            ))}
            {changelog.length===0&&<div style={{padding:20,textAlign:'center',color:colors.textMuted,fontSize:12}}>Nessuna modifica.</div>}
          </div>
        </div>}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const S = {
  loginPage:{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0a1628 0%,#0f1d32 50%,#0a1628 100%)',padding:20},
  loginCard:{width:'100%',maxWidth:380,background:'rgba(15,29,50,0.9)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'40px 32px',backdropFilter:'blur(20px)',boxShadow:'0 20px 60px rgba(0,0,0,0.5)',textAlign:'center'},
  loginIcon:{width:56,height:56,borderRadius:14,background:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',color:'#10b981'},
  label:{display:'block',fontSize:10,color:colors.textMuted,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4},
  input:{width:'100%',padding:'7px 10px',borderRadius:6,border:`1px solid ${colors.border}`,background:colors.bgDeep,color:colors.textPrimary,fontSize:12,outline:'none',boxSizing:'border-box',marginBottom:4},
  primaryBtn:{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:6,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontWeight:600,fontSize:11,cursor:'pointer'},
  secBtn:{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:6,border:`1px solid ${colors.border}`,background:'transparent',color:colors.textSecondary,fontWeight:600,fontSize:11,cursor:'pointer'},
  formCard:{background:colors.bgSurface,border:`1px solid ${colors.border}`,borderRadius:10,padding:16,marginBottom:12,animation:'slideUp 0.3s ease both'},
  closeBtn:{color:colors.textMuted,background:'none',border:'none',cursor:'pointer',fontSize:16},
  iconBtn:{background:'none',border:`1px solid ${colors.border}`,borderRadius:5,padding:5,cursor:'pointer',color:colors.textSecondary,display:'flex',alignItems:'center',justifyContent:'center'},
};
