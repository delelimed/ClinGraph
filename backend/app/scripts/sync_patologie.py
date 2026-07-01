"""
sync_patologie.py - Script unificato: markdown -> CSV -> Neo4j

Legge tutti i file .md, genera il CSV e importa in Neo4j.
Unico script necessario per la sincronizzazione completa.

Uso:
    python -m backend.app.scripts.sync_patologie          # CSV + Neo4j
    python -m backend.app.scripts.sync_patologie --no-db  # Solo CSV
"""

import os
import sys
import csv
import yaml

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PATOLOGIE_DIR = os.path.join(BASE_DIR, "data", "patologie")
CSV_OUTPUT = os.path.join(BASE_DIR, "data", "patologie.csv")

CSV_HEADERS = [
    "patologia", "relazione", "entita_collegata", "tipo_entita",
    "diagnosi", "esami_laboratorio", "ambito", "terapia",
    "farmaci", "quadro_radiologico", "anatomia_patologica",
]

FIELD_MAP = {
    "sintomi": ("HA_SINTOMO", "sintomo"),
    "fattori_rischio": ("FATTORE_RISCHIO", "stile_vita"),
    "eta_target": ("TARGET_ETA", "eta"),
}


def parse_md_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    if not content.startswith("---"):
        return None
    parts = content.split("---", 2)
    if len(parts) < 3:
        return None
    try:
        metadata = yaml.safe_load(parts[1])
    except yaml.YAMLError:
        return None
    if not metadata or "nome" not in metadata:
        return None
    return metadata


def generate_rows(metadata):
    rows = []
    patologia = metadata["nome"]
    ambito = metadata.get("ambito", "")
    terapia = metadata.get("terapia", "")
    diagnosi = metadata.get("diagnosi", "")
    esami = metadata.get("esami_laboratorio", "")
    farmaci = metadata.get("farmaci", [])
    if isinstance(farmaci, list):
        farmaci = "\n".join(str(f).lstrip("- ").strip() for f in farmaci if f)
    else:
        farmaci = str(farmaci) if farmaci else ""
    quadro_rad = metadata.get("quadro_radiologico", "")
    if isinstance(quadro_rad, list):
        quadro_rad = "\n".join(str(q).lstrip("- ").strip() for q in quadro_rad if q)
    else:
        quadro_rad = str(quadro_rad) if quadro_rad else ""
    anat_pat = metadata.get("anatomia_patologica", "")
    if isinstance(anat_pat, list):
        anat_pat = "\n".join(str(a).lstrip("- ").strip() for a in anat_pat if a)
    else:
        anat_pat = str(anat_pat) if anat_pat else ""

    for field, (relazione, tipo) in FIELD_MAP.items():
        valori = metadata.get(field, [])
        if isinstance(valori, str):
            valori = [v.strip() for v in valori.split(",") if v.strip()]
        elif isinstance(valori, list):
            valori = [str(v).strip() for v in valori if v and str(v).strip()]
        else:
            valori = []

        for entita in valori:
            entita = entita.lstrip("- ").strip()
            if not entita:
                continue
            rows.append({
                "patologia": patologia, "relazione": relazione,
                "entita_collegata": entita, "tipo_entita": tipo,
                "diagnosi": diagnosi, "esami_laboratorio": esami,
                "ambito": ambito, "terapia": terapia,
                "farmaci": farmaci, "quadro_radiologico": quadro_rad,
                "anatomia_patologica": anat_pat,
            })
    return rows


def generate_csv():
    all_rows = []
    patologie_count = 0
    if not os.path.exists(PATOLOGIE_DIR):
        print(f"[ERRORE] Directory non trovata: {PATOLOGIE_DIR}")
        return 0
    for root, dirs, files in os.walk(PATOLOGIE_DIR):
        for fname in sorted(files):
            if not fname.endswith(".md"):
                continue
            filepath = os.path.join(root, fname)
            metadata = parse_md_file(filepath)
            if metadata is None:
                print(f"[SKIP] Frontmatter non valido: {filepath}")
                continue
            rows = generate_rows(metadata)
            all_rows.extend(rows)
            patologie_count += 1
            print(f"  [OK] {metadata['nome']} ({len(rows)} righe)")
    if not all_rows:
        print("[ERRORE] Nessuna patologia trovata.")
        return 0
    with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"\n[CSV] {patologie_count} patologie, {len(all_rows)} righe -> {CSV_OUTPUT}")
    return len(all_rows)


def import_neo4j():
    try:
        from backend.app.db.neo4j_client import get_driver
        driver = get_driver()
    except Exception as e:
        print(f"[INFO] Neo4j non disponibile: {e}")
        return False
    if not os.path.exists(CSV_OUTPUT):
        print(f"[ERRORE] CSV non trovato: {CSV_OUTPUT}")
        return False
    with driver.session() as session:
        print("[NEO4J] Pulizia database...")
        session.run("MATCH (n) DETACH DELETE n")
        print("[NEO4J] Import in corso...")
        with open(CSV_OUTPUT, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                session.run("""
                    MERGE (p:Patologia {nome: $patologia})
                    SET p.ambito = $ambito, p.terapia = $terapia,
                        p.diagnosi = $diagnosi, p.esami = $esami,
                        p.farmaci = $farmaci, p.quadro_radiologico = $quadro_radiologico,
                        p.anatomia_patologica = $anatomia_patologica
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
                    "patologia": row["patologia"].strip(),
                    "entita": row["entita_collegata"].strip(),
                    "tipo_entita": row["tipo_entita"].strip(),
                    "ambito": row.get("ambito", "").strip(),
                    "terapia": row.get("terapia", "").strip(),
                    "diagnosi": row.get("diagnosi", "").strip(),
                    "esami": row.get("esami_laboratorio", "").strip(),
                    "farmaci": row.get("farmaci", "").strip(),
                    "quadro_radiologico": row.get("quadro_radiologico", "").strip(),
                    "anatomia_patologica": row.get("anatomia_patologica", "").strip(),
                })
                count += 1
        print(f"[NEO4J] {count} righe importate.")
        return True


def sync(no_db=False):
    print("=== SINCRONIZZAZIONE COMPLETA ===\n")
    rows = generate_csv()
    if rows == 0:
        return
    if not no_db:
        print()
        import_neo4j()
    print("\n[OK] Sincronizzazione completata.")


if __name__ == "__main__":
    no_db = "--no-db" in sys.argv
    sync(no_db=no_db)
