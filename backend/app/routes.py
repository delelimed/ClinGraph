import os
import json
import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.app.db.neo4j_client import run_query

router = APIRouter()

PATOLOGIE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "patologie")


# Modello dati per la richiesta di diagnosi
class DiagnosiRequest(BaseModel):
    sintomi: List[str]


### 1. ENDPOINT: Ottieni l'intero Grafo (per l'Explorer del Frontend)
@router.get("/grafo")
def get_grafo():
    """
    Ritorna tutti i nodi e gli archi presenti nel database.
    Mappa in modo pulito source e target come stringhe stabili.
    """
    query = """
    MATCH (n)-[r]->(m)
    RETURN n.nome AS source, m.nome AS target, type(r) AS relazione
    """
    try:
        results = run_query(query)
        links = []
        for record in results:
            if record["source"] and record["target"]:
                links.append({
                    "source": record["source"],
                    "target": record["target"],
                    "relazione": record["relazione"]
                })
        return {"links": links}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore recupero grafo complessivo: {str(e)}")


### 1b. ENDPOINT: Lista tutti i sintomi disponibili (per autocomplete)
@router.get("/sintomi")
def get_sintomi():
    """
    Ritorna tutti i nomi dei nodi Sintomo e StileVita presenti nel database,
    utilizzati per l'autocomplete nella schermata di diagnosi.
    """
    try:
        query = """
        MATCH (n)
        WHERE n:Sintomo OR n:StileVita
        RETURN n.nome AS nome, 
               CASE WHEN n:Sintomo THEN 'sintomo' ELSE 'stile_vita' END AS tipo
        ORDER BY n.nome
        """
        results = run_query(query)
        items = []
        for record in results:
            if record["nome"]:
                items.append({
                    "nome": record["nome"],
                    "tipo": record["tipo"]
                })
        return {"sintomi": items}
    except Exception:
        return {"sintomi": []}


### 2. ENDPOINT: Calcolo Diagnostico (Motore delle Patologie Correlate)
@router.post("/diagnosi")
def calcola_diagnosi(req: DiagnosiRequest):
    """
    Prende una lista di sintomi/condizioni inseriti dall'utente e calcola
    le patologie correlate basandosi sulle connessioni del grafo.
    """
    if not req.sintomi:
        return {"diagnosi": []}

    # Normalizziamo gli input in minuscolo per fare un confronto sicuro
    sintomi_clean = [s.lower().strip() for s in req.sintomi]

    query = """
    MATCH (p:Patologia)-[r]->(c)
    WHERE toLower(c.nome) IN $sintomi
    RETURN p.nome AS patologia, count(r) AS match_count
    ORDER BY match_count DESC
    """
    try:
        results = run_query(query, {"sintomi": sintomi_clean})
        diagnosi_list = []
        for record in results:
            diagnosi_list.append({
                "patologia": record["patologia"],
                "score": record["match_count"]
            })
        return {"diagnosi": diagnosi_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore motore diagnostico: {str(e)}")


### 3. ENDPOINT: Scheda di Dettaglio Singola Patologia (CSV + Markdown)
@router.get("/patologia/{nome}")
def detalle_patologia(nome: str):
    """
    Ritorna la scheda clinica completa unendo le proprietà strutturate del CSV (salvate su Neo4j)
    con i dettagli descrittivi salvati nei singoli file Markdown con frontmatter YAML.
    """
    query = """
    MATCH (p:Patologia)
    WHERE toLower(p.nome) = toLower($nome)
    OPTIONAL MATCH (p)-[r]->(connesso)
    RETURN p.nome AS patologia, 
           p.ambito AS ambito,
           p.terapia AS terapia,
           p.diagnosi AS diagnosi,
           p.esami AS esami_laboratorio,
           type(r) AS tipo_relazione, 
           collect(connesso.nome) AS elementi
    """

    try:
        result = run_query(query, {"nome": nome})

        output = {
            "patologia": nome,
            "ambito": "Non specificato",
            "terapia": "Non specificata",
            "farmaci": [],
            "dosaggi": {},
            "diagnosi": "Non specificata",
            "esami_laboratorio": "Non specificati",
            "sintomi": [],
            "eta_target": [],
            "stile_vita": [],
            "descrizione": "Nessuna descrizione disponibile per questa patologia.",
            "immagine": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500",
            "caratteristiche_tipiche": ["Informazioni in corso di aggiornamento."],
            "diagnosi_differenziale": [],
            "prevalenza_gender": "",
            "prevalenza_eta": "",
            "quadro_radiologico": "",
            "anatomia_patologica": "",
            "linee_guida": []
        }

        if result and result[0]["patologia"] is not None:
            output["patologia"] = result[0]["patologia"]
            output["ambito"] = result[0]["ambito"] or output["ambito"]
            output["terapia"] = result[0]["terapia"] or output["terapia"]
            output["diagnosi"] = result[0]["diagnosi"] or output["diagnosi"]
            output["esami_laboratorio"] = result[0]["esami_laboratorio"] or output["esami_laboratorio"]

            for r in result:
                rel = r["tipo_relazione"]
                if rel == "HA_SINTOMO":
                    output["sintomi"] = list(set(output["sintomi"] + r["elementi"]))
                elif rel == "TARGET_ETA":
                    output["eta_target"] = list(set(output["eta_target"] + r["elementi"]))
                elif rel == "FATTORE_RISCHIO":
                    output["stile_vita"] = list(set(output["stile_vita"] + r["elementi"]))

        # Cerca il file .md nella gerarchia delle sottocartelle
        md_data = _find_and_parse_md(nome)
        if md_data:
            output["descrizione"] = md_data.get("body", output["descrizione"])
            output["immagine"] = md_data.get("immagine", output["immagine"])
            output["caratteristiche_tipiche"] = md_data.get("caratteristiche_tipiche", output["caratteristiche_tipiche"])
            output["diagnosi_differenziale"] = md_data.get("diagnosi_differenziale", [])
            output["prevalenza_gender"] = md_data.get("prevalenza_gender", "")
            output["prevalenza_eta"] = md_data.get("prevalenza_eta", "")
            output["farmaci"] = md_data.get("farmaci", [])
            output["dosaggi"] = md_data.get("dosaggi", {})
            output["quadro_radiologico"] = md_data.get("quadro_radiologico", "")
            output["anatomia_patologica"] = md_data.get("anatomia_patologica", "")
            output["linee_guida"] = md_data.get("linee_guida", [])

        return output

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore interno del server: {str(e)}")


def _find_and_parse_md(nome_patologia):
    """Cerca ricorsivamente il file .md per una data patologia e parsifica il frontmatter."""
    nome_lower = nome_patologia.lower().strip().replace(" ", "_")

    if not os.path.exists(PATOLOGIE_DIR):
        return None

    for root, dirs, files in os.walk(PATOLOGIE_DIR):
        for fname in files:
            if not fname.endswith(".md"):
                continue

            fname_stem = fname[:-3].lower().strip()
            if fname_stem != nome_lower:
                continue

            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                if not content.startswith("---"):
                    continue

                parts = content.split("---", 2)
                if len(parts) < 3:
                    continue

                metadata = yaml.safe_load(parts[1])
                body = parts[2].strip()

                if metadata is None:
                    metadata = {}

                metadata["body"] = body
                return metadata
            except Exception:
                continue

    return None


# ============================================================
# CENTRALIZED DATA ENDPOINTS (public) - now from MD files
# ============================================================
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
PROCEDURE_DIAGNOSTICHE_DIR = os.path.join(DATA_DIR, "procedure_diagnostiche")
FARMACI_FILE = os.path.join(DATA_DIR, "farmaci_centralizzati.json")


def _load_all_analisi_from_md():
    """Load all analyses from MD files in procedure_diagnostiche/ subfolders."""
    analisi = []
    if not os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
        return analisi
    for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR):
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                if not content.startswith("---"):
                    continue
                parts = content.split("---", 2)
                if len(parts) < 3:
                    continue
                metadata = yaml.safe_load(parts[1]) or {}
                metadata["body"] = parts[2].strip()
                analisi.append(metadata)
            except Exception:
                continue
    return analisi


@router.get("/analisi-centralizzate")
def get_analisi_centralizzate():
    return {"analisi": _load_all_analisi_from_md()}

@router.get("/analisi-per-patologia/{nome_patologia}")
def get_analisi_per_patologia(nome_patologia: str):
    """Return analyses linked to a specific pathology from MD files."""
    all_analisi = _load_all_analisi_from_md()
    linked = []
    for a in all_analisi:
        patologie_list = a.get("patologie", [])
        if any(nome_patologia.lower() in p.lower() for p in patologie_list):
            linked.append(a)
    return {"analisi": linked}

@router.get("/analisi/{nome}")
def get_analisi_detail(nome: str):
    """Get detail of a specific analysis by name from MD files."""
    all_analisi = _load_all_analisi_from_md()
    for a in all_analisi:
        if a.get("nome", "").lower() == nome.lower():
            return a
    raise HTTPException(status_code=404, detail=f"Analisi '{nome}' non trovata")

@router.get("/farmaci-centralizzati")
def get_farmaci_centralizzati():
    if os.path.exists(FARMACI_FILE):
        with open(FARMACI_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"farmaci": []}

@router.get("/farmaci-centralizzati/cerca")
def cerca_farmaci(q: str = ""):
    """Cerca farmaci per nome o principio attivo."""
    if not os.path.exists(FARMACI_FILE):
        return {"farmaci": []}
    with open(FARMACI_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    query = q.lower().strip()
    if not query:
        return {"farmaci": data.get("farmaci", [])[:50]}
    results = []
    for d in data.get("farmaci", []):
        nome = d.get("nome", "").lower()
        pa = d.get("principio_attivo", "").lower()
        classe = d.get("classe", "").lower()
        if query in nome or query in pa or query in classe:
            results.append(d)
    return {"farmaci": results}


# ============================================================
# PROCEDURE DIAGNOSTICHE (public)
# ============================================================
PROCEDURE_DIAGNOSTICHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "procedure_diagnostiche")

@router.get("/procedure-diagnostiche")
def list_procedure_diagnostiche():
    procedure = []
    if not os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
        return {"procedure": [], "total": 0}
    for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR):
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                if not content.startswith("---"):
                    continue
                parts = content.split("---", 2)
                if len(parts) < 3:
                    continue
                metadata = yaml.safe_load(parts[1]) or {}
                procedure.append({
                    "nome": metadata.get("nome", fname.replace(".md", "")),
                    "ambito": metadata.get("ambito", ""),
                    "descrizione": metadata.get("descrizione", ""),
                    "preparazione": metadata.get("preparazione", ""),
                    "esecuzione": metadata.get("esecuzione", ""),
                    "interpretazione": metadata.get("interpretazione", ""),
                    "tempo_risposta": metadata.get("tempo_risposta", ""),
                    "costo_stimato": metadata.get("costo_stimato", ""),
                    "patologie_correlate": metadata.get("patologie_correlate", []),
                    "linee_guida": metadata.get("linee_guida", []),
                })
            except Exception:
                continue
    return {"procedure": procedure, "total": len(procedure)}

@router.get("/procedure-diagnostiche/{nome}")
def get_procedura_diagnostica(nome: str):
    if not os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR):
        raise HTTPException(status_code=404, detail="Directory procedure diagnostiche non trovata")
    nome_lower = nome.lower().strip().replace(" ", "_")
    for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR):
        for fname in files:
            if not fname.endswith(".md"):
                continue
            fname_stem = fname[:-3].lower().strip()
            if fname_stem != nome_lower:
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                if not content.startswith("---"):
                    continue
                parts = content.split("---", 2)
                if len(parts) < 3:
                    continue
                metadata = yaml.safe_load(parts[1]) or {}
                metadata["body"] = parts[2].strip()
                return metadata
            except Exception:
                continue
    raise HTTPException(status_code=404, detail=f"Procedura '{nome}' non trovata")


# ============================================================
# PUBLIC SUGGESTIONS/REQUESTS ENDPOINT
# ============================================================
SUGGERIMENTI_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "suggerimenti.json")

@router.get("/richieste-pubbliche")
def get_richieste_pubbliche():
    """Ritorna le richieste/proposte pubbliche (solo titolo e stato)."""
    if not os.path.exists(SUGGERIMENTI_FILE):
        return {"richieste": []}
    try:
        with open(SUGGERIMENTI_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        richieste = []
        for s in data:
            richieste.append({
                "id": s.get("id"),
                "tipo": s.get("tipo", ""),
                "target": s.get("target", ""),
                "stato": s.get("stato", "pending"),
                "timestamp": s.get("timestamp", ""),
            })
        return {"richieste": richieste}
    except Exception:
        return {"richieste": []}


# ============================================================
# PUBLIC CHANGELOG ENDPOINT
# ============================================================
CHANGELOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "changelog.json")

@router.get("/changelog-pubblico")
def get_changelog_pubblico(limit: int = 20):
    """Ritorna il changelog pubblico (ultime modifiche)."""
    if not os.path.exists(CHANGELOG_FILE):
        return {"entries": []}
    try:
        with open(CHANGELOG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"entries": data[:limit]}
    except Exception:
        return {"entries": []}


# ============================================================
# PUBLIC PATHOLOGIES/PROCEDURES LIST (for modification forms)
# ============================================================
@router.get("/patologie-list")
def get_patologie_list():
    """Ritorna la lista delle patologie disponibili (per moduli di proposta modifica)."""
    patologie = []
    if not os.path.exists(PATOLOGIE_DIR):
        return {"patologie": []}
    for root, dirs, files in os.walk(PATOLOGIE_DIR):
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                nome = fname.replace(".md", "").replace("_", " ").title()
                ambito = os.path.basename(root).replace("_", " ").title()
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        metadata = yaml.safe_load(parts[1]) or {}
                        nome = metadata.get("nome", nome)
                        ambito = metadata.get("ambito", ambito)
                patologie.append({"nome": nome, "ambito": ambito})
            except Exception:
                continue
    return {"patologie": patologie}

PROCEDURE_DIAGNOSTICHE_DIR_PUB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "procedure_diagnostiche")

@router.get("/procedure-list")
def get_procedure_list():
    """Ritorna la lista delle procedure diagnostiche disponibili."""
    procedure = []
    if not os.path.exists(PROCEDURE_DIAGNOSTICHE_DIR_PUB):
        return {"procedure": []}
    for root, dirs, files in os.walk(PROCEDURE_DIAGNOSTICHE_DIR_PUB):
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                nome = fname.replace(".md", "").replace("_", " ").title()
                ambito = os.path.basename(root).replace("_", " ").title()
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        metadata = yaml.safe_load(parts[1]) or {}
                        nome = metadata.get("nome", nome)
                        ambito = metadata.get("ambito", ambito)
                procedure.append({"nome": nome, "ambito": ambito})
            except Exception:
                continue
    return {"procedure": procedure}


# ============================================================
# PUBLIC CHANGELOG MD ENDPOINT
# ============================================================
CHANGELOG_MD_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "changelog.md")

@router.get("/changelog-pubblico-md")
def get_changelog_pubblico_md():
    """Ritorna il contenuto del changelog.md pubblico."""
    if os.path.exists(CHANGELOG_MD_FILE):
        with open(CHANGELOG_MD_FILE, "r", encoding="utf-8") as f:
            return {"content": f.read()}
    return {"content": ""}