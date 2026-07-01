---
# ============================================================
# TEMPLATE PATOLOGIA - ClinGraph
# ============================================================
# Copia in backend/data/patologie/{ambito}/ e rinomina
# es. polmonite_batterica.md
# ============================================================

# --- Identificazione ---
nome: "Nome della Patologia"
ambito: "Cardiologia"
# Ambiti disponibili: Cardiologia, Pneumologia, Gastroenterologia,
# Endocrinologia, Neurologia, Ortopedia, Dermatologia, Urologia,
# Ginecologia, Oncologia, Nefrologia, Reumatologia, Medicina Interna,
# Geriatria, Pediatria, Ematologia, Malattie Infettive, Psichiatria,
# Oftalmologia, Otorinolaringoiatria, Chirurgia Generale

# --- Descrizione (Markdown, nel body del file) ---
# Viene visualizzata nella scheda dettaglio come testo principale.

# --- Terapia ---
terapia: |
  Protocollo terapeutico di prima linea.
  - Linea 1: farmaco X dosaggio Y
  - Linea 2: farmaco A dosaggio B
  - Alternativa: farmaco Z

# --- Farmaci (elenco puntato) ---
farmaci:
  - "Nome Farmaco - dosaggio - frequenza - via di somministrazione"
  - "Nome Farmaco 2 - dosaggio - durata"

# --- Dosaggi (mappa chiave-valore, usata nella scheda farmaci) ---
dosaggi:
  Farmaco1: "dosaggio completo"
  Farmaco2: "dosaggio completo"

# --- Diagnosi (iter diagnostico) ---
diagnosi: |
  1. Sospetto clinico
  2. Esami di primo livello
  3. Esami di secondo livello
  4. Conferma diagnostica

# --- Esami di laboratorio ---
esami_laboratorio: |
  - Emocromo completo
  - Funzionalita' renale (creatinina, BUN)
  - Prove di funzionalita' epatica
  - marker specifici

# --- Sintomi (almeno 10-15 per patologia) ---
sintomi:
  - "sintomo 1"
  - "sintomo 2"
  - "sintomo 3"
  - "sintomo 4"
  - "sintomo 5"
  - "sintomo 6"
  - "sintomo 7"
  - "sintomo 8"
  - "sintomo 9"
  - "sintomo 10"

# --- Fattori di rischio (stile di vita, ambientali, ecc.) ---
fattori_rischio:
  - "fattore 1"
  - "fattore 2"
  - "fattore 3"
  - "fattore 4"
  - "fattore 5"

# --- Fascia d'eta' target ---
eta_target:
  - "neonati (0-2 anni)"
  - "pediatrici (3-14 anni)"
  - "adulti (15-65 anni)"
  - "anziani (>65 anni)"

# --- Reperti obiettivi (esame fisico) ---
reperti_obiettivi:
  - "reperto 1"
  - "reperto 2"
  - "reperto 3"

# --- Caratteristiche tipiche (segni clinici distintivi) ---
caratteristiche_tipiche:
  - "Segno clinico 1 - breve descrizione"
  - "Segno clinico 2 - breve descrizione"
  - "Segno clinico 3 - breve descrizione"

# --- Diagnosi differenziale ---
diagnosi_differenziale:
  - "Patologia 1"
  - "Patologia 2"
  - "Patologia 3"
  - "Patologia 4"

# --- Prevalenza ---
prevalenza_gender: "Descrizione della prevalenza per genere (es. M>F 2:1)"
prevalenza_eta: "Descrizione della prevalenza per eta' (es. picco dopo 55 anni)"

# --- Quadro radiologico ---
quadro_radiologico: |
  Descrizione del tipico reperto radiologico.
  - Esame principale: TC / RMN / RX / Ecografia
  - Reperto cardinale
  - Reperti associati
  - Differenziali radiologici

# --- Anatomia patologica ---
anatomia_patologica: |
  Descrizione del reperto istologico/macroscopico.
  - Aspetto macroscopico
  - Reperto istologico
  - Marker immunoistochimici (se pertinenti)
  - Colorazioni speciali

# --- Linee guida ---
linee_guida:
  - nome: "Nome Linea Guida - Organismo - Anno"
    url: "https://..."
  - nome: "Seconda Linea Guida"
    url: "https://..."

# --- Immagine (URL) ---
immagine: "https://images.unsplash.com/photo-XXXXX?w=500"

---

# Nome della Patologia

Descrizione clinica in formato Markdown.
Include: epidemiologia, fisiopatologia, presentazione clinica,
e informazioni utili per la comprensione della malattia.

## Fisiopatologia

Descrizione del meccanismo patogenetico.

## Complicanze

- Complicanza 1
- Complicanza 2
- Complicanza 3
