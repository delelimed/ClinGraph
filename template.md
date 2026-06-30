---
# ============================================================
# TEMPLATE PATOLOGIA - ClinGraph
# ============================================================
# Copia in backend/data/patologie/{ambito}/ e rinomina
# ============================================================

nome: "Nome della Patologia"
ambito: "Cardiologia"

# --- Terapia ---
terapia: "Protocollo terapeutico di prima linea"

# --- Farmaci (elenco puntato) ---
farmaci:
  - "Nome Farmaco - dosaggio - frequenza"
  - "Nome Farmaco 2 - dosaggio"

# --- Diagnosi ---
diagnosi: "Iter diagnostico completo"
esami_laboratorio: "Esami di laboratorio raccomandati"

# --- Sintomi ---
sintomi:
  - "sintomo 1"
  - "sintomo 2"

# --- Fattori di rischio ---
fattori_rischio:
  - "fattore 1"
  - "fattore 2"

# --- Fascia d'eta' target ---
eta_target:
  - "adulti (18-65 anni)"

# --- Diagnosi differenziale ---
diagnosi_differenziale:
  - "Patologia 1"
  - "Patologia 2"

# --- Prevalenza ---
prevalenza_gender: "Descrizione prevalenza per genere"
prevalenza_eta: "Descrizione prevalenza per eta'"

# --- Quadro radiologico ---
quadro_radiologico: |
  Descrizione del tipico reperto radiologico.
  - Esame principale: TC / RMN / RX / Ecografia
  - Reperto cardinale
  - Reperti associati

# --- Anatomia patologica ---
anatomia_patologica: |
  Descrizione del reperto istologico/macroscopico.
  - Aspetto macroscopico
  - Reperto istologico
  - Marker immunoistochimici (se pertinenti)

# --- Linee guida ---
linee_guida:
  - nome: "Nome Linea Guida"
    url: "https://..."

# --- Immagine ---
immagine: "https://images.unsplash.com/photo-XXXXX?w=500"

---

# Nome della Patologia

Descrizione clinica in formato Markdown.
