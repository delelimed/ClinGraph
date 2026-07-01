// src/components/ExplorerScreen.jsx
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { styles, colors } from "../styles";
import Footer from "./Footer";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

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

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const CATEGORIES = [
  { key: 'patologia', color: colors.nodePatologia, label: 'Patologie' },
  { key: 'sintomo', color: colors.nodeSintomo, label: 'Sintomi' },
  { key: 'eta', color: colors.nodeEta, label: "Eta'" },
  { key: 'stile_vita', color: colors.nodeStileVita, label: 'Stile di Vita' },
];

const SORT_OPTIONS = [
  { key: 'centrality', label: 'Centralita\u2019' },
  { key: 'betweenness', label: 'Betweenness' },
  { key: 'degree', label: 'Grado' },
  { key: 'name', label: 'Nome' },
];

// ─── Network Metrics Computation ───────────────────────────────────

function computeMetrics(graph) {
  const { nodes, links } = graph;
  if (!nodes.length || !links.length) return { nodes: new Map() };

  const nodeIds = new Set(nodes.map(n => n.id));
  const adj = new Map();
  nodeIds.forEach(id => adj.set(id, new Set()));

  links.forEach(l => {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (nodeIds.has(s) && nodeIds.has(t)) {
      adj.get(s).add(t);
      adj.get(t).add(s);
    }
  });

  // Degree centrality
  const degree = new Map();
  nodeIds.forEach(id => {
    degree.set(id, adj.get(id).size);
  });

  const maxDegree = Math.max(...degree.values(), 1);

  // Betweenness centrality (Brandes' algorithm - sampling for performance)
  const betweenness = new Map();
  nodeIds.forEach(id => betweenness.set(id, 0));

  // For large graphs, sample a subset of source nodes
  const allNodeIds = Array.from(nodeIds);
  const sampleSize = Math.min(allNodeIds.length, 300);
  const sampled = allNodeIds.length <= 300
    ? allNodeIds
    : allNodeIds.sort(() => Math.random() - 0.5).slice(0, sampleSize);

  sampled.forEach(source => {
    const stack = [];
    const predecessors = new Map();
    const sigma = new Map();
    const delta = new Map();
    const dist = new Map();

    nodeIds.forEach(id => {
      predecessors.set(id, []);
      sigma.set(id, 0);
      dist.set(id, -1);
      delta.set(id, 0);
    });

    sigma.set(source, 1);
    dist.set(source, 0);
    const queue = [source];

    while (queue.length > 0) {
      const v = queue.shift();
      stack.push(v);
      adj.get(v).forEach(w => {
        if (dist.get(w) < 0) {
          dist.set(w, dist.get(v) + 1);
          queue.push(w);
        }
        if (dist.get(w) === dist.get(v) + 1) {
          sigma.set(w, sigma.get(w) + sigma.get(v));
          predecessors.get(w).push(v);
        }
      });
    }

    while (stack.length > 0) {
      const w = stack.pop();
      predecessors.get(w).forEach(v => {
        delta.set(v, delta.get(v) + (sigma.get(v) / sigma.get(w)) * (1 + delta.get(w)));
      });
      if (w !== source) {
        betweenness.set(w, betweenness.get(w) + delta.get(w));
      }
    }
  });

  // Normalize betweenness
  const n = nodeIds.size;
  const normFactor = n > 2 ? (n - 1) * (n - 2) : 1;
  const maxBetweenness = Math.max(...betweenness.values(), 1);
  nodeIds.forEach(id => {
    betweenness.set(id, betweenness.get(id) / normFactor);
  });

  // Combined centrality score (weighted average)
  const centrality = new Map();
  nodeIds.forEach(id => {
    const deg = degree.get(id) / maxDegree;
    const bet = betweenness.get(id) / (maxBetweenness / normFactor || 1);
    centrality.set(id, 0.4 * deg + 0.6 * bet);
  });

  return {
    nodes: nodeIds,
    degree,
    betweenness,
    centrality,
    maxDegree,
    maxBetweenness: maxBetweenness / normFactor || 1,
  };
}

// ─── Main Component ────────────────────────────────────────────────

export default function ExplorerScreen({ navigateBack, graph, handleNodeClick }) {
  const isMobile = useIsMobile();
  const graphRef = useRef();
  const [searchTerm, setSearchTerm] = useState("");
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeHoverRow, setActiveHoverRow] = useState(null);
  const [visibleCategories, setVisibleCategories] = useState(
    new Set(CATEGORIES.map(c => c.key))
  );
  const [hiddenNodes, setHiddenNodes] = useState(new Set());
  const [sortBy, setSortBy] = useState('centrality');
  const [showMetrics, setShowMetrics] = useState(true);
  const [metricsComputed, setMetricsComputed] = useState(false);
  const [metricsProgress, setMetricsProgress] = useState('');
  const [panelTab, setPanelTab] = useState('filters'); // 'filters' | 'nodes'
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const metricsRef = useRef(null);

  // Compute metrics asynchronously
  useEffect(() => {
    if (!graph || !graph.nodes.length || !graph.links.length) return;
    setMetricsProgress('Calcolo degree...');
    // Use setTimeout to allow UI to update
    const timer = setTimeout(() => {
      const metrics = computeMetrics(graph);
      // Attach metrics to graph nodes
      graph.nodes.forEach(n => {
        n.degree = metrics.degree.get(n.id) || 0;
        n.betweenness = metrics.betweenness.get(n.id) || 0;
        n.centrality = metrics.centrality.get(n.id) || 0;
      });
      metricsRef.current = metrics;
      setMetricsComputed(true);
      setMetricsProgress('');
    }, 50);
    return () => clearTimeout(timer);
  }, [graph]);

  if (!graph || !graph.nodes || !graph.links) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ color: colors.textSecondary, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SpinnerIcon /> Caricamento del grafo...
        </div>
      </div>
    );
  }

  // ─── MOBILE LAYOUT ───────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={mobPage.page}>
        {/* Mobile Header */}
        <div style={mobPage.header}>
          <button style={mobPage.backBtn} onClick={navigateBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h2 style={mobPage.title}>Esplora il Grafo</h2>
          <button style={mobPage.panelToggle} onClick={() => setShowMobilePanel(!showMobilePanel)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </div>

        {/* Mobile Stats Bar */}
        <div style={mobPage.statsBar}>
          <span>Nodi: <strong style={{ color: colors.textPrimary }}>{filteredGraph.nodes.length}</strong></span>
          <span style={{ color: colors.border }}>|</span>
          <span>Links: <strong style={{ color: colors.textPrimary }}>{filteredGraph.links.length}</strong></span>
          {hiddenNodes.size > 0 && (
            <>
              <span style={{ color: colors.border }}>|</span>
              <span style={{ color: colors.warning }}>Nascosti: <strong>{hiddenNodes.size}</strong></span>
            </>
          )}
        </div>

        {/* Graph (full screen behind panel) */}
        <div style={mobPage.graphArea}>
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredGraph}
            nodeColor={(node) => (node === hoveredNode ? '#ffffff' : node.color)}
            nodeRelSize={4}
            nodeVal={(node) => (node.type === "patologia" ? 2.5 : 0.8)}
            linkWidth={0.5}
            linkColor={() => "rgba(255, 255, 255, 0.3)"}
            onNodeClick={(node) => { handleNodeClick(node); }}
            onNodeHover={(node) => { setHoveredNode(node); document.body.style.cursor = node ? 'pointer' : 'default'; }}
          />
        </div>

        {/* Mobile Panel Overlay */}
        {showMobilePanel && (
          <>
            <div style={mobPage.panelBackdrop} onClick={() => setShowMobilePanel(false)} />
            <div style={mobPage.panel}>
              <div style={mobPage.panelHeader}>
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>Filtri e Nodi</span>
                <button style={mobPage.closeBtn} onClick={() => setShowMobilePanel(false)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div style={mobPage.panelScroll}>
                {/* Tab Switcher */}
                <div style={mobPage.tabBar}>
                  <button style={{ ...mobPage.tab, ...(panelTab === 'filters' ? mobPage.tabActive : {}) }} onClick={() => setPanelTab('filters')}>Filtri</button>
                  <button style={{ ...mobPage.tab, ...(panelTab === 'nodes' ? mobPage.tabActive : {}) }} onClick={() => setPanelTab('nodes')}>Nodi ({filteredGraph.nodes.length})</button>
                </div>

                {panelTab === 'filters' && (
                  <>
                    {/* Category Filters */}
                    <div style={mobPage.filterBox}>
                      <div style={mobPage.sectionTitle}>Filtra per Categoria</div>
                      {CATEGORIES.map(({ key, color, label }) => {
                        const isActive = visibleCategories.has(key);
                        const counts = typeCounts[key] || { total: 0, visible: 0 };
                        return (
                          <div key={key} style={{ ...mobPage.filterRow, borderColor: isActive ? `${color}40` : colors.border, background: isActive ? `${color}08` : 'transparent' }} onClick={() => toggleCategory(key)}>
                            <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${isActive ? color : colors.textMuted}`, background: isActive ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {isActive && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, opacity: isActive ? 1 : 0.4, flexShrink: 0 }} />
                            <span style={{ color: isActive ? colors.textPrimary : colors.textMuted, fontSize: 12.5, fontWeight: 500, flex: 1 }}>{label}</span>
                            <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>{counts.visible}/{counts.total}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick Actions */}
                    <div style={mobPage.filterBox}>
                      <div style={mobPage.sectionTitle}>Azioni Rapide</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={mobPage.quickBtn} onClick={showAllNodes}><EyeIcon /> Mostra Tutti</button>
                        <button style={mobPage.quickBtn} onClick={hideAllNodes}><EyeOffIcon /> Nascondi Tutti</button>
                      </div>
                    </div>

                    {/* Search */}
                    <div style={mobPage.filterBox}>
                      <div style={mobPage.sectionTitle}><SearchIcon /> Cerca Nodo</div>
                      <div style={{ position: 'relative' }}>
                        <input type="text" placeholder="Es. Polmonite, Febbre..." style={{ ...mobPage.input, paddingLeft: 32 }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none' }}><SearchIcon /></div>
                      </div>
                    </div>

                    {searchTerm.trim() && (
                      <div>
                        <div style={{ ...mobPage.sectionTitle, justifyContent: 'space-between' }}>
                          <span>Risultati</span>
                          <span style={{ background: colors.accentLight, color: colors.accent, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{filteredNodes.length}</span>
                        </div>
                        {filteredNodes.length > 0 ? filteredNodes.map((node) => (
                          <div key={node.id} style={{ ...mobPage.searchResult, borderLeft: activeHoverRow === node.id ? `2px solid ${node.color}` : '2px solid transparent' }} onClick={() => { eseguiFocusSuNodo(node); handleNodeClick(node); setShowMobilePanel(false); }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
                            <span style={{ color: colors.textPrimary, fontWeight: 500, fontSize: 13, flex: 1 }}>{node.id}</span>
                          </div>
                        )) : <div style={{ padding: '12px 0', fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>Nessun nodo trovato.</div>}
                      </div>
                    )}
                  </>
                )}

                {panelTab === 'nodes' && (
                  <>
                    <div style={mobPage.filterBox}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={mobPage.sectionTitle}>Ordina per</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={mobPage.quickBtnSmall} onClick={showAllNodes}><EyeIcon /></button>
                          <button style={mobPage.quickBtnSmall} onClick={hideAllNodes}><EyeOffIcon /></button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {SORT_OPTIONS.map(opt => (
                          <button key={opt.key} style={{ ...mobPage.sortChip, ...(sortBy === opt.key ? mobPage.sortChipActive : {}) }} onClick={() => setSortBy(opt.key)}>{opt.label}</button>
                        ))}
                      </div>
                    </div>
                    {metricsComputed && Object.entries(sortedNodeList).map(([type, nodes]) => {
                      const catInfo = CATEGORIES.find(c => c.key === type);
                      if (!catInfo) return null;
                      return (
                        <div key={type} style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer' }} onClick={() => toggleAllNodesOfType(type)}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: catInfo.color, textTransform: 'uppercase' }}>{catInfo.label}</span>
                            <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto' }}>{typeCounts[type]?.visible || 0}/{typeCounts[type]?.total || 0}</span>
                          </div>
                          {nodes.slice(0, 30).map(node => (
                            <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', borderRadius: 6, cursor: 'pointer', opacity: node.hidden ? 0.4 : 1 }} onClick={() => toggleNode(node.id)}>
                              <span style={{ color: node.hidden ? colors.textMuted : colors.textPrimary, fontSize: 11.5, flex: 1, textDecoration: node.hidden ? 'line-through' : 'none' }}>{node.id}</span>
                            </div>
                          ))}
                          {nodes.length > 30 && <div style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', padding: '4px 0' }}>+{nodes.length - 30} altri...</div>}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <Footer />
      </div>
    );
  }

  // Filter graph by visible categories and hidden nodes
  const filteredGraph = useMemo(() => {
    const visibleNodes = new Set(
      graph.nodes
        .filter(n => visibleCategories.has(n.type) && !hiddenNodes.has(n.id))
        .map(n => n.id)
    );
    const nodes = graph.nodes.filter(n => visibleNodes.has(n.id));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = graph.links.filter(l => {
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(sId) && nodeIds.has(tId);
    });
    return { nodes, links };
  }, [graph, visibleCategories, hiddenNodes]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return graph.nodes.filter(node => node.id.toLowerCase().includes(term));
  }, [graph.nodes, searchTerm]);

  // Sorted node list for the panel
  const sortedNodeList = useMemo(() => {
    const visible = graph.nodes
      .filter(n => visibleCategories.has(n.type))
      .map(n => ({
        ...n,
        hidden: hiddenNodes.has(n.id),
        degree: n.degree || 0,
        betweenness: n.betweenness || 0,
        centrality: n.centrality || 0,
      }));

    visible.sort((a, b) => {
      if (sortBy === 'name') return a.id.localeCompare(b.id);
      if (sortBy === 'degree') return b.degree - a.degree;
      if (sortBy === 'betweenness') return b.betweenness - a.betweenness;
      return b.centrality - a.centrality;
    });

    // Group by type
    const groups = {};
    visible.forEach(n => {
      if (!groups[n.type]) groups[n.type] = [];
      groups[n.type].push(n);
    });
    return groups;
  }, [graph.nodes, visibleCategories, hiddenNodes, sortBy]);

  const eseguiFocusSuNodo = (node) => {
    if (graphRef.current && node && node.x !== undefined && node.y !== undefined) {
      graphRef.current.centerAt(node.x, node.y, 800);
      graphRef.current.zoom(3.5, 800);
    }
  };

  const toggleCategory = (key) => {
    setVisibleCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleNode = useCallback((nodeId) => {
    setHiddenNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const toggleAllNodesOfType = (type) => {
    const typeNodes = graph.nodes.filter(n => n.type === type && visibleCategories.has(type));
    const allHidden = typeNodes.every(n => hiddenNodes.has(n.id));
    setHiddenNodes(prev => {
      const next = new Set(prev);
      typeNodes.forEach(n => {
        if (allHidden) next.delete(n.id);
        else next.add(n.id);
      });
      return next;
    });
  };

  const showAllNodes = () => setHiddenNodes(new Set());
  const hideAllNodes = () => {
    const all = new Set(graph.nodes.filter(n => visibleCategories.has(n.type)).map(n => n.id));
    setHiddenNodes(all);
  };

  // Count visible/hidden per type
  const typeCounts = useMemo(() => {
    const counts = {};
    CATEGORIES.forEach(c => {
      const typeNodes = graph.nodes.filter(n => n.type === c.key);
      counts[c.key] = {
        total: typeNodes.length,
        visible: typeNodes.filter(n => !hiddenNodes.has(n.id)).length,
      };
    });
    return counts;
  }, [graph.nodes, hiddenNodes]);

  const formatMetric = (val) => {
    if (val === 0) return '0';
    if (val < 0.001) return val.toExponential(1);
    return val.toFixed(3);
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
        <p style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 1.5 }}>
          Consulta nodi e correlazioni. Deseleziona nodi specifici per semplificare la visualizzazione.
        </p>

        {/* Tab Switcher */}
        <div style={localStyles.tabBar}>
          <button
            style={{ ...localStyles.tab, ...(panelTab === 'filters' ? localStyles.tabActive : {}) }}
            onClick={() => setPanelTab('filters')}
          >
            Filtri
          </button>
          <button
            style={{ ...localStyles.tab, ...(panelTab === 'nodes' ? localStyles.tabActive : {}) }}
            onClick={() => setPanelTab('nodes')}
          >
            Nodi ({filteredGraph.nodes.length}/{graph.nodes.length})
          </button>
        </div>

        {panelTab === 'filters' && (
          <>
            {/* Category Filters */}
            <div style={{ ...localStyles.filterBox, animation: 'slideUp 0.4s ease 0.05s both' }}>
              <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Filtra per Categoria</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CATEGORIES.map(({ key, color, label }) => {
                  const isActive = visibleCategories.has(key);
                  const counts = typeCounts[key] || { total: 0, visible: 0 };
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${isActive ? `${color}40` : colors.border}`,
                        background: isActive ? `${color}08` : 'transparent',
                        cursor: 'pointer', transition: 'all 150ms ease', userSelect: 'none',
                      }}
                      onClick={() => toggleCategory(key)}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 4,
                        border: `1.5px solid ${isActive ? color : colors.textMuted}`,
                        background: isActive ? color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms ease', flexShrink: 0,
                      }}>
                        {isActive && (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, opacity: isActive ? 1 : 0.4, flexShrink: 0 }} />
                      <span style={{ color: isActive ? colors.textPrimary : colors.textMuted, fontSize: 12.5, fontWeight: 500, flex: 1 }}>{label}</span>
                      <span style={{ fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>
                        {counts.visible}/{counts.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ ...localStyles.filterBox, animation: 'slideUp 0.4s ease 0.08s both' }}>
              <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Azioni Rapide</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={localStyles.quickBtn} onClick={showAllNodes}>
                  <EyeIcon /> Mostra Tutti
                </button>
                <button style={localStyles.quickBtn} onClick={hideAllNodes}>
                  <EyeOffIcon /> Nascondi Tutti
                </button>
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
                  onFocus={(e) => { e.target.style.borderColor = colors.borderActive; e.target.style.boxShadow = `0 0 0 3px ${colors.accentLight}`; }}
                  onBlur={(e) => { e.target.style.borderColor = colors.border; e.target.style.boxShadow = 'none'; }}
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
                        onClick={() => { eseguiFocusSuNodo(node); handleNodeClick(node); }}
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

            {/* Stats */}
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
                    <span style={{ color: colors.textSecondary }}>Nascosti</span>
                    <span style={{ color: colors.warning, fontWeight: 600 }}>{hiddenNodes.size}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: colors.textSecondary }}>Totale nodi</span>
                    <span style={{ color: colors.textPrimary, fontWeight: 600 }}>{graph.nodes.length}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {panelTab === 'nodes' && (
          <>
            {/* Sort & Controls */}
            <div style={{ ...localStyles.filterBox, animation: 'slideUp 0.2s ease both' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ ...styles.sectionTitle, marginBottom: 0 }}>Ordina per</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={localStyles.quickBtnSmall} onClick={showAllNodes}>
                    <EyeIcon />
                  </button>
                  <button style={localStyles.quickBtnSmall} onClick={hideAllNodes}>
                    <EyeOffIcon />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    style={{
                      ...localStyles.sortChip,
                      ...(sortBy === opt.key ? localStyles.sortChipActive : {}),
                    }}
                    onClick={() => setSortBy(opt.key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {metricsComputed && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 12, color: colors.textSecondary }}>
                  <input
                    type="checkbox"
                    checked={showMetrics}
                    onChange={(e) => setShowMetrics(e.target.checked)}
                    style={{ accentColor: colors.accent }}
                  />
                  Mostra metriche
                </label>
              )}
            </div>

            {/* Node List */}
            <div style={{ flex: 1, overflow: 'auto', marginBottom: 8 }}>
              {!metricsComputed && (
                <div style={{ padding: '12px 0', fontSize: 12, color: colors.textMuted, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <SpinnerIcon /> Calcolo metriche...
                </div>
              )}
              {metricsComputed && Object.entries(sortedNodeList).map(([type, nodes]) => {
                const catInfo = CATEGORIES.find(c => c.key === type);
                if (!catInfo) return null;
                const allOfTypeHidden = nodes.every(n => n.hidden);
                return (
                  <div key={type} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 0', cursor: 'pointer', userSelect: 'none',
                      }}
                      onClick={() => toggleAllNodesOfType(type)}
                    >
                      <div style={{
                        width: 12, height: 12, borderRadius: 3,
                        border: `1.5px solid ${allOfTypeHidden ? colors.textMuted : catInfo.color}`,
                        background: allOfTypeHidden ? 'transparent' : catInfo.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 150ms ease', flexShrink: 0,
                      }}>
                        {!allOfTypeHidden && (
                          <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: catInfo.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {catInfo.label}
                      </span>
                      <span style={{ fontSize: 10, color: colors.textMuted, marginLeft: 'auto' }}>
                        {typeCounts[type]?.visible || 0}/{typeCounts[type]?.total || 0}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {nodes.slice(0, 50).map(node => (
                        <div
                          key={node.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                            background: node.hidden ? 'transparent' : `${catInfo.color}08`,
                            borderLeft: node.hidden ? '2px solid transparent' : `2px solid ${catInfo.color}40`,
                            transition: 'all 150ms ease', opacity: node.hidden ? 0.4 : 1,
                          }}
                          onClick={() => toggleNode(node.id)}
                          title={`${node.id} - Grado: ${node.degree}, Betweenness: ${formatMetric(node.betweenness)}`}
                        >
                          <div style={{
                            width: 12, height: 12, borderRadius: 3,
                            border: `1.5px solid ${node.hidden ? colors.textMuted : catInfo.color}`,
                            background: node.hidden ? 'transparent' : catInfo.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 150ms ease', flexShrink: 0,
                          }}>
                            {!node.hidden && (
                              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span style={{
                            color: node.hidden ? colors.textMuted : colors.textPrimary,
                            fontWeight: 500, fontSize: 11.5, flex: 1,
                            textDecoration: node.hidden ? 'line-through' : 'none',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {node.id}
                          </span>
                          {showMetrics && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <span style={{ fontSize: 9, color: colors.textMuted, background: `${colors.info}15`, padding: '1px 5px', borderRadius: 3 }} title="Grado">
                                D:{node.degree}
                              </span>
                              <span style={{ fontSize: 9, color: colors.textMuted, background: `${colors.warning}15`, padding: '1px 5px', borderRadius: 3 }} title="Betweenness">
                                B:{formatMetric(node.betweenness)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {nodes.length > 50 && (
                        <div style={{ fontSize: 10, color: colors.textMuted, textAlign: 'center', padding: '4px 0' }}>
                          +{nodes.length - 50} altri...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
          {hiddenNodes.size > 0 && (
            <>
              <span style={{ color: colors.border }}>|</span>
              <span style={{ color: colors.warning }}>Nascosti: <strong>{hiddenNodes.size}</strong></span>
            </>
          )}
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
          nodeLabel={(node) => {
            const deg = node.degree || 0;
            const bet = node.betweenness ? formatMetric(node.betweenness) : '0';
            const cent = node.centrality ? formatMetric(node.centrality) : '0';
            return `<div style="color:${colors.textPrimary}; background:${colors.bgSurface}; padding:8px 12px; border-radius:8px; font-size:12px; font-weight:600; border:1px solid ${colors.border}; box-shadow: 0 4px 12px rgba(0,0,0,0.3); min-width:140px">
              <div>${node.id} <span style="color:${colors.textMuted}; font-weight:400; font-size:10px">${node.type.toUpperCase()}</span></div>
              <div style="margin-top:4px; font-size:10px; font-weight:400; color:${colors.textSecondary}">
                <div>Grado: ${deg}</div>
                <div>Betweenness: ${bet}</div>
                <div>Centralita': ${cent}</div>
              </div>
            </div>`;
          }}
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

      <Footer />
    </div>
  );
}

const localStyles = {
  tabBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 12,
    background: colors.bgSurface,
    borderRadius: 8,
    padding: 3,
    border: `1px solid ${colors.border}`,
  },
  tab: {
    flex: 1,
    padding: '7px 12px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  tabActive: {
    background: colors.accent,
    color: 'white',
  },
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
  quickBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    flex: 1,
  },
  quickBtnSmall: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  sortChip: {
    padding: '4px 10px',
    borderRadius: 12,
    border: `1px solid ${colors.border}`,
    background: 'transparent',
    color: colors.textMuted,
    fontSize: 10.5,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
  sortChipActive: {
    borderColor: colors.accent,
    background: colors.accentLight,
    color: colors.accent,
  },
};

const mobPage = {
  page: {
    minHeight: '100vh', minHeight: '100dvh',
    background: colors.bgDeep, color: colors.textPrimary,
    fontFamily: "var(--font-sans, 'Inter', sans-serif)",
    display: 'flex', flexDirection: 'column', position: 'relative',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px', borderBottom: `1px solid ${colors.border}`,
    background: colors.bgSurface, position: 'sticky', top: 0, zIndex: 30,
  },
  backBtn: {
    background: 'none', border: 'none', color: colors.textMuted,
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  title: { fontSize: 15, fontWeight: 700, margin: 0 },
  panelToggle: {
    background: 'none', border: `1px solid ${colors.border}`, borderRadius: 6,
    color: colors.textSecondary, cursor: 'pointer', padding: 6, display: 'flex',
  },
  statsBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', background: 'rgba(10, 22, 40, 0.85)',
    backdropFilter: 'blur(8px)', border: `1px solid ${colors.border}`,
    borderRadius: 0, fontSize: 11, color: colors.textSecondary,
    fontWeight: 500, flexShrink: 0,
  },
  graphArea: { flex: 1, position: 'relative', minHeight: 0 },
  panelBackdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    zIndex: 40,
  },
  panel: {
    position: 'fixed', top: 0, left: 0, bottom: 0, width: 300,
    maxWidth: '85vw', background: colors.bgDeep,
    borderRight: `1px solid ${colors.border}`, zIndex: 50,
    display: 'flex', flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderBottom: `1px solid ${colors.border}`,
    background: colors.bgSurface, flexShrink: 0,
  },
  closeBtn: {
    background: 'none', border: 'none', color: colors.textMuted,
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  panelScroll: { flex: 1, overflow: 'auto', padding: 12 },
  tabBar: {
    display: 'flex', gap: 4, marginBottom: 12,
    background: colors.bgSurface, borderRadius: 8, padding: 3,
    border: `1px solid ${colors.border}`,
  },
  tab: {
    flex: 1, padding: '7px 10px', borderRadius: 6, border: 'none',
    background: 'transparent', color: colors.textMuted,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  tabActive: { background: colors.accent, color: 'white' },
  filterBox: {
    background: colors.bgSurface, border: `1px solid ${colors.border}`,
    borderRadius: 10, padding: 12, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 600, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
  },
  filterRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 8px', borderRadius: 6,
    border: `1px solid ${colors.border}`, cursor: 'pointer',
    marginBottom: 4, transition: 'all 150ms ease',
  },
  quickBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', borderRadius: 6,
    border: `1px solid ${colors.border}`, background: 'transparent',
    color: colors.textSecondary, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', flex: 1, justifyContent: 'center',
  },
  quickBtnSmall: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6,
    border: `1px solid ${colors.border}`, background: 'transparent',
    color: colors.textSecondary, cursor: 'pointer',
  },
  input: {
    width: '100%', padding: '9px 10px', borderRadius: 8,
    border: `1px solid ${colors.border}`, background: colors.bgDeep,
    color: colors.textPrimary, fontSize: 12.5, outline: 'none',
  },
  searchResult: {
    display: 'flex', alignItems: 'center', padding: '8px 8px',
    borderRadius: 6, cursor: 'pointer', gap: 8, marginBottom: 2,
  },
  sortChip: {
    padding: '4px 8px', borderRadius: 12,
    border: `1px solid ${colors.border}`, background: 'transparent',
    color: colors.textMuted, fontSize: 10, fontWeight: 500, cursor: 'pointer',
  },
  sortChipActive: {
    borderColor: colors.accent, background: colors.accentLight,
    color: colors.accent,
  },
};
