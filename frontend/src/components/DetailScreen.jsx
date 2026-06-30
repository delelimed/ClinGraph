// src/components/DetailScreen.jsx
import { styles } from "../styles";

export default function DetailScreen({ selectedPathology, navigateBack }) {
  if (!selectedPathology) return null;

  // Estraiamo tutti i campi passati dal backend
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
    esami_laboratorio
  } = selectedPathology;

  return (
    <div style={{ ...styles.page, padding: "40px", overflowY: "auto", color: "#f8fafc" }}>

      <button style={{ ...styles.backButton, marginBottom: "20px" }} onClick={navigateBack}>
        ← Torna alla mappa del grafo
      </button>

      <div style={{ display: "flex", gap: "40px", marginTop: "10px" }}>

        {/* COLONNA SINISTRA: FOTO E METADATI CLINICI ORIGINALI (CSV) */}
        <div style={{ width: "40%", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Immagine */}
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b" }}>
            <img
              src={immagine}
              alt={patologia}
              style={{ width: "100%", height: "240px", objectFit: "cover" }}
            />
          </div>

          {/* BOX DATI REPARTO E TERAPIA (Dal tuo CSV) */}
          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Reparto / Ambito</span>
              <p style={{ margin: "2px 0 0 0", color: "#f8fafc", fontWeight: "600" }}>🏢 {ambito}</p>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "bold" }}>Protocollo Terapeutico</span>
              <p style={{ margin: "2px 0 0 0", color: "#34d399", fontWeight: "500" }}>💊 {terapia}</p>
            </div>
          </div>

          {/* Caratteristiche tipiche (Dal tuo JSON) */}
          <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
            <h4 style={{ color: "#818cf8", fontSize: "12px", textTransform: "uppercase", margin: "0 0 10px 0" }}>
              🚩 Segni Clinici Distintivi
            </h4>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#cbd5e1", fontSize: "13px", lineHeight: "1.6" }}>
              {(caratteristiche_tipiche || []).map((v, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{v}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* COLONNA DESTRA: DESCRIZIONE, PROTOCOLLO DIAGNOSTICO E GRAFO */}
        <div style={{ width: "60%" }}>
          <h1 style={{ fontSize: "38px", margin: "0 0 10px 0", letterSpacing: "-0.5px" }}>
            {patologia}
          </h1>

          <p style={{ color: "#94a3b8", fontSize: "15px", lineHeight: "1.7", marginBottom: "25px" }}>
            {descrizione}
          </p>

          {/* SEZIONE INFORMAZIONI DIAGNOSTICHE (Dal tuo CSV) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", background: "rgba(30, 41, 59, 0.2)", padding: "18px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.04)", marginBottom: "25px" }}>
            <div>
              <h5 style={{ margin: "0 0 4px 0", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>🔍 Iter Diagnostico</h5>
              <p style={{ margin: 0, fontSize: "14px", color: "#e2e8f0" }}>{diagnosi}</p>
            </div>
            <div>
              <h5 style={{ margin: "0 0 4px 0", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>🧪 Esami di Laboratorio / Strumentali</h5>
              <p style={{ margin: 0, fontSize: "14px", color: "#e2e8f0" }}>{esami_laboratorio}</p>
            </div>
          </div>

          <hr style={{ borderColor: "rgba(255,255,255,0.06)", marginBottom: "25px" }} />

          {/* MAPPA DEI COLLEGAMENTI DEL GRAFO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Sintomi */}
            <div>
              <h4 style={{ color: "#06b6d4", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>🩺 Sintomi Associati</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {(sintomi || []).map((s, idx) => (
                  <span key={idx} style={badgeStyle("#06b6d4")}>{s}</span>
                ))}
              </div>
            </div>

            {/* Stile di Vita */}
            {stile_vita && stile_vita.length > 0 && (
              <div>
                <h4 style={{ color: "#eab308", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>⚠️ Fattori Correlati allo Stile di Vita</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {stile_vita.map((sv, idx) => (
                    <span key={idx} style={badgeStyle("#eab308")}>{sv}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Età Target */}
            {eta_target && eta_target.length > 0 && (
              <div>
                <h4 style={{ color: "#a855f7", fontSize: "12px", textTransform: "uppercase", marginBottom: "8px" }}>👥 Incidenza Fasce d'Età</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {eta_target.map((e, idx) => (
                    <span key={idx} style={badgeStyle("#a855f7")}>{e}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

const badgeStyle = (color) => ({
  background: `${color}10`,
  border: `1px solid ${color}35`,
  color: color,
  padding: "5px 12px",
  borderRadius: "20px",
  fontSize: "12px",
  fontWeight: "500"
});