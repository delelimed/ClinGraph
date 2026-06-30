"""
sync_aifa.py - Sincronizzazione TUTTI i farmaci dall'AIFA API

Modalita':
    python -m backend.app.scripts.sync_aifa                  # Sync completo (a-z, aa-zz)
    python -m backend.app.scripts.sync_aifa --search aspirina # Cerca un farmaco
    python -m backend.app.scripts.sync_aifa --import-prices liste.csv  # Importa prezzi da CSV AIFA
"""

import os
import sys
import json
import csv
import time
import string
import urllib.request
import urllib.parse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FARMACI_FILE = os.path.join(BASE_DIR, "data", "farmaci_centralizzati.json")

AIFA_SEARCH_URL = "https://api.aifa.gov.it/aifa-bdf-eif-be/1.0.0/formadosaggio/ricerca"
PAGE_SIZE = 20
SLEEP_BETWEEN_CALLS = 0.3
SAVE_EVERY = 100


def api_search(query, page=0):
    params = urllib.parse.urlencode({
        "query": query,
        "page": str(page),
        "size": str(PAGE_SIZE),
    })
    url = f"{AIFA_SEARCH_URL}?{params}"
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "ClinGraph/1.0",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            if body.get("status") == 200:
                return body.get("data", {})
    except Exception as e:
        print(f"  [ERRORE] query='{query}' page={page}: {e}")
    return {}


def extract_drug(entry):
    med = entry.get("medicinale", {})
    nome = med.get("denominazioneMedicinale", "")
    if not nome:
        return None

    principi = entry.get("principiAttiviIt", [])
    codici_atc = entry.get("codiceAtc", [])
    desc_atc = entry.get("descrizioneAtc", [])
    forma = entry.get("formaFarmaceutica", "")
    vie = entry.get("vieSomministrazione", [])
    azienda = med.get("aziendaTitolare", "")

    confezioni_raw = entry.get("confezioni", [])
    confezioni = []
    for c in confezioni_raw:
        confezioni.append({
            "aic": c.get("aic", ""),
            "denominazione": c.get("denominazionePackage", ""),
            "classe_fornitura": c.get("classeFornitura", ""),
            "rimborsabilita": c.get("descrizioneRimborsabilita", ""),
            "stato": c.get("descrizioneStatoAmministrativo", ""),
        })

    return {
        "nome": nome,
        "principio_attivo": principi[0] if principi else "",
        "codice_atc": codici_atc[0] if codici_atc else "",
        "classe": desc_atc[0] if desc_atc else "",
        "categoria": "",
        "descrizione": f"{forma}. Vie: {', '.join(vie) if vie else 'N/A'}. Azienda: {azienda}.",
        "indicazioni": "",
        "controindicazioni": "",
        "effetti_collaterali": "",
        "posologia": {"adulti": "", "bambini": "", "anziani": "", "insufficienza_renale": ""},
        "interazioni": "",
        "fornitori": [azienda] if azienda else [],
        "fonte": "AIFA",
        "classe_fornitura": confezioni[0]["classe_fornitura"] if confezioni else "",
        "rimborsabilita": confezioni[0]["rimborsabilita"] if confezioni else "",
        "stato": confezioni[0]["stato"] if confezioni else "",
        "forma_farmaceutica": forma,
        "vie_somministrazione": vie,
        "confezioni": confezioni,
    }


def load_existing():
    if os.path.exists(FARMACI_FILE):
        with open(FARMACI_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"farmaci": []}


def save(data):
    os.makedirs(os.path.dirname(FARMACI_FILE), exist_ok=True)
    with open(FARMACI_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def generate_queries():
    queries = list(string.ascii_lowercase)
    for a in string.ascii_lowercase:
        for b in string.ascii_lowercase:
            queries.append(f"{a}{b}")
    return queries


def full_sync(progress_callback=None):
    print("=== SINCRONIZZAZIONE COMPLETA AIFA ===")
    print(f"Query: singole lettere (26) + combinazioni due lettere (676) = 702 query")
    print(f"Paghe dimensione: {PAGE_SIZE} | Rate limit: {SLEEP_BETWEEN_CALLS}s\n")

    existing = load_existing()

    manual_drugs = [d for d in existing.get("farmaci", []) if d.get("fonte") != "AIFA"]
    aifa_existing = {d["nome"].lower(): d for d in existing.get("farmaci", []) if d.get("fonte") == "AIFA"}

    aifa_drugs = dict(aifa_existing)
    seen_aic = set()
    for d in aifa_drugs.values():
        for c in d.get("confezioni", []):
            if c.get("aic"):
                seen_aic.add(c["aic"])

    queries = generate_queries()
    total_api_calls = 0
    new_drugs = 0
    new_confezioni = 0

    if progress_callback:
        progress_callback({"current": 0, "total": len(queries), "message": "Avvio...", "new_drugs": 0})

    for qi, query in enumerate(queries):
        page = 0
        while True:
            data = api_search(query, page)
            total_api_calls += 1
            time.sleep(SLEEP_BETWEEN_CALLS)

            content = data.get("content", [])
            total_elements = data.get("totalElements", 0)
            total_pages = data.get("totalPages", 0)

            if page == 0:
                print(f"[{qi+1}/{len(queries)}] '{query}' -> {total_elements} risultati ({total_pages} pagine)")

            if not content:
                break

            for entry in content:
                drug = extract_drug(entry)
                if not drug:
                    continue

                drug_name_key = drug["nome"].lower()

                if drug_name_key in aifa_drugs:
                    existing_confezioni = aifa_drugs[drug_name_key].get("confezioni", [])
                    existing_aics = {c["aic"] for c in existing_confezioni if c.get("aic")}
                    added_any = False
                    for c in drug.get("confezioni", []):
                        if c.get("aic") and c["aic"] not in existing_aics:
                            existing_confezioni.append(c)
                            existing_aics.add(c["aic"])
                            seen_aic.add(c["aic"])
                            added_any = True
                            new_confezioni += 1
                    if added_any:
                        aifa_drugs[drug_name_key]["confezioni"] = existing_confezioni
                else:
                    drug_confezioni_aics = {c["aic"] for c in drug.get("confezioni", []) if c.get("aic")}
                    if drug_confezioni_aics & seen_aic:
                        for c in drug.get("confezioni", []):
                            if c.get("aic") and c["aic"] not in seen_aic:
                                new_confezioni += 1
                        aifa_drugs[drug_name_key] = drug
                        seen_aic.update(drug_confezioni_aics)
                        new_drugs += 1
                    else:
                        aifa_drugs[drug_name_key] = drug
                        seen_aic.update(drug_confezioni_aics)
                        new_drugs += 1

            if (new_drugs + new_confezioni) > 0 and (new_drugs + new_confezioni) % SAVE_EVERY < PAGE_SIZE:
                save({
                    "farmaci": manual_drugs + list(aifa_drugs.values()),
                })

            page += 1
            if page >= total_pages:
                break

        if (qi + 1) % 50 == 0:
            print(f"  ... progresso: {qi+1}/{len(queries)} query, {new_drugs} nuovi farmaci, {new_confezioni} nuove confezioni")

        if progress_callback and (qi + 1) % 10 == 0:
            progress_callback({
                "current": qi + 1,
                "total": len(queries),
                "message": f"Query {qi+1}/{len(queries)} - {new_drugs} nuovi farmaci",
                "new_drugs": new_drugs,
            })

    by_name = {}
    for d in aifa_drugs.values():
        name_key = d["nome"].lower()
        if name_key not in by_name or len(d.get("confezioni", [])) > len(by_name[name_key].get("confezioni", [])):
            by_name[name_key] = d

    final = manual_drugs + list(by_name.values())
    save({"farmaci": final})

    if progress_callback:
        progress_callback({
            "current": len(queries),
            "total": len(queries),
            "message": f"Completato: {len(by_name)} farmaci AIFA, {len(manual_drugs)} manuali",
            "new_drugs": new_drugs,
            "status": "completed",
        })

    print(f"\n=== COMPLETATO ===")
    print(f"API calls totali: {total_api_calls}")
    print(f"Nuovi farmaci AIFA: {new_drugs}")
    print(f"Nuove confezioni: {new_confezioni}")
    print(f"Farmaci AIFA totali: {len(by_name)}")
    print(f"Farmaci manuali preservati: {len(manual_drugs)}")
    print(f"Totale nel file: {len(final)}")
    print(f"Salvato in: {FARMACI_FILE}")


def search_drugs(query):
    print(f"=== Ricerca: {query} ===\n")
    data = api_search(query)
    content = data.get("content", [])
    total = data.get("totalElements", 0)
    print(f"Risultati trovati: {total}\n")

    if not content:
        print("Nessun risultato.")
        return

    for i, r in enumerate(content[:20], 1):
        med = r.get("medicinale", {})
        nome = med.get("denominazioneMedicinale", "?")
        az = med.get("aziendaTitolare", "?")
        atc_list = r.get("codiceAtc", [])
        atc = atc_list[0] if atc_list else "?"
        desc_atc = r.get("descrizioneAtc", [])
        classe = desc_atc[0] if desc_atc else ""
        forma = r.get("formaFarmaceutica", "")
        confezioni = r.get("confezioni", [])
        principi = r.get("principiAttiviIt", [])

        print(f"  {i}. {nome}")
        print(f"     Principio attivo: {', '.join(principi) if principi else 'N/A'}")
        print(f"     ATC: {atc} ({classe})")
        print(f"     Forma: {forma} | Azienda: {az}")
        print(f"     Confezioni: {len(confezioni)}")
        for c in confezioni[:3]:
            print(f"       - AIC {c.get('aic','?')}: {c.get('denominazionePackage','?')} [{c.get('descrizioneStatoAmministrativo','?')}]")
        if len(confezioni) > 3:
            print(f"       ... e altre {len(confezioni)-3} confezioni")
        print()


def import_prices(csv_path):
    print(f"=== Importazione prezzi da: {csv_path} ===\n")

    if not os.path.exists(csv_path):
        print(f"[ERRORE] File non trovato: {csv_path}")
        return

    existing = load_existing()
    aifa_by_name = {d["nome"].lower(): d for d in existing.get("farmaci", []) if d.get("fonte") == "AIFA"}
    manual_drugs = [d for d in existing.get("farmaci", []) if d.get("fonte") != "AIFA"]

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        fieldnames = reader.fieldnames or []
        print(f"Campi CSV trovati: {fieldnames}\n")

        aic_field = None
        prezzo_field = None
        for fn in fieldnames:
            fl = fn.lower().strip()
            if "aic" in fl and "codice" in fl:
                aic_field = fn
            elif "prezzo" in fl or "costo" in fl:
                prezzo_field = fn

        if not aic_field:
            for fn in fieldnames:
                if "aic" in fn.lower():
                    aic_field = fn
                    break

        if not aic_field:
            print("[ERRORE] Impossibile trovare colonna AIC nel CSV")
            print("Campi disponibili:", fieldnames)
            return

        print(f"Colonna AIC: {aic_field}")
        if prezzo_field:
            print(f"Colonna prezzo: {prezzo_field}")
        print()

        aic_to_conf = {}
        for drug in aifa_by_name.values():
            for conf in drug.get("confezioni", []):
                aic_code_conf = conf.get("aic")
                if aic_code_conf:
                    aic_to_conf[aic_code_conf] = conf

        updated = 0
        for row in reader:
            aic_code = row.get(aic_field, "").strip().strip('"')
            prezzo = row.get(prezzo_field, "").strip().strip('"') if prezzo_field else ""

            if not aic_code:
                continue

            conf = aic_to_conf.get(aic_code)
            if conf and prezzo_field:
                conf["prezzo"] = prezzo
                updated += 1

        if updated > 0:
            save({"farmaci": manual_drugs + list(aifa_by_name.values())})
            print(f"\n[OK] {updated} confezioni aggiornate con prezzi")
        else:
            print("\n[Nessuna corrispondenza trovata tra AIC del CSV e confezioni nel database]")


if __name__ == "__main__":
    if "--search" in sys.argv:
        idx = sys.argv.index("--search")
        if idx + 1 < len(sys.argv):
            search_drugs(sys.argv[idx + 1])
        else:
            print("Uso: python -m backend.app.scripts.sync_aifa --search <query>")

    elif "--import-prices" in sys.argv:
        idx = sys.argv.index("--import-prices")
        if idx + 1 < len(sys.argv):
            import_prices(sys.argv[idx + 1])
        else:
            print("Uso: python -m backend.app.scripts.sync_aifa --import-prices <csv_file>")

    else:
        full_sync()
