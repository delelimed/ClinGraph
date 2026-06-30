// src/components/WelcomeScreen.jsx
import { useState } from "react";
import { styles } from "../styles";

export default function WelcomeScreen({ setScreen, onOpenExplorer }) {
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [showWarningEffect, setShowWarningEffect] = useState(false);

  const handleDiagnosisClick = () => {
    if (hasAcceptedDisclaimer) {
      setScreen("diagnosis");
    } else {
      // Feedback visivo temporaneo se l'utente prova a cliccare senza accettare
      setShowWarningEffect(true);
      setTimeout(() => setShowWarningEffect(false), 500);
    }
  };

  return (
    <div style={styles.centerContainer}>
      <div style={{ ...styles.welcomeBox, maxWidth: 680, padding: "40px 50px" }}>

        {/* HEADER ISTITUZIONALE */}
        <div style={{ marginBottom: 30 }}>
          {/* CORRETTO: Ora punta a medicalStyles anziché mutare l'import costanti */}
          <span style={medicalStyles.medicalBadge}>Clinical Decision Support System (CDSS)</span>
          <h1 style={{ fontSize: 38, marginTop: 10, letterSpacing: "-0.5px" }}>
            🧠 ClinGraph <span style={{ fontSize: 16, color: "#64748b", fontWeight: "normal" }}>v1.0.0</span>
          </h1>
          <p style={{ color: "#94a3b8", fontSize: 16, marginTop: 8, lineHeight: "1.5" }}>
            Piattaforma sperimentale di supporto decisionale clinico basata sulla teoria dei grafi per la correlazione sintomatologica.
          </p>
        </div>

        {/* MEDICAL DISCLAIMER PANEL */}
        <div style={{
          ...medicalStyles.disclaimerBox,
          borderColor: showWarningEffect ? "#ef4444" : "#334155",
          transform: showWarningEffect ? "scale(1.01)" : "scale(1)",
          transition: "all 0.2s ease"
        }}>
          <div style={medicalStyles.disclaimerHeader}>
            ⚠️ AVVISO IMPORTANTE E NOTE LEGALI
          </div>
          <p style={medicalStyles.disclaimerText}>
            L'attività diagnostica e la valutazione dei quadri clinici sono processi complessi che richiedono competenze professionali e anni di formazione accademica specialistica. Questo software è una <strong>risorsa puramente sperimentale, didattica ed accademica</strong>.
          </p>
          <p style={medicalStyles.disclaimerText}>
            Le informazioni, le correlazioni strutturali e i grafi generati dal sistema <strong>non costituiscono un parere medico, una diagnosi formale, né una prescrizione terapeutica</strong>. In presenza di sintomi o quesiti clinici, è tassativo rivolgersi tempestivamente al proprio medico curante o alle strutture sanitarie competenti. Non sostituire mai il consulto medico professionale con i dati forniti da strumenti automatizzati.
          </p>

          {/* CHECKBOX DI VERIFICA */}
          <label style={medicalStyles.checkboxContainer}>
            <input
              type="checkbox"
              checked={hasAcceptedDisclaimer}
              onChange={(e) => setHasAcceptedDisclaimer(e.target.checked)}
              style={medicalStyles.checkbox}
            />
            <span style={{ color: hasAcceptedDisclaimer ? "#f8fafc" : "#94a3b8" }}>
              Dichiaro di han compreso la natura sperimentale del software e i limiti clinici sopra descritti.
            </span>
          </label>
        </div>

        {/* AZIONI DI NAVIGAZIONE */}
        <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
          <button
            style={{
              ...styles.buttonPrimary,
              opacity: hasAcceptedDisclaimer ? 1 : 0.4,
              cursor: hasAcceptedDisclaimer ? "pointer" : "not-allowed",
              boxShadow: hasAcceptedDisclaimer ? "0 4px 12px rgba(6, 182, 212, 0.2)" : "none"
            }}
            onClick={handleDiagnosisClick}
            disabled={!hasAcceptedDisclaimer}
          >
            🩺 Accedi al Modulo Diagnostico
          </button>

          <button style={styles.buttonSecondary} onClick={onOpenExplorer}>
            🌐 Consultazione Libera del Grafo
          </button>
        </div>

      </div>
    </div>
  );
}

// ------------------------------------------
// STILI INTERNI COERENTI
// ------------------------------------------
const medicalStyles = {
  medicalBadge: {
    background: "rgba(99, 102, 241, 0.15)",
    color: "#818cf8",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "inline-block"
  },
  disclaimerBox: {
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 20,
    textAlign: "left",
    marginBottom: 30,
  },
  disclaimerHeader: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: 12,
  },
  disclaimerText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: "1.6",
    marginBottom: 10,
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 15,
    paddingTop: 15,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    marginTop: 3,
    cursor: "pointer",
    accentColor: "#06b6d4"
  }
};