import os
import streamlit as st
import requests
import networkx as nx
import plotly.graph_objects as go

API_BASE_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000")

st.set_page_config(page_title="ClinGraph CDSS", page_icon="🩺", layout="wide")

if "sintomi" not in st.session_state:
    st.session_state.sintomi = []
if "risultati" not in st.session_state:
    st.session_state.risultati = []
if "graph_data" not in st.session_state:
    st.session_state.graph_data = None
if "page" not in st.session_state:
    st.session_state.page = "welcome"
if "selected_pathology" not in st.session_state:
    st.session_state.selected_pathology = None
if "selected_exam" not in st.session_state:
    st.session_state.selected_exam = None
if "exam_filter" not in st.session_state:
    st.session_state.exam_filter = ""


def api_get(path):
    try:
        r = requests.get(f"{API_BASE_URL}{path}", timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def api_post(path, data):
    try:
        r = requests.post(f"{API_BASE_URL}{path}", json=data, timeout=10)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def build_graph(links, input_sintomi=None, detected_pathologies=None):
    input_sintomi = input_sintomi or []
    detected_pathologies = detected_pathologies or []
    G = nx.DiGraph()

    for link in links:
        s = link.get("source", "")
        t = link.get("target", "")
        rel = link.get("relazione", "")
        G.add_edge(s, t, label=rel)

    node_colors = []
    for node in G.nodes():
        norm = node.lower().strip()
        if norm in [p.lower().strip() for p in detected_pathologies]:
            node_colors.append("#ef4444")
        elif norm in [s.lower().strip() for s in input_sintomi]:
            node_colors.append("#22d3ee")
        else:
            node_colors.append("#6366f1")

    return G, node_colors


def plot_graph(G, node_colors, height=500):
    if len(G.nodes()) == 0:
        st.info("Nessun nodo da visualizzare.")
        return

    pos = nx.spring_layout(G, k=2, iterations=50, seed=42)

    edge_x, edge_y = [], []
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])

    edge_trace = go.Scatter(x=edge_x, y=edge_y, line=dict(width=0.5, color="#888"),
                            hoverinfo="none", mode="lines")

    node_x = [pos[n][0] for n in G.nodes()]
    node_y = [pos[n][1] for n in G.nodes()]
    node_text = list(G.nodes())

    node_trace = go.Scatter(
        x=node_x, y=node_y, mode="markers+text", text=node_text,
        textposition="top center", textfont=dict(size=9),
        hoverinfo="text",
        marker=dict(size=12, color=node_colors, line=dict(width=1, color="#fff")),
    )

    fig = go.Figure(data=[edge_trace, node_trace],
                    layout=go.Layout(showlegend=False, hovermode="closest",
                                     margin=dict(b=0, l=0, r=0, t=0),
                                     xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                                     yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                                     height=height))
    st.plotly_chart(fig, use_container_width=True)


# ── WELCOME ──
def page_welcome():
    st.title("🩺 ClinGraph CDSS")
    st.caption("Clinical Decision Support System basato su grafi delle conoscenze mediche")

    st.warning("**⚠️ DISCLAIMER - SISTEMA IN FASE DI TEST**: "
               "Questo sistema e' attualmente in fase di sviluppo e test. "
               "Tutti i file delle patologie e degli esami diagnostici presenti nel sistema sono stati "
               "generati automaticamente da software di intelligenza artificiale e **non sono stati revisionati** "
               "da professionisti medici. Di conseguenza, le informazioni contenute **sono prive di garanzia di verita' "
               "scientifica** e non sono state sottoposte a verifica clinica. "
               "Lo strumento ha finalita' puramente educative e informative. "
               "**Non sostituisce in alcun modo il giudizio clinico del medico** e non deve essere utilizzato "
               "per prendere decisioni cliniche riguardo alla diagnosi o al trattamento di patologie.")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        if st.button("🔬 Diagnosi Assistita", use_container_width=True):
            st.session_state.page = "diagnosis"
            st.rerun()
    with col2:
        if st.button("📋 Esami Clinici", use_container_width=True):
            st.session_state.page = "exams"
            st.rerun()
    with col3:
        if st.button("🗺️ Esplora Grafo", use_container_width=True):
            data = api_get("/grafo")
            if data:
                st.session_state.graph_data = data.get("links", [])
            st.session_state.page = "explorer"
            st.rerun()
    with col4:
        if st.button("📋 Richieste Pubbliche", use_container_width=True):
            st.session_state.page = "requests"
            st.rerun()

    st.divider()
    st.subheader("Richieste in attesa")
    data = api_get("/richieste-pubbliche")
    if data and data.get("richieste"):
        for r in data["richieste"][:10]:
            with st.expander(f"📌 {r.get('titolo', 'Senza titolo')} — {r.get('stato', '')}"):
                st.write(r.get("note", ""))
                st.caption(f"Autore: {r.get('nome_autore', 'Anonimo')} | {r.get('ambito', '')}")
    else:
        st.info("Nessuna richiesta pubblica al momento.")


# ── EXAMS (Esami Clinici) ──
def page_exams():
    st.header("📋 Esami Clinici")

    if st.button("← Indietro"):
        st.session_state.page = "welcome"
        st.rerun()

    # Carica tutti gli esami
    data = api_get("/analisi-centralizzate")
    if not data or not data.get("analisi"):
        st.error("Impossibile caricare gli esami clinici.")
        return

    all_exams = data["analisi"]
    st.caption(f"Totale esami disponibili: {len(all_exams)}")

    # Filtro per tipo
    col1, col2 = st.columns([2, 1])
    with col1:
        search = st.text_input("🔍 Cerca esame per nome...", value=st.session_state.exam_filter)
    with col2:
        tipo_options = ["Tutti", "clinico", "laboratorio", "strumentale"]
        tipo_filter = st.selectbox("Filtra per tipo", options=tipo_options)

    # Filtra gli esami
    filtered_exams = all_exams

    if search:
        search_lower = search.lower()
        filtered_exams = [e for e in filtered_exams if search_lower in e.get("nome", "").lower()
                         or search_lower in e.get("descrizione", "").lower()]

    if tipo_filter and tipo_filter != "Tutti":
        filtered_exams = [e for e in filtered_exams if e.get("tipo", "").lower() == tipo_filter.lower()]

    st.caption(f"Esami trovati: {len(filtered_exams)}")

    # Raggruppa per tipo
    exams_by_tipo = {}
    for exam in filtered_exams:
        tipo = exam.get("tipo", "altro")
        if tipo not in exams_by_tipo:
            exams_by_tipo[tipo] = []
        exams_by_tipo[tipo].append(exam)

    # Mostra gli esami raggruppati
    for tipo, exams in sorted(exams_by_tipo.items()):
        with st.expander(f"📁 {tipo.upper()} ({len(exams)} esami)", expanded=(tipo_filter != "Tutti")):
            for exam in exams:
                col1, col2 = st.columns([4, 1])
                with col1:
                    st.markdown(f"**{exam.get('nome', 'N/A')}**")
                    st.caption(exam.get("descrizione", "")[:150] + "..." if len(exam.get("descrizione", "")) > 150 else exam.get("descrizione", ""))
                    if exam.get("patologie"):
                        st.caption(f"🔗 Patologie correlate: {', '.join(exam['patologie'][:3])}...")
                with col2:
                    if st.button("ℹ️ Dettagli", key=f"exam_{exam.get('nome', '')}"):
                        st.session_state.selected_exam = exam
                        st.session_state.page = "exam_detail"
                        st.rerun()


# ── EXAM DETAIL ──
def page_exam_detail():
    st.header("📋 Dettaglio Esame Clinico")

    if st.button("← Indietro"):
        st.session_state.page = "exams"
        st.rerun()

    exam = st.session_state.selected_exam
    if not exam:
        st.warning("Nessun esame selezionato.")
        return

    st.subheader(exam.get("nome", "Esame"))

    # Badge tipo
    tipo = exam.get("tipo", "")
    if tipo:
        st.badge(tipo)

    tabs = st.tabs(["Informazioni", "Patologie Correlate", "Body"])

    with tabs[0]:
        if exam.get("descrizione"):
            st.write(exam["descrizione"])
        if exam.get("preparazione"):
            st.markdown("**Preparazione:**")
            st.write(exam["preparazione"])
        if exam.get("esecuzione"):
            st.markdown("**Esecuzione:**")
            st.write(exam["esecuzione"])
        if exam.get("interpretazione"):
            st.markdown("**Interpretazione:**")
            st.write(exam["interpretazione"])
        if exam.get("tempo_risposta"):
            st.caption(f"⏱️ Tempo di risposta: {exam['tempo_risposta']}")
        if exam.get("costo_stimato"):
            st.caption(f"💰 Costo stimato: {exam['costo_stimato']}")

    with tabs[1]:
        patologie = exam.get("patologie", [])
        if patologie:
            for p in patologie:
                st.write(f"- {p}")
        else:
            st.info("Nessuna patologia correlata.")

    with tabs[2]:
        body = exam.get("body", "")
        if body:
            st.markdown(body)
        else:
            st.info("Nessun contenuto aggiuntivo disponibile.")


# ── DIAGNOSIS ──
def page_diagnosis():
    st.header("🔬 Diagnosi Assistita")

    if st.button("← Indietro"):
        st.session_state.page = "welcome"
        st.rerun()

    sintomi_db = api_get("/sintomi")
    db_list = [s["nome"] for s in (sintomi_db.get("sintomi", []) if sintomi_db else [])]

    with st.form("diagnosi_form"):
        col1, col2 = st.columns([3, 1])
        with col1:
            new_sintomo = st.selectbox("Aggiungi sintomo", options=[""] + db_list, index=0)
        with col2:
            custom = st.text_input("Oppure scrivi manualmente")

        submitted = st.form_submit_button("➕ Aggiungi")

    if submitted:
        sintomo = custom.strip() if custom.strip() else new_sintomo
        if sintomo and sintomo not in st.session_state.sintomi:
            st.session_state.sintomi.append(sintomo)

    if st.session_state.sintomi:
        st.subheader("Sintomi selezionati")
        cols = st.columns(min(len(st.session_state.sintomi), 4))
        for i, s in enumerate(st.session_state.sintomi):
            col = cols[i % len(cols)]
            if col.button(f"❌ {s}", key=f"rm_{i}"):
                st.session_state.sintomi.remove(s)
                st.rerun()

    if st.button("🔬 Elabora Diagnosi", type="primary", disabled=not st.session_state.sintomi):
        with st.spinner("Analisi in corso..."):
            data = api_post("/diagnosi", {"sintomi": st.session_state.sintomi})
            if data and data.get("diagnosi"):
                st.session_state.risultati = sorted(data["diagnosi"], key=lambda x: x.get("score", 0), reverse=True)

                links_data = api_get("/grafo")
                if links_data:
                    all_links = links_data.get("links", [])
                    detected = [r["patologia"] for r in st.session_state.risultati]
                    filtered = [l for l in all_links
                                if l.get("source", "").lower() in [s.lower() for s in st.session_state.sintomi + detected]
                                or l.get("target", "").lower() in [s.lower() for s in st.session_state.sintomi + detected]]
                    G, colors = build_graph(filtered, st.session_state.sintomi, detected)
                    st.session_state.graph_data = {"G": G, "colors": colors}

    if st.session_state.risultati:
        st.divider()
        st.subheader("Risultati")
        max_score = max(r.get("score", 0) for r in st.session_state.risultati) or 1
        for r in st.session_state.risultati:
            score = r.get("score", 0)
            pct = int(score / max_score * 100) if max_score else 0
            col1, col2 = st.columns([4, 1])
            with col1:
                st.progress(pct / 100, text=f"**{r.get('patologia', '?')}** — Score: {score}")
            with col2:
                if st.button("Dettagli", key=f"det_{r.get('patologia', '')}"):
                    st.session_state.selected_pathology = r.get("patologia", "")
                    st.session_state.page = "detail"
                    st.rerun()

    if st.session_state.graph_data and isinstance(st.session_state.graph_data, dict):
        st.divider()
        st.subheader("Grafo diagnostico")
        plot_graph(st.session_state.graph_data["G"], st.session_state.graph_data["colors"])


# ── EXPLORER ──
def page_explorer():
    st.header("🗺️ Esplora Grafo")

    if st.button("← Indietro"):
        st.session_state.page = "welcome"
        st.rerun()

    data = api_get("/grafo")
    if data and data.get("links"):
        links = data["links"]
        st.caption(f"{len(links)} collegamenti caricati")

        search = st.text_input("Cerca nodo...")
        if search:
            term = search.lower()
            links = [l for l in links if term in l.get("source", "").lower() or term in l.get("target", "").lower()]

        G, colors = build_graph(links)
        plot_graph(G, colors, height=600)
    else:
        st.error("Impossibile caricare il grafo.")


# ── DETAIL ──
def page_detail():
    st.header("📋 Dettaglio Patologia")

    if st.button("← Indietro"):
        st.session_state.page = "diagnosis"
        st.rerun()

    nome = st.session_state.selected_pathology
    if not nome:
        st.warning("Nessuna patologia selezionata.")
        return

    data = api_get(f"/patologia/{requests.utils.quote(nome)}")
    if not data:
        st.error("Patologia non trovata.")
        return

    st.subheader(data.get("patologia", nome))

    if data.get("ambito"):
        st.badge(data["ambito"])

    tabs = st.tabs(["Info", "Terapia", "Diagnosi", "Esami", "Sintomi"])

    with tabs[0]:
        if data.get("descrizione"):
            st.write(data["descrizione"])
        if data.get("caratteristiche_tipiche"):
            st.markdown("**Caratteristiche tipiche:**")
            st.write(data["caratteristiche_tipiche"])
        if data.get("prevalenza_gender"):
            st.caption(f"Prevalenza: {data['prevalenza_gender']}")
        if data.get("prevalenza_eta"):
            st.caption(f"Eta' target: {data.get('eta_target', '')} — {data['prevalenza_eta']}")

    with tabs[1]:
        if data.get("terapia"):
            st.write(data["terapia"])
        if data.get("farmaci"):
            st.markdown("**Farmaci:**")
            for f in data["farmaci"]:
                st.write(f"- {f}")
        if data.get("dosaggi"):
            st.json(data["dosaggi"])
        if data.get("linee_guida"):
            st.markdown("**Linee guida:**")
            for lg in data["linee_guida"]:
                st.write(f"- {lg}")

    with tabs[2]:
        if data.get("diagnosi"):
            st.write(data["diagnosi"])
        if data.get("diagnosi_differenziale"):
            st.markdown("**Diagnosi differenziale:**")
            for dd in data["diagnosi_differenziale"]:
                st.write(f"- {dd}")

    with tabs[3]:
        if data.get("esami_laboratorio"):
            st.write(data["esami_laboratorio"])

    with tabs[4]:
        if data.get("sintomi"):
            for s in data["sintomi"]:
                st.write(f"- {s}")


# ── REQUESTS ──
def page_requests():
    st.header("📋 Richieste Pubbliche")

    if st.button("← Indietro"):
        st.session_state.page = "welcome"
        st.rerun()

    data = api_get("/richieste-pubbliche")
    if data and data.get("richieste"):
        for r in data["richieste"]:
            with st.expander(f"📌 {r.get('titolo', 'Richiesta')} — {r.get('stato', '')}"):
                st.write(r.get("note", ""))
                st.caption(f"Autore: {r.get('nome_autore', 'Anonimo')} | {r.get('ambito', '')}")
    else:
        st.info("Nessuna richiesta pubblica.")


# ── ROUTER ──
pages = {
    "welcome": page_welcome,
    "diagnosis": page_diagnosis,
    "exams": page_exams,
    "exam_detail": page_exam_detail,
    "explorer": page_explorer,
    "detail": page_detail,
    "requests": page_requests,
}

pages.get(st.session_state.page, page_welcome)()

# ── FOOTER ──
st.divider()
with st.container():
    st.markdown("""
    > **Disclaimer:** ClinGraph e' uno strumento sperimentale a carattere puramente informativo e educativo, sviluppato e aggiornato da **DELELIMED**. Le informazioni contenute non costituiscono indicazioni cliniche ne' sostituiscono il parere di un medico. Per qualsiasi problematica di salute, consultare sempre un professionista sanitario qualificato.
    """)
    st.caption("ClinGraph | CDSS by **DELELIMED** — Edizione sperimentale")
