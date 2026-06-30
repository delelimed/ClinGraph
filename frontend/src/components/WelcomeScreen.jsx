// src/components/WelcomeScreen.jsx
import { useState, useEffect } from "react";
import { styles, colors } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

const AMBITI = ['Cardiologia', 'Pneumologia', 'Gastroenterologia', 'Endocrinologia', 'Neurologia', 'Ortopedia', 'Dermatologia', 'Urologia', 'Ginecologia', 'Oncologia', 'Nefrologia', 'Reumatologia', 'Medicina Interna'];

const HeartPulseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" />
    <path d="M5 12h2l2 4 4-8 2 4h4" stroke={colors.accent} />
  </svg>
);

const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const ArrowLeftIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;

const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

export default function WelcomeScreen({ setScreen, onOpenExplorer }) {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [showWarningEffect, setShowWarningEffect] = useState(false);
  const [showRequestTypeModal, setShowRequestTypeModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalType, setProposalType] = useState("nuova_patologia");
  const [proposalStatus, setProposalStatus] = useState(null);
  const [pathologieList, setPathologieList] = useState([]);
  const [procedureList, setProcedureList] = useState([]);
  const [proposalForm, setProposalForm] = useState({
    nome: "", target: "", ambito: "Cardiologia", note: "", nome_autore: "", email_autore: "",
  });
  const [richieste, setRichieste] = useState([]);
  const [changelogContent, setChangelogContent] = useState("");
  const [showChangelogPanel, setShowChangelogPanel] = useState(false);

  const isLoggedIn = !!localStorage.getItem("admin_token");

  useEffect(() => {
    fetch(`${API_BASE_URL}/richieste-pubbliche`)
      .then(r => r.json())
      .then(d => setRichieste(d.richieste || []))
      .catch(() => {});
    fetch(`${API_BASE_URL}/patologie-list`)
      .then(r => r.json())
      .then(d => setPathologieList(d.patologie || []))
      .catch(() => {});
    fetch(`${API_BASE_URL}/procedure-list`)
      .then(r => r.json())
      .then(d => setProcedureList(d.procedure || []))
      .catch(() => {});
  }, []);

  const fetchChangelogMd = () => {
    fetch(`${API_BASE_URL}/changelog-pubblico-md`)
      .then(r => r.json())
      .then(d => setChangelogContent(d.content || ""))
      .catch(() => {});
  };

  const handleDiagnosisClick = () => {
    if (hasAcceptedDisclaimer) {
      setScreen("diagnosis");
    } else {
      setShowWarningEffect(true);
      setTimeout(() => setShowWarningEffect(false), 600);
    }
  };

  const openProposalModal = (type) => {
    setProposalType(type);
    setProposalStatus(null);
    setProposalForm({ nome: "", target: "", ambito: "Cardiologia", note: "", nome_autore: "", email_autore: "" });
    setShowRequestTypeModal(false);
    setShowProposalModal(true);
  };

  const handleSubmitProposal = async () => {
    const dati = { note: proposalForm.note };
    if (proposalType === "nuova_patologia") {
      dati.nome = proposalForm.nome;
      dati.ambito = proposalForm.ambito;
    } else {
      dati.target = proposalForm.target;
    }
    dati.nome_autore = proposalForm.nome_autore || "Anonimo";
    dati.email_autore = proposalForm.email_autore || "anonimo@example.com";
    setProposalStatus("loading");
    try {
      const res = await fetch(`${API_BASE_URL}/admin/suggerimenti`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: proposalType, target: proposalType === "nuova_patologia" ? proposalForm.nome : proposalForm.target, dati }),
      });
      if (res.ok) {
        setProposalStatus("success");
        fetch(`${API_BASE_URL}/richieste-pubbliche`).then(r=>r.json()).then(d=>setRichieste(d.richieste||[])).catch(()=>{});
      } else {
        const e = await res.json();
        setProposalStatus("error");
        console.error("Proposal error:", e);
      }
    } catch (err) {
      setProposalStatus("error");
      console.error("Proposal catch:", err);
    }
  };

  const statoLabel = (stato) => {
    switch(stato) {
      case 'pending': return { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', text: 'In Attesa' };
      case 'approved': return { bg: 'rgba(16,185,129,0.1)', color: '#10b981', text: 'Approvata' };
      case 'rejected': return { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', text: 'Respinta' };
      default: return { bg: 'rgba(255,255,255,0.05)', color: colors.textMuted, text: stato };
    }
  };

  const isModification = proposalType === "modifica";
  const canSubmit = proposalStatus === "loading" || (isModification ? !proposalForm.target : !proposalForm.nome) || !proposalForm.note;

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', background: colors.bgDeep, overflow: 'auto' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center', animation: 'slideUp 0.5s ease both' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: colors.accentLight, border: `1px solid ${colors.borderActive}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent,
            }}>
              <HeartPulseIcon />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>ClinGraph</h1>
              <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Clinical Decision Support System
              </span>
            </div>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            Piattaforma sperimentale di supporto decisionale clinico basata sulla teoria dei grafi per la correlazione sintomatologica.
          </p>
        </div>

        {/* Disclaimer Box */}
        <div style={{
          background: showWarningEffect ? colors.dangerLight : 'rgba(245, 158, 11, 0.04)',
          border: `1px solid ${showWarningEffect ? colors.danger : 'rgba(245, 158, 11, 0.15)'}`,
          borderLeft: `3px solid ${colors.warning}`,
          borderRadius: 10, padding: '16px 20px', textAlign: 'left',
          maxWidth: 600, width: '100%', marginBottom: 32,
          transition: 'all 300ms ease', animation: 'slideUp 0.5s ease 0.1s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <WarningIcon />
            <span style={{ color: colors.warning, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Avviso Importante e Note Legali
            </span>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 1.65, marginBottom: 8 }}>
            L'attivita' diagnostica e la valutazione dei quadri clinici sono processi complessi che richiedono competenze professionali e anni di formazione accademica specialistica. Questo software e' una <strong style={{ color: colors.textPrimary }}>risorsa puramente sperimentale, didattica ed accademica</strong>.
          </p>
          <p style={{ color: colors.textSecondary, fontSize: 12.5, lineHeight: 1.65, marginBottom: 0 }}>
            Le informazioni, le correlazioni strutturali e i grafi generati dal sistema <strong style={{ color: colors.textPrimary }}>non costituiscono un parere medico, una diagnosi formale, ne' una prescrizione terapeutica</strong>. In presenza di sintomi o quesiti clinici, e' tassativo rivolgersi tempestivamente al proprio medico curante o alle strutture sanitarie competenti.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setHasAcceptedDisclaimer(!hasAcceptedDisclaimer)}>
            <div style={{
              width: 38, height: 20, borderRadius: 10,
              background: hasAcceptedDisclaimer ? colors.accent : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${hasAcceptedDisclaimer ? colors.accent : 'rgba(255, 255, 255, 0.1)'}`,
              position: 'relative', transition: 'all 200ms ease', flexShrink: 0,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 1,
                left: hasAcceptedDisclaimer ? 19 : 1,
                transition: 'left 200ms ease', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              }} />
            </div>
            <span style={{ color: hasAcceptedDisclaimer ? colors.textPrimary : colors.textMuted, fontSize: 12.5, fontWeight: 500, transition: 'color 200ms ease' }}>
              Dichiaro di aver compreso la natura sperimentale del software e i limiti clinici sopra descritti.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'slideUp 0.5s ease 0.2s both' }}>
          <button style={{
            ...styles.buttonPrimary,
            opacity: hasAcceptedDisclaimer ? 1 : 0.35, cursor: hasAcceptedDisclaimer ? 'pointer' : 'not-allowed',
            boxShadow: hasAcceptedDisclaimer ? '0 4px 16px rgba(13, 148, 136, 0.3)' : 'none',
            transform: hasAcceptedDisclaimer ? 'scale(1)' : 'scale(0.98)',
            transition: 'all 250ms ease', padding: '12px 28px',
          }} onClick={handleDiagnosisClick}>
            Modulo Diagnostico
          </button>
          <button style={{ ...styles.buttonSecondary, padding: '12px 28px' }} onClick={onOpenExplorer}>
            Consultazione Libera del Grafo
          </button>
        </div>

        {/* Request buttons */}
        <div style={{ marginTop: 24, animation: 'slideUp 0.5s ease 0.3s both' }}>
          <button style={{ ...styles.buttonSecondary, padding: '10px 24px', fontSize: 12 }} onClick={() => setShowRequestTypeModal(true)}>
            Richiedi Modifica / Nuova Patologia
          </button>
        </div>

        {/* Admin link */}
        <div style={{ marginTop: 12, animation: 'slideUp 0.5s ease 0.35s both' }}>
          <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', padding: '4px 8px', borderRadius: 4, transition: 'color 150ms ease' }}
            onClick={() => setScreen("admin")}
            onMouseEnter={(e) => { e.target.style.color = colors.textSecondary; }}
            onMouseLeave={(e) => { e.target.style.color = colors.textMuted; }}>
            Amministrazione
          </button>
        </div>

        {/* Changelog button */}
        <div style={{ marginTop: 12, animation: 'slideUp 0.5s ease 0.4s both' }}>
          <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}
            onClick={() => { setShowChangelogPanel(true); fetchChangelogMd(); }}
            onMouseEnter={(e) => { e.target.style.color = colors.textSecondary; }}
            onMouseLeave={(e) => { e.target.style.color = colors.textMuted; }}>
            <ClockIcon /> Mostra Changelog
          </button>
        </div>
      </div>

      {/* Public Requests Section */}
      {richieste.length > 0 && (
        <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', paddingBottom: 40, background: colors.bgSurface, borderTop: `1px solid ${colors.border}`, padding: '24px 24px 40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, maxWidth: 672, margin: '0 auto 16px' }}>
            <ListIcon />
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: colors.textPrimary }}>Richieste della Comunita'</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 672, margin: '0 auto' }}>
            {richieste.slice(0, 10).map((r, i) => {
              const sl = statoLabel(r.stato);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: colors.bgDeep, border: `1px solid ${colors.border}`, borderRadius: 8 }}>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: r.tipo === 'nuova' || r.tipo === 'nuova_patologia' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: r.tipo === 'nuova' || r.tipo === 'nuova_patologia' ? '#10b981' : '#3b82f6' }}>
                    {r.tipo === 'nuova' || r.tipo === 'nuova_patologia' ? 'NUOVA' : 'MODIFICA'}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 12, color: colors.textPrimary, flex: 1 }}>{r.target}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: sl.bg, color: sl.color }}>{sl.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Changelog Panel (right side) */}
      {showChangelogPanel && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '90vw', background: colors.bgDeep, borderLeft: `1px solid ${colors.border}`, zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0, 0, 0, 0.5)', animation: 'slideInRight 0.3s ease both' }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <ClockIcon />
            <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary, flex: 1 }}>Changelog</span>
            <button style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }} onClick={() => setShowChangelogPanel(false)}>
              <CloseIcon />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {changelogContent ? (
              <div style={{ background: colors.bgSurface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20, color: colors.textPrimary, fontSize: 14, lineHeight: 1.7 }}>
                {changelogContent.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} style={{fontSize:22,fontWeight:700,margin:'0 0 14px 0',color:colors.textPrimary}}>{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} style={{fontSize:17,fontWeight:700,margin:'18px 0 8px 0',color:colors.textPrimary}}>{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} style={{fontSize:14,fontWeight:700,margin:'14px 0 6px 0',color:colors.textPrimary}}>{line.slice(4)}</h3>;
                  if (line.startsWith('- ')) return <li key={i} style={{marginLeft:16,marginBottom:4,color:colors.textSecondary}}>{line.slice(2)}</li>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} style={{margin:'0 0 6px 0',color:colors.textSecondary}}>{line}</p>;
                })}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
                Nessun changelog disponibile.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for changelog panel */}
      {showChangelogPanel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }} onClick={() => setShowChangelogPanel(false)} />
      )}

      {/* Request Type Selection Modal */}
      {showRequestTypeModal && (
        <div style={modalStyles.backdrop} onClick={() => setShowRequestTypeModal(false)}>
          <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>Che tipo di richiesta vuoi fare?</h2>
              <button style={modalStyles.closeBtn} onClick={() => setShowRequestTypeModal(false)}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <button style={{ ...styles.buttonPrimary, width: '100%', padding: '16px 24px', justifyContent: 'center' }} onClick={() => openProposalModal("nuova_patologia")}>
                Proponi Nuova Patologia
              </button>
              <button style={{ ...styles.buttonSecondary, width: '100%', padding: '16px 24px', justifyContent: 'center' }} onClick={() => openProposalModal("modifica")}>
                Richiedi Modifica a Patologia/Procedura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      {showProposalModal && (
        <div style={modalStyles.backdrop} onClick={() => setShowProposalModal(false)}>
          <div style={modalStyles.container} onClick={(e) => e.stopPropagation()}>
            <div style={modalStyles.header}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary }}>
                {isModification ? "Richiedi Modifica" : "Nuova Proposta"}
              </h2>
              <button style={modalStyles.closeBtn} onClick={() => setShowProposalModal(false)}>&times;</button>
            </div>

            {proposalStatus === "success" ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ color: '#2dd4bf', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Proposta inviata con successo!</p>
                <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>Un admin la esaminerà a breve.</p>
                <button style={{ ...modalStyles.submitBtn, marginTop: 20 }} onClick={() => setShowProposalModal(false)}>Chiudi</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {isModification ? (
                  <>
                    <div>
                      <label style={modalStyles.label}>Tipo *</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ ...modalStyles.typeBtn, ...(proposalForm.target && pathologieList.some(p => p.nome === proposalForm.target) ? modalStyles.typeBtnActive : {}) }}
                          onClick={() => setProposalForm({ ...proposalForm, target: "" })}>
                          Patologia
                        </button>
                        <button style={{ ...modalStyles.typeBtn }}
                          onClick={() => setProposalForm({ ...proposalForm, target: "" })}>
                          Procedura
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={modalStyles.label}>Seleziona Patologia o Procedura *</label>
                      <select style={modalStyles.input} value={proposalForm.target} onChange={e => setProposalForm({ ...proposalForm, target: e.target.value })}>
                        <option value="">-- Seleziona --</option>
                        <optgroup label="Patologie">
                          {pathologieList.map(p => <option key={p.nome} value={p.nome}>{p.nome} ({p.ambito})</option>)}
                        </optgroup>
                        <optgroup label="Procedure">
                          {procedureList.map(p => <option key={p.nome} value={p.nome}>{p.nome} ({p.ambito})</option>)}
                        </optgroup>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label style={modalStyles.label}>Nome Patologia *</label>
                      <input style={modalStyles.input} value={proposalForm.nome} onChange={e => setProposalForm({ ...proposalForm, nome: e.target.value })} placeholder="Es. Scompenso Cardiaco..." />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Ambito</label>
                      <select style={modalStyles.input} value={proposalForm.ambito} onChange={e => setProposalForm({ ...proposalForm, ambito: e.target.value })}>
                        {AMBITI.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label style={modalStyles.label}>Motivazione / Dettagli richiesta *</label>
                  <textarea rows={3} style={modalStyles.textarea} value={proposalForm.note} onChange={e => setProposalForm({ ...proposalForm, note: e.target.value })} placeholder="Perché proponi questa modifica/nuova patologia?" />
                </div>

                {!isLoggedIn && (
                  <>
                    <div style={{ height: 1, background: colors.border }} />
                    <p style={{ margin: 0, color: colors.textMuted, fontSize: 12 }}>Per follow-up della proposta, inserisci i tuoi dati:</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={modalStyles.label}>Nome *</label>
                        <input style={modalStyles.input} value={proposalForm.nome_autore} onChange={e => setProposalForm({ ...proposalForm, nome_autore: e.target.value })} placeholder="Il tuo nome..." />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={modalStyles.label}>Email *</label>
                        <input type="email" style={modalStyles.input} value={proposalForm.email_autore} onChange={e => setProposalForm({ ...proposalForm, email_autore: e.target.value })} placeholder="La tua email..." />
                      </div>
                    </div>
                  </>
                )}

                {proposalStatus === "error" && (
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>Errore nell'invio. Riprova.</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button style={modalStyles.cancelBtn} onClick={() => setShowProposalModal(false)}>Annulla</button>
                  <button style={{ ...modalStyles.submitBtn, opacity: canSubmit ? 0.6 : 1, pointerEvents: canSubmit ? 'none' : 'auto' }}
                    onClick={handleSubmitProposal} disabled={canSubmit}>
                    {proposalStatus === "loading" ? "Invio..." : "Invia Proposta"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

const modalStyles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: 24,
  },
  container: {
    background: colors.bgSurface, border: `1px solid ${colors.border}`,
    borderRadius: 16, padding: 28, maxWidth: 600, width: '100%',
    maxHeight: '85vh', overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  closeBtn: {
    background: 'none', border: 'none', color: colors.textMuted,
    fontSize: 24, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
  },
  label: {
    display: 'block', fontSize: 10, color: colors.textMuted,
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  },
  input: {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${colors.border}`, background: colors.bgDeep,
    color: colors.textPrimary, fontSize: 12, outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${colors.border}`, background: colors.bgDeep,
    color: colors.textPrimary, fontSize: 12, outline: 'none', boxSizing: 'border-box',
    resize: 'vertical', lineHeight: 1.5,
  },
  cancelBtn: {
    padding: '8px 18px', borderRadius: 8,
    border: `1px solid ${colors.border}`, background: 'transparent',
    color: colors.textSecondary, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },
  submitBtn: {
    padding: '8px 18px', borderRadius: 8, border: 'none',
    background: colors.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  typeBtn: {
    flex: 1, padding: '8px 12px', borderRadius: 6,
    border: `1px solid ${colors.border}`, background: 'transparent',
    color: colors.textSecondary, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  typeBtnActive: {
    border: `1px solid ${colors.accent}`, background: colors.accentLight,
    color: colors.accent,
  },
};
