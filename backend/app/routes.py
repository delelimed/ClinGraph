import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from backend.app.db.neo4j_client import run_query

router = APIRouter()

PATOLOGIE_DIR = "backend/data/patologie"


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


### 3. ENDPOINT: Scheda di Dettaglio Singola Patologia (CSV + JSON)
@router.get("/patologia/{nome}")
def detalle_patologia(nome: str):
    """
    Ritorna la scheda clinica completa unendo le proprietà strutturate del CSV (salvate su Neo4j)
    con i dettagli descrittivi e multimediali salvati nei singoli file JSON.
    """
    # Query ottimizzata: estraiamo tutte le relazioni in un'unica chiamata senza duplicare le proprietà
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

        # Struttura dati iniziale di fallback (se non trova nulla nel DB)
        output = {
            "patologia": nome,
            "ambito": "Non specificato",
            "terapia": "Non specificata",
            "diagnosi": "Non specificata",
            "esami_laboratorio": "Non specificati",
            "sintomi": [],
            "eta_target": [],
            "stile_vita": [],
            "descrizione": "Nessuna descrizione enciclopedica disponibile per questa patologia.",
            "immagine": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500",
            "caratteristiche_tipiche": ["Informazioni in corso di aggiornamento."]
        }

        if result and result[0]["patologia"] is not None:
            # Assegniamo i metadati fissi ereditati dal CSV originario
            output["patologia"] = result[0]["patologia"]
            output["ambito"] = result[0]["ambito"] or output["ambito"]
            output["terapia"] = result[0]["terapia"] or output["terapia"]
            output["diagnosi"] = result[0]["diagnosi"] or output["diagnosi"]
            output["esami_laboratorio"] = result[0]["esami_laboratorio"] or output["esami_laboratorio"]

            # FIX CRITICO: Accumuliamo i dati riga per riga invece di sovrascriverli
            for r in result:
                rel = r["tipo_relazione"]
                if rel == "HA_SINTOMO":
                    output["sintomi"] = list(set(output["sintomi"] + r["elementi"]))
                elif rel == "TARGET_ETA":
                    output["eta_target"] = list(set(output["eta_target"] + r["elementi"]))
                elif rel == "FATTORE_RISCHIO":
                    output["stile_vita"] = list(set(output["stile_vita"] + r["elementi"]))

        # Legge dinamicamente il file JSON individuale presente in backend/data/patologie/
        nome_file = f"{nome.lower().strip()}.json"
        path_completo = os.path.join(PATOLOGIE_DIR, nome_file)

        if os.path.exists(path_completo):
            with open(path_completo, "r", encoding="utf-8") as f:
                dettagli_individuali = json.load(f)

                # Uniamo le informazioni multimediali sovrascrivendo i fallback
                output["descrizione"] = dettagli_individuali.get("descrizione", output["descrizione"])
                output["immagine"] = dettagli_individuali.get("immagine", output["immagine"])
                output["caratteristiche_tipiche"] = dettagli_individuali.get("caratteristiche_tipiche",
                                                                             output["caratteristiche_tipiche"])

        return output

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore interno del server: {str(e)}")