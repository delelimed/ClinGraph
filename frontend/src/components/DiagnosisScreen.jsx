// src/components/DiagnosisScreen.jsx
import { useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { styles } from "../styles";

export default function DiagnosisScreen({
  setScreen,
  sintomi, 
  setSintomi,
  risultati,
  avviaDiagnosi, 
  graph,
  handleNodeClick,
}) {
  // Stati locali per i dati demografici e lo stile di vita
  const [eta, setEta] = useState("");
  const [sesso, setSesso] = useState("");
  const [stileVita, setStileVita] = useState({
    fumo: false,
    alcol: false,
    sedentarieta: false,
    ipertensione: false,
  });

  // Stato per gestire l'input testuale del singolo sintomo corrente
  const [currentSintomo, setCurrentSintomo] = useState("");

  // Protezione di sicurezza contro la schermata bianca (se il grafo non è ancora pronto o è nullo)
  if (!graph || !graph.nodes || !graph.links) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ color: "white", fontSize: 16 }}>
          🔄 Aggiornamento e sincronizzazione della rete diagnostica...
        </div>
      </div>
    );
  }

  // Estraiamo la lista dei sintomi correnti formattati per i tag visivi
  const listaSintomi = sintomi ? sintomi.split(",").map(s => s.trim()).filter(Boolean) : [];

  // Aggiunge un sintomo alla lista centralizzata
  const aggiungiSintomo = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      if (!currentSintomo.trim()) return;
      
      const nuovoSintomo = currentSintomo.trim();
      if (!listaSintomi.includes(nuovoSintomo)) {
        const nuovaStringaSintomi = sintomi ? `${sintomi}, ${nuovoSintomo}` : nuovoSintomo;
        setSintomi(nuovaStringaSintomi);
      }
      setCurrentSintomo("");
    }
  };

  const rimuoviSintomo = (sintomoDaRimuovere) => {
    const nuovaLista = listaSintomi.filter(s => s !== sintomoDaRimuovere);
    setSintomi(nuovaLista.join(", "));
  };

  const handleCheckboxChange = (campo) => {
    setStileVita(prev => ({ ...prev, [campo]: !prev[campo] }));
  };

  return (
    <div style={styles.page}>
      
      {/* 1. PANNELLO LATERALE SINISTRO: INPUT CLINICI */}
      <div style={styles.left}>
        <button style={styles.backButton} onClick={() => setScreen("welcome")}>
          ← Torna alla Home
        </button>

        <h2 style={{ fontSize: 20, margin: "10px 0 5px 0" }}>Modulo Diagnostico</h2>
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>
          Inserisci i sintomi del paziente e i dati di anamnesi per calcolare le correlazioni patologiche.
        </p>

        {/* ANAMNESI DEMOGRAFICA */}
        <div style={localStyles.boxForm}>
          <div style={styles.sectionTitle}>Anamnesi Demografica</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select 
              style={{ ...styles.input, margin: 0, flex: 1 }} 
              value={eta} 
              onChange={(e) => setEta(e.target.value)}
            >
              <option value="">Fascia Età</option>
              <option value="neonato">Neonato (0-2 anni)</option>
              <option value="pediatrico">Pediatrico (3-14 anni)</option>
              <option value="adulto">Adulto (15-65 anni)</option>
              <option value="anziano">Anziano (65+ anni)</option>
            </select>
            <select 
              style={{ ...styles.input, margin: 0, flex: 1 }}
              value={sesso}
              onChange={(e) => setSesso(e.target.value)}
            >
              <option value="">Sesso</option>
              <option value="M">Maschio</option>
              <option value="F">Femmina</option>
            </select>
          </div>
        </div>

        {/* STILE DI VITA E COMORBILITÀ */}
        <div style={localStyles.boxForm}>
          <div style={styles.sectionTitle}>Fattori di Rischio / Stile Vita</div>
          <div style={localStyles.checkboxGrid}>
            <label style={localStyles.checkboxLabel}>
              <input type="checkbox" checked={stileVita.fumo} onChange={() => handleCheckboxChange("fumo")} style={localStyles.checkbox} /> Fumatore
            </label>
            <label style={localStyles.checkboxLabel}>
              <input type="checkbox" checked={stileVita.alcol} onChange={() => handleCheckboxChange("alcol")} style={localStyles.checkbox} /> Consumo Alcol
            </label>
            <label style={localStyles.checkboxLabel}>
              <input type="checkbox" checked={stileVita.sedentarieta} onChange={() => handleCheckboxChange("sedentarieta")} style={localStyles.checkbox} /> Sedentarietà
            </label>
            <label style={localStyles.checkboxLabel}>
              <input type="checkbox" checked={stileVita.ipertensione} onChange={() => handleCheckboxChange("ipertensione")} style={localStyles.checkbox} /> Iperteso
            </label>
          </div>
        </div>

        {/* INPUT SINTOMI */}
        <div style={localStyles.boxForm}>
          <div style={styles.sectionTitle}>Sintomatologia Obiettiva</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Es. tosse, febbre alta, dispnea..."
              style={{ ...styles.input, margin: 0 }}
              value={currentSintomo}
              onChange={(e) => setCurrentSintomo(e.target.value)}
              onKeyDown={aggiungiSintomo}
            />
            <button style={{ ...styles.buttonPrimary, padding: "0 16px" }} onClick={aggiungiSintomo}>
              +
            </button>
          </div>

          {/* TAG DEI SINTOMI INSERITI */}
          <div style={localStyles.tagContainer}>
            {listaSintomi.length > 0 ? (
              listaSintomi.map((s, idx) => (
                <span key={idx} style={localStyles.symptomTag}>
                  {s}
                  <button style={localStyles.removeTagButton} onClick={() => rimuoviSintomo(s)}>×</button>
                </span>
              ))
            ) : (
              <span style={{ fontSize: 12, color: "#475569", alignSelf: "center" }}>Nessun sintomo aggiunto.</span>
            )}
          </div>
        </div>

        {/* PULSANTE AVVIO CALCOLO GRAFO */}
        <button 
          style={{ ...styles.buttonPrimary, width: "100%", marginTop: 5, marginBottom: 25 }}
          onClick={avviaDiagnosi}
          disabled={listaSintomi.length === 0}
        >
          🔍 Elabora Diagnosi Differenziale
        </button>

        {/* RISULTATI DELLE CORRISPONDENZE CLINICHE */}
        {risultati.length > 0 && (
          <div>
            <div style={{ ...styles.sectionTitle, marginBottom: 12 }}>Patologie Correlate Rilevate</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {risultati.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(30, 41, 59, 0.25)",
                    border: "1px solid #1e293b",
                    borderRadius: 8,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold", color: "white", fontSize: 14 }}>
                      {r.patologia}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                      Corrispondenze sintomatiche: {r.score}
                    </div>
                  </div>
                  <button
                    style={{
                      background: "rgba(6, 182, 212, 0.1)",
                      border: "1px solid rgba(6, 182, 212, 0.3)",
                      color: "#22d3ee",
                      padding: "5px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                    onClick={() => handleNodeClick({ id: r.patologia, type: "patologia" })}
                  >
                    Dettagli →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. AREA DESTRA: RETE NEURALE / GRAFO SUBSET FILTRATO */}
      <div style={styles.right}>
        <ForceGraph2D
          graphData={graph}
          nodeColor={(node) => node.color}
          nodeRelSize={7}
          nodeVal={(node) => (node.type === "patologia" ? 3 : 1)}
          linkWidth={1.5}
          linkColor={() => "rgba(255, 255, 255, 0.15)"}
          linkLabel={(link) => `<span style="color:#cbd5e1; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; border:1px solid #334155">${link.relazione || "COLLEGAMENTO"}</span>`}
          nodeLabel={(node) => `<span style="color:white; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; border:1px solid #334155">${node.id} (${node.type.toUpperCase()})</span>`}
          onNodeClick={(node) => handleNodeClick(node)}
        />
      </div>

    </div>
  );
}

// -----------------------------------------------------
// STILI INTERNI SPECIFICI PER L'INTERFACCIA DIAGNOSTICA
// -----------------------------------------------------
const localStyles = {
  boxForm: {
    background: "rgba(30, 41, 59, 0.3)",
    border: "1px solid #1e293b",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  checkboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: "#cbd5e1",
    cursor: "pointer",
  },
  checkbox: {
    accentColor: "#06b6d4",
    cursor: "pointer",
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    padding: 10,
    background: "#070a12",
    border: "1px solid #1e293b",
    borderRadius: 6,
    minHeight: "40px",
  },
  symptomTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "rgba(6, 182, 212, 0.15)",
    border: "1px solid rgba(6, 182, 212, 0.3)",
    color: "#22d3ee",
    padding: "3px 8px",
    borderRadius: 12,
    fontSize: 12,
    textTransform: "lowercase",
  },
  removeTagButton: {
    background: "none",
    border: "none",
    color: "#06b6d4",
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
    lineHeight: "10px",
    fontWeight: "bold",
  }
};