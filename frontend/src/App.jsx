// src/App.jsx
import { useState, useEffect } from "react";
import WelcomeScreen from "./components/WelcomeScreen";
import DiagnosisScreen from "./components/DiagnosisScreen";
import ExplorerScreen from "./components/ExplorerScreen";
import DetailScreen from "./components/DetailScreen";
import AdminScreen from "./components/AdminScreen";

const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? "" : "http://127.0.0.1:8000");

export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [sintomi, setSintomi] = useState("");
  const [risultati, setRisultati] = useState([]);
  const [graph, setGraph] = useState(null);
  const [selectedPathology, setSelectedPathology] = useState(null);
  const [rawLinks, setRawLinks] = useState([]);

  useEffect(() => {
    const fetchGrafo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/grafo`);
        const data = await res.json();
        setRawLinks(data.links);
        setGraph(buildGraph(data.links));
      } catch (e) {
        console.error("Errore API nel caricamento del grafo", e);
      }
    };
    fetchGrafo();
  }, []);

  const cleanInput = (text) => text.toLowerCase().split(",").map(s => s.trim()).filter(Boolean);

  const avviaDiagnosi = async () => {
    const list = cleanInput(sintomi);
    try {
      const res = await fetch(`${API_BASE_URL}/diagnosi`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ sintomi: list }),
      });
      const data = await res.json();
      const sorted = [...data.diagnosi].sort((a, b) => b.score - a.score);
      setRisultati(sorted);

      const rilevatePatologie = data.diagnosi.map(d => d.patologia.toLowerCase().trim());

      const filteredLinks = rawLinks.filter(l => {
        const sId = (typeof l.source === 'object' ? l.source.id : l.source).toLowerCase().trim();
        const tId = (typeof l.target === 'object' ? l.target.id : l.target).toLowerCase().trim();
        return list.includes(sId) || list.includes(tId) || rilevatePatologie.includes(sId) || rilevatePatologie.includes(tId);
      }).map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        relazione: l.relazione
      }));

      setGraph(buildGraph(filteredLinks, list, rilevatePatologie));
    } catch (e) {
      console.error("Errore nel calcolo diagnostico", e);
    }
  };

  const handleNodeClick = async (node) => {
    const nodeId = typeof node === 'object' ? node.id : node;
    const nodeType = node.type || "sintomo";

    if (nodeType === "patologia") {
      try {
        const res = await fetch(`${API_BASE_URL}/patologia/${encodeURIComponent(nodeId)}`);
        const data = await res.json();

        setSelectedPathology({
          patologia: data.patologia,
          descrizione: data.descrizione,
          immagine: data.immagine,
          caratteristiche_tipiche: data.caratteristiche_tipiche,
          ambito: data.ambito,
          terapia: data.terapia,
          diagnosi: data.diagnosi,
          esami_laboratorio: data.esami_laboratorio,
          sintomi: data.sintomi,
          stile_vita: data.stile_vita,
          eta_target: data.eta_target,
          diagnosi_differenziale: data.diagnosi_differenziale || [],
          prevalenza_gender: data.prevalenza_gender || "",
          prevalenza_eta: data.prevalenza_eta || "",
          farmaci: data.farmaci || [],
          dosaggi: data.dosaggi || {},
          linee_guida: data.linee_guida || [],
        });
        setScreen("detail");
      } catch (e) {
        console.error("Errore nel recupero della scheda patologia", e);
      }
    } else {
      const termNorm = nodeId.toLowerCase().trim();
      let nuoviSintomi = sintomi;
      if (!cleanInput(sintomi).includes(termNorm)) {
        nuoviSintomi = sintomi ? `${sintomi}, ${nodeId}` : nodeId;
        setSintomi(nuoviSintomi);
      }
      setScreen("diagnosis");

      const list = cleanInput(nuoviSintomi);
      const filteredLinks = rawLinks.filter(l => {
        const sId = (typeof l.source === 'object' ? l.source.id : l.source).toLowerCase().trim();
        const tId = (typeof l.target === 'object' ? l.target.id : l.target).toLowerCase().trim();
        return list.includes(sId) || list.includes(tId);
      }).map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        relazione: l.relazione
      }));

      setGraph(buildGraph(filteredLinks, list, []));
    }
  };

  const buildGraph = (links, inputSintomi = [], rilevatePatologie = []) => {
    const nodesMap = new Map();

    links.forEach(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;

      if (!nodesMap.has(sId)) {
        nodesMap.set(sId, { id: sId, rels: new Set(), isSource: false });
      }
      if (!nodesMap.has(tId)) {
        nodesMap.set(tId, { id: tId, rels: new Set(), isSource: false });
      }

      const sourceNode = nodesMap.get(sId);
      sourceNode.rels.add(l.relazione);
      sourceNode.isSource = true;

      const targetNode = nodesMap.get(tId);
      targetNode.rels.add(l.relazione);
    });

    const nodes = Array.from(nodesMap.values()).map(n => {
      const norm = n.id.toLowerCase().trim();
      let type = "sintomo";
      let color = "#06b6d4";

      if (rilevatePatologie.includes(norm) || n.isSource) {
        type = "patologia";
        color = "#ef4444";
      } else if (n.rels.has("TARGET_ETA")) {
        type = "eta";
        color = "#a855f7";
      } else if (n.rels.has("FATTORE_RISCHIO")) {
        type = "stile_vita";
        color = "#eab308";
      } else if (inputSintomi.includes(norm)) {
        type = "sintomo";
        color = "#22d3ee";
      }

      return { id: n.id, type, color };
    });

    const cleanLinks = links.map(l => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      relazione: l.relazione
    }));

    return { nodes, links: cleanLinks };
  };

  const handleOpenExplorer = () => {
    setGraph(buildGraph(rawLinks));
    setScreen("explorer");
  };

  switch (screen) {
    case "welcome":
      return <WelcomeScreen setScreen={setScreen} onOpenExplorer={handleOpenExplorer} />;
    case "diagnosis":
      return <DiagnosisScreen setScreen={setScreen} sintomi={sintomi} setSintomi={setSintomi} risultati={risultati} avviaDiagnosi={avviaDiagnosi} graph={graph} handleNodeClick={handleNodeClick} />;
    case "explorer":
      return <ExplorerScreen navigateBack={() => setScreen("welcome")} graph={graph} handleNodeClick={handleNodeClick} />;
    case "detail":
      return <DetailScreen selectedPathology={selectedPathology} navigateBack={() => setScreen("explorer")} onNavigateToPathology={(nome) => handleNodeClick({ id: nome, type: "patologia" })} />;
    case "admin":
      return <AdminScreen navigateBack={() => setScreen("welcome")} />;
    default:
      return <WelcomeScreen setScreen={setScreen} onOpenExplorer={handleOpenExplorer} />;
  }
}
