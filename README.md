# ClinGraph CDSS

**Clinical Decision Support System** -- Sistema di Supporto Decisionale Clinico basato su grafo delle conoscenze mediche.

> **Nota**: Progetto in fase sperimentale. I dati sono stati generati da AI e non revisionati da medici. Ha finalita' puramente educative e informative. Non sostituisce il giudizio clinico del medico.

> **Progetto in continua espansione**: le patologie inserite sono quelle incontrate nel corso degli studi e dell'attivita' lavorativa. Il database verra' costantemente aggiornato e ampliato con nuove patologie e relazioni.

---

## Funzionalita'

- **Diagnosi assistita**: inserisci i sintomi e il sistema calcola le patologie correlate piu' probabili, con punteggio basato sulle corrispondenze nel grafo
- **Esplorazione grafo**: visualizzazione interattiva delle relazioni tra patologie, sintomi, stile di vita e fasce d'eta'
- **Catalogo esami clinici**: 300 procedure diagnostiche (cliniche, di laboratorio, strumentali)
- **Scheda patologia**: dettaglio completo con terapia, farmaci, diagnosi differenziale, quadro radiologico, anatomia patologica, linee guida
- **Database farmaci**: integrato dall'API AIFA (Agenzia Italiana del Farmaco)

---

## Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| Frontend SPA | React 19 + Vite 8 + SWC |
| Visualizzazione grafo | react-force-graph-2d, ReactFlow |
| Backend API | FastAPI (Python 3.11) |
| Database grafo | Neo4j |
| Dati farmaci | API pubblica AIFA |
| Deploy | Modal (cloud serverless) |
| Frontend alternativo | Streamlit (Python) + NetworkX + Plotly |

---

## Struttura del Progetto

```
ClinGraph/
|
|-- backend/
|   |-- app/
|   |   |-- main.py              # App FastAPI
|   |   |-- routes.py            # API pubbliche
|   |   |-- admin.py             # API admin
|   |   `-- scripts/
|   |       |-- sync_patologie.py    # Pipeline MD -> CSV -> Neo4j
|   |       `-- sync_aifa.py         # Sync farmaci da API AIFA
|   |
|   `-- data/
|       |-- patologie.csv         # CSV generato dai .md
|       |-- patologie/            # File MD delle patologie (216+)
|       |   |-- cardiologia/
|       |   |-- neurologia/
|       |   |-- pneumologia/
|       |   |-- gastroenterologia/
|       |   |-- endocrinologia/
|       |   |-- nefrologia/
|       |   |-- oncologia/
|       |   |-- malattie_infettive/
|       |   |-- reumatologia/
|       |   |-- ematologia/
|       |   |-- ortopedia/
|       |   |-- dermatologia/
|       |   |-- psichiatria/
|       |   |-- medicina_interna/
|       |   |-- geriatria/
|       |   |-- ginecologia/
|       |   |-- pediatria/
|       |   |-- urologia/
|       |   |-- oftalmologia/
|       |   |-- otorinolaringoiatria/
|       |   `-- chirurgia_generale/
|       |
|       `-- procedure_diagnostiche/
|           |-- clinico/          (100 procedure)
|           |-- laboratorio/      (100 esami)
|           `-- strumentale/      (100 esami)
|
|-- frontend/                     # SPA React
|   `-- src/components/
|       |-- WelcomeScreen.jsx
|       |-- DiagnosisScreen.jsx
|       |-- ExplorerScreen.jsx
|       |-- DetailScreen.jsx
|       `-- AdminScreen.jsx
|
`-- streamlit_app.py              # Interfaccia Streamlit alternativa
```

---

## Modello Dati

Il sistema modella le conoscenze mediche come un **grafo di relazioni**:

### Nodi

| Tipo Nodo | Descrizione | Esempio |
|---|---|---|
| `Patologia` | Malattia con terapia, diagnosi, farmaci | Angina pectoris |
| `Sintomo` | Manifestazione clinica | Dolore toracico |
| `StileVita` | Fattore di rischio | Fumo di sigaretta |
| `Eta` | Fascia target | Adulti (>45 anni) |

### Relazioni

| Relazione | Da | A | Descrizione |
|---|---|---|---|
| `HA_SINTOMO` | Patologia | Sintomo | La patologia si manifesta con questo sintomo |
| `FATTORE_RISCHIO` | Patologia | StileVita | Fattore che aumenta il rischio |
| `TARGET_ETA` | Patologia | Eta | Fascia d'eta' piu' colpita |

### Pipeline Dati

```
File .md (fonte di verita')
    |
    v
sync_patologie.py (parsing YAML)
    |
    v
patologie.csv (intermedio)
    |
    v
Neo4j (database a grafo)
```

---

## API Endpoints

### Pubblici

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/diagnosi` | POST | Diagnosi assistita da sintomi |
| `/grafo` | GET | Grafo completo delle relazioni |
| `/sintomi` | GET | Lista tutti i sintomi |
| `/patologie` | GET | Lista tutte le patologie |
| `/patologia/{nome}` | GET | Dettaglio singola patologia |
| `/procedure` | GET | Lista procedure diagnostiche |
| `/farmaci` | GET | Database farmaci AIFA |

### Admin (`/admin`)

| Endpoint | Metodo | Descrizione |
|---|---|---|
| `/admin/login` | POST | Autenticazione |
| `/admin/users` | GET/POST | Gestione utenti |
| `/admin/suggerimenti` | GET | Proposte utenti |
| `/admin/sync` | POST | Sincronizzazione DB |
| `/admin/upload` | POST | Upload file MD |
| `/admin/export` | GET | Export ZIP database |

---

## Setup

### Prerequisiti

- Python 3.11+
- Node.js 18+
- Neo4j (cloud o locale)

### Backend

```bash
# Installa dipendenze
pip install -r requirements.txt

# Configura variabili d'ambiente
cp .env.example .env
# Modifica .env con le credenziali Neo4j

# Avvia il server
python -m backend.app.main
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Sincronizzazione Dati

```bash
# Genera CSV dai file .md (senza Neo4j)
python -m backend.app.scripts.sync_patologie --no-db

# Sincronizza completa (CSV + Neo4j)
python -m backend.app.scripts.sync_patologie

# Sync farmaci da API AIFA
python -m backend.app.scripts.sync_aifa
```

### Deploy su Modal

```bash
# Installa Modal
pip install modal
modal setup

# Deploy
modal deploy main.py
```

---

## Formato File Patologia

Ogni patologia e' un file Markdown con frontmatter YAML:

```yaml
---
nome: "Angina pectoris"
ambito: "Cardiologia"
sintomi:
  - "dolore toracico da sforzo retrosternale"
  - "dispnea da sforzo"
  - "sudorazione"
fattori_rischio:
  - "fumo di sigaretta"
  - "ipertensione arteriosa"
farmaci:
  - "Nitroglicerina 0.4 mg sublinguale da bisogno"
  - "Atenololo 50-100 mg die"
linee_guida:
  - nome: "ESC Guidelines (2024)"
    url: "https://..."
---

# Angina pectoris
Descrizione clinica in Markdown...
```

---

## Contenuto

- **216+ patologie** suddivise in 21 ambiti clinici, ognuna con 10-18 sintomi, fattori di rischio, farmaci, linee guida
- **300 procedure diagnostiche** (100 cliniche, 100 di laboratorio, 100 strumentali)
- **Database farmaci** integrato dall'API AIFA

---

## Licenza

Progetto sperimentale per uso educativo.

---

*Developed by DELELIMED*
