import os
import json
from fastapi import APIRouter, HTTPException
from backend.app.db.neo4j_client import run_query

router = APIRouter()

PATOLOGIE_DIR = "backend/data/patologie"


@router.get("/patologia/{nome}")
def detalle_patologia(nome: str):
    # Aggiorniamo la query per estrarre sia i nodi connessi sia le proprietà interne di Patologia
    query = """
    MATCH (p:Patologia)-[r]->(connesso)
    WHERE toLower(p.nome) = toLower($nome)
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

        # Struttura dati standard con i vecchi campi del CSV pronti
        output = {
            "patologia": nome,
            "ambito": "Non specificato",
            "terapia": "Non specificata",
            "diagnosi": "Non specificata",
            "esami_laboratorio": "Non specificati",
            "sintomi": [],
            "eta_target": [],
            "stile_vita": [],
            "descrizione": "Nessun file descrittivo individuale trovato.",
            "immagine": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500",
            "caratteristiche_tipiche": ["Scheda descrittiva in fase di redazione."]
        }

        if result:
            # Recuperiamo i dati generali della patologia presi dal CSV originale
            output["patologia"] = result[0]["patologia"]
            output["ambito"] = result[0]["ambito"] or output["ambito"]
            output["terapia"] = result[0]["terapia"] or output["terapia"]
            output["diagnosi"] = result[0]["diagnosi"] or output["diagnosi"]
            output["esami_laboratorio"] = result[0]["esami_laboratorio"] or output["esami_laboratorio"]

            # Smistiamo le relazioni dal grafo (Sintomi, Età, Stile di vita)
            for r in result:
                if r["tipo_relazione"] == "HA_SINTOMO":
                    output["sintomi"] = r["elementi"]
                elif r["tipo_relazione"] == "TARGET_ETA":
                    output["eta_target"] = r["elementi"]
                elif r["tipo_relazione"] == "FATTORE_RISCHIO":
                    output["stile_vita"] = r["elementi"]

        # Lettura del file JSON specifico della patologia per descrizione e foto
        nome_file = f"{nome.lower().strip()}.json"
        path_completo = os.path.join(PATOLOGIE_DIR, nome_file)

        if os.path.exists(path_completo):
            with open(path_completo, "r", encoding="utf-8") as f:
                dettagli_individuali = json.load(f)
                output["descrizione"] = dettagli_individuali.get("descrizione", output["descrizione"])
                output["immagine"] = dettagli_individuali.get("immagine", output["immagine"])
                output["caratteristiche_tipiche"] = dettagli_individuali.get("caratteristiche_tipiche",
                                                                             output["caratteristiche_tipiche"])

        return output

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore nel server: {str(e)}")