// src/components/DetailScreen.jsx
import { useState, useEffect } from "react";
import { styles, colors, badgeStyle } from "../styles";
import ReactMarkdown from "react-markdown";

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
  </svg>
);

const PillIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 1.5 3 3-8.5 8.5a4.95 4.95 0 0 0 7 7 4.95 4.95 0 0 0 7-7l-8.5-8.5 3-3" />
  </svg>
);

const StethoscopeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

const FlaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6" /><path d="M10 9V3" /><path d="M14 9V3" />
    <path d="M6 21h12" /><path d="M10 9l-4 8h8l-4-8" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const GenderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="8" r="5" /><path d="M21 21l-4.35-4.35" /><path d="M15 8h5" /><path d="M17.5 5.5v5" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default function DetailScreen({ selectedPathology, navigateBack, onNavigateToPathology }) {
  const [analisiCollegate, setAnalisiCollegate] = useState([]);
  const [procedureCollegate, setProcedureCollegate] = useState([]);
  const [selectedAnalisi, setSelectedAnalisi] = useState(null);
  const [analisiDetail, setAnalisiDetail] = useState(null);

  useEffect(() => {
    if (selectedPathology?.patologia) {
      fetch(`${API_BASE_URL}/analisi-per-patologia/${encodeURIComponent(selectedPathology.patologia)}`)
        .then(res => res.json())
        .then(data => setAnalisiCollegate(data.analisi || []))
        .catch(() => setAnalisiCollegate([]));

      fetch(`${API_BASE_URL}/procedure-diagnostiche`)
        .then(res => res.json())
        .then(data => {
          const allProcedure = data.procedure || [];
          const linked = allProcedure.filter(p =>
            p.patologie_correlate && p.patologie_correlate.some(pc =>
              pc.toLowerCase().includes(selectedPathology.patologia.toLowerCase()) ||
              selectedPathology.patologia.toLowerCase().includes(pc.toLowerCase())
            )
          );
          setProcedureCollegate(linked);
        })
        .catch(() => setProcedureCollegate([]));
    }
  }, [selectedPathology?.patologia]);

  useEffect(() => {
    if (selectedAnalisi) {
      fetch(`${API_BASE_URL}/analisi/${encodeURIComponent(selectedAnalisi)}`)
        .then(res => res.json())
        .then(data => setAnalisiDetail(data))
        .catch(() => setAnalisiDetail(null));
    }
  }, [selectedAnalisi]);

  if (!selectedPathology) return null;

  const {
    patologia,
    descrizione,
    immagine,
    caratteristiche_tipiche,
    sintomi,
    stile_vita,
    eta_target,
    ambito,
    terapia,
    diagnosi,
    esami_laboratorio,
    diagnosi_differenziale = [],
    prevalenza_gender = "",
    prevalenza_eta = "",
    farmaci = [],
    dosaggi = {},
    quadro_radiologico = "",
    anatomia_patologica = "",
    linee_guida = [],
  } = selectedPathology;

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    terapia: "",
    diagnosi: "",
    esami_laboratorio: "",
    note: "",
    nome_autore: "",
    email_autore: "",
    tipo_proposta: "patologia"
  });
  const [proposalStatus, setProposalStatus] = useState(null);

  const isLoggedIn = !!localStorage.getItem("admin_token");

  const handleSubmitProposal = async () => {
    const token = localStorage.getItem("admin_token");

    const dati = {};
    if (proposalForm.terapia) dati.terapia = proposalForm.terapia;
    if (proposalForm.diagnosi) dati.diagnosi = proposalForm.diagnosi;
    if (proposalForm.esami_laboratorio) dati.esami_laboratorio = proposalForm.esami_laboratorio;
    if (proposalForm.descrizione) dati.descrizione = proposalForm.descrizione;
    dati.note = proposalForm.note;

    if (proposalForm.nome_autore) dati.nome_autore = proposalForm.nome_autore;
    if (proposalForm.email_autore) dati.email_autore = proposalForm.email_autore;

    const tipo = proposalForm.tipo_proposta === "procedura" ? "nuova_procedura" : "modifica_patologia";
    const target = proposalForm.tipo_proposta === "procedura" ? `${patologia} (proposta procedura)` : patologia;

    setProposalStatus("loading");
    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(`${API_BASE_URL}/admin/suggerimenti`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tipo, target, dati })
      });
      if (res.ok) setProposalStatus("success");
      else { const e = await res.json(); setProposalStatus("error"); console.error("Proposal error:", e); }
    } catch (err) { setProposalStatus("error"); console.error("Proposal catch:", err); }
  };

  return (
    <div style={{
      ...styles.page,
      flexDirection: 'column',
      overflow: 'auto',
      background: colors.bgDeep,
    }}>

      {/* Back button */}
      <div style={{ padding: '16px 32px 0', flexShrink: 0 }}>
        <button style={styles.backButton} onClick={navigateBack}>
          <ArrowLeftIcon /> Torna alla mappa del grafo
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 32px 40px', flex: 1, overflow: 'auto' }}>

        {/* Hero section */}
        <div style={{
          display: 'flex',
          gap: 32,
          marginTop: 12,
          animation: 'slideUp 0.4s ease both',
        }}>

          {/* Left column */}
          <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Image */}
            <div style={{
              borderRadius: 14,
              overflow: 'hidden',
              border: `1px solid ${colors.border}`,
              position: 'relative',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}>
              <img
                src={immagine}
                alt={patologia}
                style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
                background: 'linear-gradient(transparent, rgba(10, 22, 40, 0.9))',
              }} />
              {ambito && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: 'rgba(10, 22, 40, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${colors.border}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: colors.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {ambito}
                </div>
              )}
            </div>

            {/* Info cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Reparto */}
              <div style={localStyles.infoCard}>
                <div style={localStyles.infoCardHeader}>
                  <BuildingIcon />
                  <span>Reparto / Ambito</span>
                </div>
                <p style={{ margin: 0, color: colors.textPrimary, fontWeight: 600, fontSize: 14 }}>{ambito}</p>
              </div>

              {/* Terapia */}
              <div style={localStyles.infoCard}>
                <div style={{ ...localStyles.infoCardHeader, color: '#2dd4bf' }}>
                  <PillIcon />
                  <span>Protocollo Terapeutico</span>
                </div>
                <p style={{ margin: 0, color: '#2dd4bf', fontWeight: 500, fontSize: 13 }}>{terapia}</p>
              </div>
            </div>

            {/* Segni clinici distintivi */}
            {caratteristiche_tipiche && caratteristiche_tipiche.length > 0 && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.1s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.warning }}>
                  <AlertTriangleIcon />
                  <span>Segni Clinici Distintivi</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, color: colors.textSecondary, fontSize: 12.5, lineHeight: 1.7 }}>
                  {caratteristiche_tipiche.map((v, i) => (
                    <li key={i} style={{ marginBottom: 3 }}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Title */}
            <div>
              <h1 style={{
                fontSize: 34,
                fontWeight: 700,
                margin: '0 0 8px 0',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
              }}>
                {patologia}
              </h1>
              <div className="md-content" style={{
                color: colors.textSecondary,
                fontSize: 14,
                lineHeight: 1.7,
                maxWidth: 600,
              }}>
                <ReactMarkdown>{descrizione}</ReactMarkdown>
              </div>
            </div>

            {/* Diagnostic grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              animation: 'slideUp 0.4s ease 0.05s both',
            }}>
              <div style={localStyles.infoCard}>
                <div style={localStyles.infoCardHeader}>
                  <StethoscopeIcon />
                  <span>Iter Diagnostico</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>{diagnosi}</p>
              </div>
              <div style={localStyles.infoCard}>
                <div style={localStyles.infoCardHeader}>
                  <FlaskIcon />
                  <span>Esami / Strumentali</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>{esami_laboratorio}</p>
              </div>
            </div>

            {/* Analisi Collegate */}
            {analisiCollegate.length > 0 && (
              <div style={{ animation: 'slideUp 0.4s ease 0.08s both' }}>
                <h4 style={{ ...localStyles.sectionLabel, color: colors.info }}>
                  <FlaskIcon /> Analisi Consigliate
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {analisiCollegate.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      onClick={() => setSelectedAnalisi(a.nome)}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgHover; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.borderColor = colors.border; }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: a.tipo === 'laboratorio' ? 'rgba(96, 165, 250, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                        color: a.tipo === 'laboratorio' ? '#60a5fa' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                        textTransform: 'uppercase',
                      }}>
                        {a.tipo === 'laboratorio' ? 'LAB' : 'STR'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>
                          {a.nome}
                        </div>
                        {a.descrizione && (
                          <div style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 1.5, marginTop: 2 }}>
                            {a.descrizione}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Procedure Diagnostiche Collegate */}
            {procedureCollegate.length > 0 && (
              <div style={{ animation: 'slideUp 0.4s ease 0.09s both' }}>
                <h4 style={{ ...localStyles.sectionLabel, color: '#8b5cf6' }}>
                  <StethoscopeIcon /> Procedure Diagnostiche Consigliate
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {procedureCollegate.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                        textTransform: 'uppercase',
                      }}>
                        PROC
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, lineHeight: 1.4 }}>
                          {p.nome}
                        </div>
                        {p.descrizione && (
                          <div style={{ color: colors.textMuted, fontSize: 11.5, lineHeight: 1.5, marginTop: 2 }}>
                            {p.descrizione}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          {p.preparazione && (
                            <span style={{ fontSize: 10, color: colors.textMuted, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                              Prep: {p.preparazione}
                            </span>
                          )}
                          {p.tempo_risposta && (
                            <span style={{ fontSize: 10, color: colors.textMuted, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
                              Risposta: {p.tempo_risposta}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Propone Nuova Procedura Diagnostica */}
            <div style={{ marginTop: 4, animation: 'slideUp 0.4s ease 0.095s both' }}>
              <button
                style={{...localStyles.proposeButton, borderColor: '#8b5cf6', color: '#8b5cf6'}}
                onClick={() => { setShowProposalModal(true); setProposalStatus(null); setProposalForm({ terapia: "", diagnosi: "", esami_laboratorio: "", note: "", nome_autore: "", email_autore: "", tipo_proposta: "procedura" }); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.06)'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#8b5cf6'; }}
              >
                <StethoscopeIcon /> Propone Procedura Diagnostica
              </button>
            </div>

            <div style={{ height: 1, background: colors.border, margin: '4px 0' }} />

            {/* Differential Diagnosis */}
            {diagnosi_differenziale && diagnosi_differenziale.length > 0 && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.1s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.warning }}>
                  <AlertTriangleIcon />
                  <span>Diagnosi Differenziale</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {diagnosi_differenziale.map((d, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                        cursor: onNavigateToPathology ? 'pointer' : 'default',
                        transition: 'all 150ms ease',
                      }}
                      onClick={() => onNavigateToPathology && onNavigateToPathology(d)}
                      onMouseEnter={(e) => {
                        if (onNavigateToPathology) {
                          e.currentTarget.style.background = colors.bgHover;
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: colors.warningLight,
                        color: colors.warning,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, flex: 1 }}>
                        {d}
                      </span>
                      {onNavigateToPathology && (
                        <span style={{ color: colors.textMuted }}>
                          <ChevronRightIcon />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sintomi Associati */}
            {sintomi && sintomi.length > 0 && (
              <div style={{ animation: 'slideUp 0.4s ease 0.15s both' }}>
                <h4 style={{ ...localStyles.sectionLabel, color: colors.nodeSintomo }}>
                  Sintomi Associati
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sintomi.map((s, idx) => (
                    <span key={idx} style={badgeStyle(colors.nodeSintomo)}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Fattori di Rischio */}
            {stile_vita && stile_vita.length > 0 && (
              <div style={{ animation: 'slideUp 0.4s ease 0.2s both' }}>
                <h4 style={{ ...localStyles.sectionLabel, color: colors.nodeStileVita }}>
                  Fattori Correlati allo Stile di Vita
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {stile_vita.map((sv, idx) => (
                    <span key={idx} style={badgeStyle(colors.nodeStileVita)}>{sv}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Eta' Target */}
            {eta_target && eta_target.length > 0 && (
              <div style={{ animation: 'slideUp 0.4s ease 0.25s both' }}>
                <h4 style={{ ...localStyles.sectionLabel, color: colors.nodeEta }}>
                  Incidenza Fasce d'Eta'
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {eta_target.map((e, idx) => (
                    <span key={idx} style={badgeStyle(colors.nodeEta)}>{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Prevalenza per Genere */}
            {prevalenza_gender && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.3s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.info }}>
                  <GenderIcon />
                  <span>Prevalenza per Genere</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.6 }}>
                  {prevalenza_gender}
                </p>
              </div>
            )}

            {/* Prevalenza per Eta' */}
            {prevalenza_eta && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.35s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.nodeEta }}>
                  <UsersIcon />
                  <span>Prevalenza per Eta'</span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.6 }}>
                  {prevalenza_eta}
                </p>
              </div>
            )}

            {/* Farmaci */}
            {farmaci && farmaci.length > 0 && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.38s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: '#2dd4bf' }}>
                  <PillIcon />
                  <span>Farmaci indicati</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {farmaci.map((f, idx) => {
                    const dosaggio = dosaggi[f] || dosaggi[f.toLowerCase()] || "";
                    return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: 'rgba(45, 212, 191, 0.12)',
                        color: '#2dd4bf',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, lineHeight: 1.5 }}>
                          {f}
                        </span>
                        {dosaggio && (
                          <div style={{ color: '#2dd4bf', fontSize: 11.5, marginTop: 2, fontWeight: 500 }}>
                            Dosaggio: {dosaggio}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quadro Radiologico */}
            {quadro_radiologico && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.39s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.info }}>
                  <FlaskIcon />
                  <span>Quadro Radiologico</span>
                </div>
                <div className="md-content" style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.6 }}>
                  <ReactMarkdown>{quadro_radiologico}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Anatomia Patologica */}
            {anatomia_patologica && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.395s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.warning }}>
                  <StethoscopeIcon />
                  <span>Anatomia Patologica</span>
                </div>
                <div className="md-content" style={{ margin: 0, fontSize: 12.5, color: colors.textSecondary, lineHeight: 1.6 }}>
                  <ReactMarkdown>{anatomia_patologica}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Linee Guida */}
            {linee_guida && linee_guida.length > 0 && (
              <div style={{ ...localStyles.infoCard, animation: 'slideUp 0.4s ease 0.4s both' }}>
                <div style={{ ...localStyles.infoCardHeader, color: colors.accent }}>
                  <BookIcon />
                  <span>Linee Guida Nazionali / Internazionali</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {linee_guida.map((lg, idx) => (
                    <a
                      key={idx}
                      href={lg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                        textDecoration: 'none',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.bgHover;
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      <span style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: colors.accentLight,
                        color: colors.accent,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: 1,
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 12.5, lineHeight: 1.4 }}>
                          {lg.nome}
                        </div>
                        <div style={{
                          color: colors.accent,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginTop: 4,
                        }}>
                          <ExternalLinkIcon /> Apri link
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Propone Modifica Button */}
            <div style={{ marginTop: 12, animation: 'slideUp 0.4s ease 0.45s both' }}>
              <button
                style={localStyles.proposeButton}
                onClick={() => { setShowProposalModal(true); setProposalStatus(null); setProposalForm({ terapia: "", diagnosi: "", esami_laboratorio: "", note: "", nome_autore: "", email_autore: "", tipo_proposta: "patologia" }); }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = colors.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.accent; }}
              >
                <EditIcon /> Propone Modifica
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Proposal Modal */}
      {showProposalModal && (
        <div style={localStyles.modalBackdrop} onClick={() => setShowProposalModal(false)}>
          <div style={localStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={localStyles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <EditIcon /> Propone Modifica
              </h2>
              <button style={localStyles.modalCloseBtn} onClick={() => setShowProposalModal(false)}>
                &times;
              </button>
            </div>
            <p style={{ margin: '4px 0 16px', color: colors.textSecondary, fontSize: 13 }}>
              Patologia: <strong style={{ color: colors.textPrimary }}>{patologia}</strong>
            </p>

            {proposalStatus === "success" ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ color: '#2dd4bf', fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Proposta inviata con successo!</p>
                <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>Un admin la esaminerà a breve.</p>
                <button
                  style={{ ...localStyles.proposeButton, marginTop: 20, alignSelf: 'center' }}
                  onClick={() => setShowProposalModal(false)}
                >
                  Chiudi
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Terapia */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={localStyles.fieldLabel}>Terapia attuale</label>
                  <textarea readOnly rows={3} style={localStyles.currentValueTextarea}>{terapia}</textarea>
                  <label style={localStyles.fieldLabel}>Nuovo valore (terapia)</label>
                  <textarea
                    rows={3}
                    style={localStyles.newValueTextarea}
                    placeholder="Inserisci la nuova terapia..."
                    value={proposalForm.terapia}
                    onChange={(e) => setProposalForm({ ...proposalForm, terapia: e.target.value })}
                  />
                </div>

                {/* Diagnosi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={localStyles.fieldLabel}>Diagnosi attuale</label>
                  <textarea readOnly rows={3} style={localStyles.currentValueTextarea}>{diagnosi}</textarea>
                  <label style={localStyles.fieldLabel}>Nuovo valore (diagnosi)</label>
                  <textarea
                    rows={3}
                    style={localStyles.newValueTextarea}
                    placeholder="Inserisci la nuova diagnosi..."
                    value={proposalForm.diagnosi}
                    onChange={(e) => setProposalForm({ ...proposalForm, diagnosi: e.target.value })}
                  />
                </div>

                {/* Esami Laboratorio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={localStyles.fieldLabel}>Esami attuali</label>
                  <textarea readOnly rows={3} style={localStyles.currentValueTextarea}>{esami_laboratorio}</textarea>
                  <label style={localStyles.fieldLabel}>Nuovo valore (esami)</label>
                  <textarea
                    rows={3}
                    style={localStyles.newValueTextarea}
                    placeholder="Inserisci i nuovi esami..."
                    value={proposalForm.esami_laboratorio}
                    onChange={(e) => setProposalForm({ ...proposalForm, esami_laboratorio: e.target.value })}
                  />
                </div>

                {/* Descrizione */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={localStyles.fieldLabel}>Descrizione attuale</label>
                  <textarea readOnly rows={3} style={localStyles.currentValueTextarea}>{descrizione}</textarea>
                  <label style={localStyles.fieldLabel}>Nuovo valore (descrizione)</label>
                  <textarea
                    rows={3}
                    style={localStyles.newValueTextarea}
                    placeholder="Inserisci la nuova descrizione..."
                    value={proposalForm.descrizione || ""}
                    onChange={(e) => setProposalForm({ ...proposalForm, descrizione: e.target.value })}
                  />
                </div>

                {/* Note */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={localStyles.fieldLabel}>Spiega la motivazione della modifica *</label>
                  <textarea
                    rows={3}
                    style={localStyles.newValueTextarea}
                    placeholder="Motivazione della proposta..."
                    value={proposalForm.note}
                    onChange={(e) => setProposalForm({ ...proposalForm, note: e.target.value })}
                  />
                </div>

                {/* Guest fields */}
                {!isLoggedIn && (
                  <>
                    <div style={{ height: 1, background: colors.border, margin: '4px 0' }} />
                    <p style={{ margin: 0, color: colors.textMuted, fontSize: 12 }}>
                      Per follow-up della proposta, inserisci i tuoi dati:
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={localStyles.fieldLabel}>Nome *</label>
                        <input
                          type="text"
                          style={localStyles.newValueTextarea}
                          placeholder="Il tuo nome..."
                          value={proposalForm.nome_autore}
                          onChange={(e) => setProposalForm({ ...proposalForm, nome_autore: e.target.value })}
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={localStyles.fieldLabel}>Email *</label>
                        <input
                          type="email"
                          style={localStyles.newValueTextarea}
                          placeholder="La tua email..."
                          value={proposalForm.email_autore}
                          onChange={(e) => setProposalForm({ ...proposalForm, email_autore: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}

                {proposalStatus === "error" && (
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>Errore nell'invio. Riprova.</p>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                  <button
                    style={localStyles.cancelButton}
                    onClick={() => setShowProposalModal(false)}
                  >
                    Annulla
                  </button>
                  <button
                    style={{
                      ...localStyles.submitButton,
                      opacity: proposalStatus === "loading" ? 0.6 : 1,
                      pointerEvents: proposalStatus === "loading" ? 'none' : 'auto',
                    }}
                    onClick={handleSubmitProposal}
                    disabled={proposalStatus === "loading" || !proposalForm.note || (!isLoggedIn && (!proposalForm.nome_autore || !proposalForm.email_autore))}
                  >
                    <SendIcon />
                    {proposalStatus === "loading" ? "Invio..." : "Invia Proposta"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Analysis Detail Modal */}
      {selectedAnalisi && (
        <div style={localStyles.modalBackdrop} onClick={() => { setSelectedAnalisi(null); setAnalisiDetail(null); }}>
          <div style={localStyles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <div style={localStyles.modalHeader}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlaskIcon /> Dettaglio Analisi
              </h2>
              <button style={localStyles.modalCloseBtn} onClick={() => { setSelectedAnalisi(null); setAnalisiDetail(null); }}>
                &times;
              </button>
            </div>
            {analisiDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: '0 0 4px' }}>{analisiDetail.nome}</h3>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: analisiDetail.tipo === 'laboratorio' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)', color: analisiDetail.tipo === 'laboratorio' ? '#3b82f6' : '#8b5cf6' }}>
                    {analisiDetail.tipo === 'laboratorio' ? 'Laboratorio' : analisiDetail.tipo === 'strumentale' ? 'Strumentale' : 'Clinico'}
                  </span>
                </div>
                {analisiDetail.descrizione && (
                  <div style={{ ...localStyles.infoCard }}>
                    <div style={{ ...localStyles.infoCardHeader, color: colors.info }}><FlaskIcon /> <span>Descrizione</span></div>
                    <p style={{ margin: 0, fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>{analisiDetail.descrizione}</p>
                  </div>
                )}
                {analisiDetail.patologie && analisiDetail.patologie.length > 0 && (
                  <div style={{ ...localStyles.infoCard }}>
                    <div style={{ ...localStyles.infoCardHeader }}><span>Patologie Correlate</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {analisiDetail.patologie.map((p, i) => (
                        <span key={i} style={{ padding: '3px 10px', borderRadius: 16, fontSize: 11, fontWeight: 500, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: colors.textMuted, fontSize: 13 }}>Caricamento...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const localStyles = {
  infoCard: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  infoCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.06em',
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.06em',
    marginBottom: 8,
    marginTop: 0,
  },
  proposeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 20px',
    borderRadius: 10,
    border: `1.5px solid ${colors.accent}`,
    background: 'transparent',
    color: colors.accent,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    width: '100%',
    justifyContent: 'center',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modalContainer: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 28,
    maxWidth: 700,
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: colors.textMuted,
    fontSize: 24,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  fieldLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: colors.textMuted,
  },
  currentValueTextarea: {
    width: '100%',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: 'rgba(255, 255, 255, 0.03)',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 1.6,
    padding: 10,
    resize: 'none',
    fontFamily: 'inherit',
  },
  newValueTextarea: {
    width: '100%',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: 'rgba(255, 255, 255, 0.05)',
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 1.6,
    padding: 10,
    resize: 'vertical',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 150ms ease',
  },
  cancelButton: {
    padding: '8px 18px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    borderRadius: 8,
    border: 'none',
    background: colors.accent,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 150ms ease',
  },
};
