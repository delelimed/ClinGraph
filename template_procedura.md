---
# ============================================================
# TEMPLATE PROCEDURA DIAGNOSTICA - ClinGraph
# ============================================================
# Copia in backend/data/procedure_diagnostiche/{ambito}/
# e rinomina con nome della procedura (es. tac_torace.md)
# ============================================================

nome: "Nome della Procedura"
ambito: "Cardiologia"

# --- Descrizione generale ---
descrizione: |
  Breve descrizione della procedura diagnostica,
  a cosa serve e quando viene utilizzata.

# --- Preparazione del paziente ---
preparazione: |
  - Digiuno: si/no (da quanto)
  - Sospensione farmaci: quali e quando
  - Consenso informato: si/no
  - Altro

# --- Esecuzione della procedura ---
esecuzione: |
  Descrizione passo-passo della procedura.
  - Posizionamento del paziente
  - Tecnica esecutiva
  - Tempistica
  - Critici di sicurezza

# --- Interpretazione dei risultati ---
interpretazione: |
  Come si interpretano i risultati.
  - Parametri normali
  - Criteri di positivita'
  - Reperti patologici tipici
  - Artefatti comuni

# --- Tempi di risposta ---
tempo_risposta: "Es. 24-48h per referto, urgenza 2h"

# --- Costo stimato ---
costo_stimato: "Es. 200-500 EUR (SSN), variabile (privato)"

# --- Patologie correlate ---
patologie_correlate:
  - "Patologia 1"
  - "Patologia 2"

# --- Linee guida ---
linee_guida:
  - nome: "Nome Linea Guida"
    url: "https://..."

---

# Nome della Procedura

Descrizione dettagliata in formato Markdown della procedura diagnostica.
Include informazioni cliniche aggiuntive, note pratiche, e riferimenti utili.
