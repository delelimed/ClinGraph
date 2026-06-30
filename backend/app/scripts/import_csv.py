import csv
from backend.app.db.neo4j_client import driver

# Assicurati che questo percorso punti al nuovo CSV integrato
CSV_PATH = "backend/data/patologie.csv"

def import_csv():
    with driver.session() as session:
        # Svuota preventivamente il database per evitare nodi orfani della vecchia struttura
        print("🧹 Pulizia del database in corso...")
        session.run("MATCH (n) DETACH DELETE n")

        print("🚀 Caricamento dei nuovi dati su Neo4j Aura...")
        with open(CSV_PATH, newline="", encoding="utf-8") as file:
            reader = csv.DictReader(file)

            for row in reader:
                # Estraiamo i dati puliti eliminando spazi bianchi superflui
                patologia = row["patologia"].strip()
                entita = row["entita_collegata"].strip()
                tipo_entita = row["tipo_entita"].strip()
                relazione = row["relazione"].strip()

                # Eseguiamo la query Cypher multi-nodo dinamica
                session.run("""
                    // 1. Gestione del Core Node (Patologia)
                    MERGE (p:Patologia {nome: $patologia})
                    SET p.ambito = $ambito,
                        p.terapia = $terapia,
                        p.diagnosi = $diagnosi,
                        p.esami = $esami

                    // 2. Creazione dinamica condizionale basata sul tipo_entita
                    FOREACH (_ IN CASE WHEN $tipo_entita = 'sintomo' THEN [1] ELSE [] END |
                        MERGE (s:Sintomo {nome: $entita})
                        MERGE (p)-[:HA_SINTOMO]->(s)
                    )

                    FOREACH (_ IN CASE WHEN $tipo_entita = 'stile_vita' THEN [1] ELSE [] END |
                        MERGE (sv:StileVita {nome: $entita})
                        MERGE (p)-[:FATTORE_RISCHIO]->(sv)
                    )

                    FOREACH (_ IN CASE WHEN $tipo_entita = 'eta' THEN [1] ELSE [] END |
                        MERGE (e:Eta {nome: $entita})
                        MERGE (p)-[:TARGET_ETA]->(e)
                    )
                """, {
                    "patologia": patologia,
                    "entita": entita,
                    "tipo_entita": tipo_entita,
                    "ambito": row["ambito"].strip(),
                    "terapia": row["terapia"].strip(),
                    "diagnosi": row["diagnosi"].strip(),
                    "esami": row["esami_laboratorio"].strip() # Aggiornato mapping con l'header reale del CSV
                })

    print("✅ Import strutturale completato con successo su Neo4j Aura!")

if __name__ == "__main__":
    import_csv()