// src/components/DiagnosisScreen.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { styles, colors } from "../styles";

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default function DiagnosisScreen({
  setScreen,
  sintomi,
  setSintomi,
  risultati,
  avviaDiagnosi,
  graph,
  handleNodeClick,
}) {
  const [eta, setEta] = useState("");
  const [sesso, setSesso] = useState("");
  const [stileVita, setStileVita] = useState({
    fumo: false,
    alcol: false,
    sedentarieta: false,
    ipertensione: false,
  });
  const [currentSintomo, setCurrentSintomo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dbSintomi, setDbSintomi] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch symptoms from database
  useEffect(() => {
    const fetchSintomi = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/sintomi`);
        const data = await res.json();
        setDbSintomi(data.sintomi || []);
      } catch (e) {
        console.error("Errore caricamento sintomi:", e);
      }
    };
    fetchSintomi();
  }, []);

  const listaSintomi = sintomi ? sintomi.split(",").map(s => s.trim()).filter(Boolean) : [];

  // Filter suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!currentSintomo.trim() || currentSintomo.length < 2) return [];
    const term = currentSintomo.toLowerCase().trim();
    const alreadyAdded = listaSintomi.map(s => s.toLowerCase());
    return dbSintomi
      .filter(s => s && s.nome && s.nome.toLowerCase().includes(term) && !alreadyAdded.includes(s.nome.toLowerCase()))
      .slice(0, 8);
  }, [currentSintomo, dbSintomi, listaSintomi]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!graph || !graph.nodes || !graph.links) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ color: colors.textSecondary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SpinnerIcon /> Aggiornamento rete diagnostica...
        </div>
      </div>
    );
  }

  const maxScore = risultati.length > 0 ? Math.max(...risultati.map(r => r.score)) : 1;

  const aggiungiSintomo = (e) => {
    if (e) e.preventDefault();
    if (!currentSintomo.trim()) return;
    const nuovoSintomo = currentSintomo.trim();
    if (!listaSintomi.includes(nuovoSintomo)) {
      const nuovaStringaSintomi = sintomi ? `${sintomi}, ${nuovoSintomo}` : nuovoSintomo;
      setSintomi(nuovaStringaSintomi);
    }
    setCurrentSintomo("");
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const selectSuggestion = (nome) => {
    if (!listaSintomi.includes(nome)) {
      const nuovaStringaSintomi = sintomi ? `${sintomi}, ${nome}` : nome;
      setSintomi(nuovaStringaSintomi);
    }
    setCurrentSintomo("");
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const rimuoviSintomo = (sintomoDaRimuovere) => {
    const nuovaLista = listaSintomi.filter(s => s !== sintomoDaRimuovere);
    setSintomi(nuovaLista.join(", "));
  };

  const handleCheckboxChange = (campo) => {
    setStileVita(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  const handleElabora = async () => {
    setIsLoading(true);
    await avviaDiagnosi();
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    setCurrentSintomo(e.target.value);
    setShowDropdown(e.target.value.length >= 2);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        selectSuggestion(filteredSuggestions[selectedIndex].nome);
      } else {
        aggiungiSintomo(e);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div style={styles.page}>

      {/* LEFT PANEL */}
      <div style={styles.left}>
        <button style={styles.backButton} onClick={() => setScreen("welcome")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Home
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Modulo Diagnostico
        </h2>
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          Inserisci i sintomi del paziente e i dati di anamnesi per calcolare le correlazioni patologiche.
        </p>

        {/* Anamnesi Demografica */}
        <div style={{ ...localStyles.boxForm, animation: 'slideUp 0.4s ease 0.05s both' }}>
          <div style={styles.sectionTitle}>
            <UserIcon /> Anamnesi Demografica
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <select
              style={{ ...localStyles.select, flex: 1 }}
              value={eta}
              onChange={(e) => setEta(e.target.value)}
            >
              <option value="">Fascia Eta'</option>
              <option value="neonato">Neonato (0-2 anni)</option>
              <option value="pediatrico">Pediatrico (3-14 anni)</option>
              <option value="adulto">Adulto (15-65 anni)</option>
              <option value="anziano">Anziano (65+ anni)</option>
            </select>
            <select
              style={{ ...localStyles.select, flex: 1 }}
              value={sesso}
              onChange={(e) => setSesso(e.target.value)}
            >
              <option value="">Sesso</option>
              <option value="M">Maschio</option>
              <option value="F">Femmina</option>
            </select>
          </div>
        </div>

        {/* Stile di Vita */}
        <div style={{ ...localStyles.boxForm, animation: 'slideUp 0.4s ease 0.1s both' }}>
          <div style={styles.sectionTitle}>
            <AlertIcon /> Fattori di Rischio
          </div>
          <div style={localStyles.checkboxGrid}>
            {[
              { key: 'fumo', label: 'Fumatore' },
              { key: 'alcol', label: 'Consumo Alcol' },
              { key: 'sedentarieta', label: "Sedentarieta'" },
              { key: 'ipertensione', label: 'Iperteso' },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{
                  ...localStyles.checkboxLabel,
                  background: stileVita[key] ? colors.accentLight : 'transparent',
                  borderColor: stileVita[key] ? colors.borderActive : colors.border,
                }}
                onClick={() => handleCheckboxChange(key)}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: `1.5px solid ${stileVita[key] ? colors.accent : colors.textMuted}`,
                  background: stileVita[key] ? colors.accent : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 150ms ease',
                  flexShrink: 0,
                }}>
                  {stileVita[key] && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Input Sintomi with Autocomplete */}
        <div style={{ ...localStyles.boxForm, animation: 'slideUp 0.4s ease 0.15s both' }}>
          <div style={styles.sectionTitle}>
            <SearchIcon /> Sintomatologia Obiettiva
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, position: 'relative' }} ref={dropdownRef}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Inizia a scrivere per cercare..."
                style={{
                  ...localStyles.input,
                  paddingLeft: 32,
                  borderColor: showDropdown && filteredSuggestions.length > 0 ? colors.borderActive : undefined,
                  boxShadow: showDropdown && filteredSuggestions.length > 0 ? `0 0 0 3px ${colors.accentLight}` : undefined,
                }}
                value={currentSintomo}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (currentSintomo.length >= 2) setShowDropdown(true);
                }}
              />
              <div style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.textMuted,
                pointerEvents: 'none',
              }}>
                <SearchIcon />
              </div>

              {/* Autocomplete Dropdown */}
              {showDropdown && filteredSuggestions.length > 0 && (
                <div style={localStyles.dropdown}>
                  {filteredSuggestions.map((item, idx) => (
                    <div
                      key={item.nome}
                      style={{
                        ...localStyles.dropdownItem,
                        background: idx === selectedIndex ? colors.bgHover : 'transparent',
                        borderLeft: idx === selectedIndex ? `2px solid ${colors.accent}` : '2px solid transparent',
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => selectSuggestion(item.nome)}
                    >
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: item.tipo === 'sintomo' ? colors.nodeSintomo : colors.nodeStileVita,
                        flexShrink: 0,
                      }} />
                      <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 12.5, flex: 1 }}>
                        {item.nome}
                      </span>
                      <span style={{
                        fontSize: 9,
                        color: item.tipo === 'sintomo' ? colors.nodeSintomo : colors.nodeStileVita,
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                      }}>
                        {item.tipo === 'sintomo' ? 'sintomo' : 'rischio'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message */}
              {showDropdown && currentSintomo.length >= 2 && filteredSuggestions.length === 0 && (
                <div style={localStyles.dropdown}>
                  <div style={{ padding: '12px 14px', fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
                    Nessun sintomo trovato. Premi Invio per inserirlo manualmente.
                  </div>
                </div>
              )}
            </div>
            <button
              style={localStyles.addButton}
              onClick={aggiungiSintomo}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.accent;
                e.currentTarget.style.borderColor = colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <PlusIcon />
            </button>
          </div>

          {/* Tag Sintomi */}
          <div style={localStyles.tagContainer}>
            {listaSintomi.length > 0 ? (
              listaSintomi.map((s, idx) => (
                <span key={idx} style={localStyles.symptomTag}>
                  {s}
                  <button
                    style={localStyles.removeTagButton}
                    onClick={() => rimuoviSintomo(s)}
                    onMouseEnter={(e) => { e.currentTarget.style.color = colors.danger; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = colors.accent; }}
                  >
                    x
                  </button>
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: colors.textMuted, padding: '4px 0' }}>
                Nessun sintomo aggiunto.
              </span>
            )}
          </div>
        </div>

        {/* Bottone Elabora */}
        <button
          style={{
            ...styles.buttonPrimary,
            width: "100%",
            marginTop: 4,
            marginBottom: 20,
            opacity: listaSintomi.length === 0 || isLoading ? 0.5 : 1,
            cursor: listaSintomi.length === 0 || isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          onClick={handleElabora}
          disabled={listaSintomi.length === 0 || isLoading}
        >
          {isLoading ? <SpinnerIcon /> : null}
          {isLoading ? 'Elaborazione...' : 'Elabora Diagnosi Differenziale'}
        </button>

        {/* Risultati */}
        {risultati.length > 0 && (
          <div style={{ animation: 'slideUp 0.3s ease both' }}>
            <div style={{
              ...styles.sectionTitle,
              marginBottom: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Patologie Correlate</span>
              <span style={{
                background: colors.accentLight,
                color: colors.accent,
                padding: '2px 8px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                {risultati.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {risultati.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    ...localStyles.resultCard,
                    animationDelay: `${idx * 50}ms`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.bgElevated;
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.bgSurface;
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: colors.textPrimary, fontSize: 13 }}>
                        {r.patologia}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                        {r.score} corrispondenz{r.score === 1 ? 'a' : 'e'}
                      </div>
                    </div>
                    <button
                      style={localStyles.detailButton}
                      onClick={() => handleNodeClick({ id: r.patologia, type: "patologia" })}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.accent;
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = colors.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = colors.accent;
                        e.currentTarget.style.borderColor = colors.borderActive;
                      }}
                    >
                      Dettagli
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                  {/* Progress bar */}
                  <div style={localStyles.progressTrack}>
                    <div style={{
                      ...localStyles.progressFill,
                      width: `${Math.min((r.score / maxScore) * 100, 100)}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Graph */}
      <div style={styles.right}>
        {/* Stats bar */}
        <div style={localStyles.statsBar}>
          <span>Nodi: <strong style={{ color: colors.textPrimary }}>{graph.nodes.length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Links: <strong style={{ color: colors.textPrimary }}>{graph.links.length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Patologie: <strong style={{ color: colors.nodePatologia }}>{graph.nodes.filter(n => n.type === 'patologia').length}</strong></span>
        </div>

        <ForceGraph2D
          graphData={graph}
          nodeColor={(node) => node.color}
          nodeRelSize={5}
          nodeVal={(node) => (node.type === "patologia" ? 2.5 : 0.8)}
          linkWidth={1}
          linkColor={() => "rgba(255, 255, 255, 0.5)"}
          linkLabel={(link) => `<span style="color:#fff; background:${colors.bgSurface}; padding:6px 10px; border-radius:6px; font-size:11px; border:1px solid ${colors.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.3)">${link.relazione || "COLLEGAMENTO"}</span>`}
          nodeLabel={(node) => `<span style="color:${colors.textPrimary}; background:${colors.bgSurface}; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid ${colors.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.3)">${node.id} <span style="color:${colors.textMuted}; font-weight:400; font-size:10px">${node.type.toUpperCase()}</span></span>`}
          onNodeClick={(node) => handleNodeClick(node)}
          onNodeHover={(node) => {
            document.body.style.cursor = node ? 'pointer' : 'default';
          }}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const localStyles = {
  boxForm: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  select: {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bgDeep,
    color: colors.textPrimary,
    fontSize: 12.5,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%234b5e74' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: 28,
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bgDeep,
    color: colors.textPrimary,
    fontSize: 12.5,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.accent,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
    flexShrink: 0,
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: '8px 10px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    fontSize: 12,
    color: colors.textSecondary,
    cursor: "pointer",
    transition: 'all 150ms ease',
    userSelect: 'none',
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    background: colors.bgDeep,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    minHeight: 40,
  },
  symptomTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: colors.accentLight,
    border: `1px solid ${colors.borderActive}`,
    color: '#2dd4bf',
    padding: "4px 10px",
    borderRadius: 16,
    fontSize: 11.5,
    fontWeight: 500,
  },
  removeTagButton: {
    background: "none",
    border: "none",
    color: colors.accent,
    cursor: "pointer",
    fontSize: 13,
    padding: 0,
    lineHeight: 1,
    fontWeight: "bold",
    transition: 'color 150ms ease',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    zIndex: 100,
    maxHeight: 240,
    overflow: 'auto',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'all 100ms ease',
    gap: 10,
    borderBottom: `1px solid ${colors.border}`,
  },
  resultCard: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: 12,
    animation: 'slideUp 0.3s ease both',
    transition: 'all 150ms ease',
  },
  detailButton: {
    background: 'transparent',
    border: `1px solid ${colors.borderActive}`,
    color: colors.accent,
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    background: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    background: `linear-gradient(90deg, ${colors.accent}, #2dd4bf)`,
    transition: 'width 600ms ease',
  },
  statsBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    background: 'rgba(10, 22, 40, 0.85)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 11,
    color: colors.textSecondary,
    zIndex: 10,
    fontWeight: 500,
  },
};
