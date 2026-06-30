// src/components/ExplorerScreen.jsx
import { useState, useMemo, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { styles } from "../styles";

export default function ExplorerScreen({ navigateBack, graph, handleNodeClick }) {
  const graphRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeHoverRow, setActiveHoverRow] = useState(null);

  // Protezione contro la schermata bianca se il grafo non è ancora pronto
  if (!graph || !graph.nodes || !graph.links) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ color: "white" }}>Caricamento del grafo in corso...</div>
      </div>
    );
  }

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return graph.nodes.filter(node => node.id.toLowerCase().includes(term));
  }, [graph.nodes, searchTerm]);

  const eseguiFocusSuNodo = (node) => {
    if (graphRef.current && node && node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 800);
      graphRef.current.zoom(3.5, 800);
    }
  };

  return (
    <div style={styles.page}>
      {/* BARRA LATERALE SINISTRA */}
      <div style={styles.left}>
        <button style={styles.backButton} onClick={navigateBack}>
          ← Torna alla Home
        </button>

        <h2 style={{ fontSize: 20, margin: "10px 0 5px 0" }}>Esplora il Grafo</h2>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          Consulta liberamente i nodi clinici, le patologie e le loro correlazioni.
        </p>

        {/* INPUT DI RICERCA */}
        <div style={styles.searchBox}>
          <div style={{ ...styles.sectionTitle, color: "#818cf8" }}>Cerca Nodo</div>
          <input
            type="text"
            placeholder="Es. Polmonite, Febbre, Fumo..."
            style={{ ...styles.input, marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* RISULTATI DELLA RICERCA RAPIDA */}
        {searchTerm.trim() && (
          <div>
            <div style={styles.sectionTitle}>Risultati ({filteredNodes.length})</div>
            <div style={styles.searchResultsContainer}>
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node) => (
                  <div
                    key={node.id}
                    style={{
                      ...styles.searchResultItem,
                      background: activeHoverRow === node.id ? "rgba(255,255,255,0.05)" : "transparent",
                    }}
                    onMouseEnter={() => setActiveHoverRow(node.id)}
                    onMouseLeave={() => setActiveHoverRow(null)}
                    onClick={() => {
                      eseguiFocusSuNodo(node);
                      handleNodeClick(node);
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: node.color,
                        marginRight: 10,
                      }}
                    />
                    <span style={{ color: "white", fontWeight: "500" }}>{node.id}</span>
                    <span style={{ marginLeft: "auto", fontSize: 11, color: "#475569", textTransform: "uppercase" }}>
                      {node.type}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: "10px 12px", fontSize: 13, color: "#475569" }}>
                  Nessun nodo trovato.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AREA DEL GRAFO INTERATTIVO */}
      <div style={styles.right}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graph}
          nodeColor={(node) => (node === hoveredNode ? "#ffffff" : node.color)}
          nodeRelSize={7}
          nodeVal={(node) => (node.type === "patologia" ? 3 : 1)}
          linkWidth={1.5}
          linkColor={() => "rgba(255, 255, 255, 0.15)"}
          linkLabel={(link) => `<span style="color:#cbd5e1; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; border:1px solid #334155">${link.relazione || "COLLEGAMENTO"}</span>`}
          nodeLabel={(node) => `<span style="color:white; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold; border:1px solid #334155">${node.id} (${node.type.toUpperCase()})</span>`}
          onNodeClick={(node) => {
            eseguiFocusSuNodo(node);
            handleNodeClick(node);
          }}
          onNodeHover={(node) => setHoveredNode(node)} // Rimosso il focus automatico sull'hover che rompeva tutto
        />
      </div>
    </div>
  );
}