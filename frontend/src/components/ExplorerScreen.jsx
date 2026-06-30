// src/components/ExplorerScreen.jsx
import { useState, useMemo, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { styles, colors } from "../styles";

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const CATEGORIES = [
  { key: 'patologia', color: colors.nodePatologia, label: 'Patologie' },
  { key: 'sintomo', color: colors.nodeSintomo, label: 'Sintomi' },
  { key: 'eta', color: colors.nodeEta, label: "Eta'" },
  { key: 'stile_vita', color: colors.nodeStileVita, label: 'Stile di Vita' },
];

export default function ExplorerScreen({ navigateBack, graph, handleNodeClick }) {
  const graphRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeHoverRow, setActiveHoverRow] = useState(null);
  const [visibleCategories, setVisibleCategories] = useState(
    new Set(CATEGORIES.map(c => c.key))
  );

  if (!graph || !graph.nodes || !graph.links) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ color: colors.textSecondary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SpinnerIcon /> Caricamento del grafo...
        </div>
      </div>
    );
  }

  // Filter graph by visible categories
  const filteredGraph = useMemo(() => {
    const visibleNodes = new Set(
      graph.nodes.filter(n => visibleCategories.has(n.type)).map(n => n.id)
    );
    const nodes = graph.nodes.filter(n => visibleNodes.has(n.id));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = graph.links.filter(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });
    return { nodes, links };
  }, [graph, visibleCategories]);

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

  const toggleCategory = (key) => {
    setVisibleCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div style={styles.page}>
      {/* LEFT PANEL */}
      <div style={styles.left}>
        <button style={styles.backButton} onClick={navigateBack}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Home
        </button>

        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Esplora il Grafo
        </h2>
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Consulta i nodi clinici e le correlazioni. Usa i filtri per mostrare solo alcune categorie.
        </p>

        {/* Category Filters */}
        <div style={{ ...localStyles.filterBox, animation: 'slideUp 0.4s ease 0.05s both' }}>
          <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Filtra per Categoria</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CATEGORIES.map(({ key, color, label }) => {
              const isActive = visibleCategories.has(key);
              const count = graph.nodes.filter(n => n.type === key).length;
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: `1px solid ${isActive ? `${color}40` : colors.border}`,
                    background: isActive ? `${color}08` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                    userSelect: 'none',
                  }}
                  onClick={() => toggleCategory(key)}
                >
                  <div style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    border: `1.5px solid ${isActive ? color : colors.textMuted}`,
                    background: isActive ? color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms ease',
                    flexShrink: 0,
                  }}>
                    {isActive && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    opacity: isActive ? 1 : 0.4,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    color: isActive ? colors.textPrimary : colors.textMuted,
                    fontSize: 12.5,
                    fontWeight: 500,
                    flex: 1,
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: colors.textMuted,
                    fontWeight: 600,
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ ...localStyles.searchBox, animation: 'slideUp 0.4s ease 0.1s both' }}>
          <div style={{ ...styles.sectionTitle, color: colors.info, marginBottom: 10 }}>
            <SearchIcon /> Cerca Nodo
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Es. Polmonite, Febbre, Fumo..."
              style={{ ...localStyles.searchInput, paddingLeft: 32 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => {
                e.target.style.borderColor = colors.borderActive;
                e.target.style.boxShadow = `0 0 0 3px ${colors.accentLight}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.border;
                e.target.style.boxShadow = 'none';
              }}
            />
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }}>
              <SearchIcon />
            </div>
          </div>
        </div>

        {/* Search Results */}
        {searchTerm.trim() && (
          <div style={{ animation: 'slideUp 0.2s ease both' }}>
            <div style={{ ...styles.sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span>Risultati</span>
              <span style={{ background: colors.accentLight, color: colors.accent, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                {filteredNodes.length}
              </span>
            </div>
            <div style={localStyles.resultsContainer}>
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node) => (
                  <div
                    key={node.id}
                    style={{
                      ...localStyles.resultItem,
                      background: activeHoverRow === node.id ? colors.bgHover : 'transparent',
                      borderLeft: activeHoverRow === node.id ? `2px solid ${node.color}` : '2px solid transparent',
                    }}
                    onMouseEnter={() => setActiveHoverRow(node.id)}
                    onMouseLeave={() => setActiveHoverRow(null)}
                    onClick={() => {
                      eseguiFocusSuNodo(node);
                      handleNodeClick(node);
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
                    <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, flex: 1 }}>{node.id}</span>
                    <span style={{ fontSize: 9, color: node.color, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', background: `${node.color}12`, padding: '2px 6px', borderRadius: 4 }}>
                      {node.type}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 0', fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>Nessun nodo trovato.</div>
              )}
            </div>
          </div>
        )}

        {/* Stats in sidebar when no search */}
        {!searchTerm.trim() && (
          <div style={{ ...localStyles.legendBox, animation: 'slideUp 0.4s ease 0.15s both' }}>
            <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Statistiche</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: colors.textSecondary }}>Nodi visibili</span>
                <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{filteredGraph.nodes.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: colors.textSecondary }}>Collegamenti</span>
                <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{filteredGraph.links.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: colors.textSecondary }}>Totale nodi</span>
                <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{graph.nodes.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Graph */}
      <div style={styles.right}>
        {/* Stats bar */}
        <div style={localStyles.statsBar}>
          <span>Nodi: <strong style={{ color: colors.textPrimary }}>{filteredGraph.nodes.length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Links: <strong style={{ color: colors.textPrimary }}>{filteredGraph.links.length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Patologie: <strong style={{ color: colors.nodePatologia }}>{filteredGraph.nodes.filter(n => n.type === 'patologia').length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Sintomi: <strong style={{ color: colors.nodeSintomo }}>{filteredGraph.nodes.filter(n => n.type === 'sintomo').length}</strong></span>
        </div>

        <ForceGraph2D
          ref={graphRef}
          graphData={filteredGraph}
          nodeColor={(node) => (node === hoveredNode ? '#ffffff' : node.color)}
          nodeRelSize={5}
          nodeVal={(node) => (node.type === "patologia" ? 2.5 : 0.8)}
          linkWidth={1}
          linkColor={() => "rgba(255, 255, 255, 0.5)"}
          linkLabel={(link) => `<span style="color:#fff; background:${colors.bgSurface}; padding:6px 10px; border-radius:6px; font-size:11px; border:1px solid ${colors.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.3)">${link.relazione || "COLLEGAMENTO"}</span>`}
          nodeLabel={(node) => `<span style="color:${colors.textPrimary}; background:${colors.bgSurface}; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600; border:1px solid ${colors.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.3)">${node.id} <span style="color:${colors.textMuted}; font-weight:400; font-size:10px">${node.type.toUpperCase()}</span></span>`}
          onNodeClick={(node) => {
            eseguiFocusSuNodo(node);
            handleNodeClick(node);
          }}
          onNodeHover={(node) => {
            setHoveredNode(node);
            document.body.style.cursor = node ? 'pointer' : 'default';
          }}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const localStyles = {
  filterBox: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  searchBox: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.bgDeep,
    color: colors.textPrimary,
    fontSize: 12.5,
    outline: 'none',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
  },
  resultsContainer: {
    maxHeight: 200,
    overflow: 'auto',
    marginBottom: 12,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    marginBottom: 2,
    gap: 10,
  },
  legendBox: {
    background: colors.bgSurface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: 16,
    marginTop: 'auto',
  },
  statsBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 14px',
    background: 'rgba(10, 22, 40, 0.85)',
    backdropFilter: 'blur(8px)',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 11,
    color: colors.textSecondary,
    zIndex: 10,
    fontWeight: 500,
  },
};
