import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Search,
  Sparkles,
  Layers,
  Clock,
  ExternalLink,
  RefreshCw,
  FileText,
  Globe,
  Maximize2,
  ArrowLeft,
} from "lucide-react";

const CLUSTER_COLORS = [
  ["#60a5fa", "#6366f1"],
  ["#f472b6", "#f43f5e"],
  ["#fbbf24", "#f97316"],
  ["#34d399", "#14b8a6"],
  ["#a78bfa", "#7c3aed"],
  ["#22c55e", "#0891b2"],
];

const PANEL_WIDTH = 360;

function getViewMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("view") === "full" ? "full" : "panel";
}

function estimateReadTime(text) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins}m`;
}

function buttonStyle(type = "primary", compact = false) {
  const base = {
    border: "none",
    borderRadius: compact ? 12 : 14,
    padding: compact ? "8px 10px" : "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: compact ? 12 : 14,
    whiteSpace: "nowrap",
  };

  if (type === "secondary") {
    return {
      ...base,
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid #e2e8f0",
    };
  }

  return {
    ...base,
    background: "linear-gradient(135deg, #4f46e5, #a855f7)",
    color: "white",
    boxShadow: "0 10px 24px rgba(79,70,229,0.24)",
  };
}

function StatCard({ label, value, compact }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.82)",
        border: "1px solid rgba(255,255,255,0.78)",
        borderRadius: compact ? 16 : 18,
        padding: compact ? 12 : 14,
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          fontSize: compact ? 11 : 12,
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: compact ? 20 : 22,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function RelationshipCard({ rel, nameLookup }) {
  const from = nameLookup[rel.source_cluster_id] || rel.source_cluster_id;
  const to = nameLookup[rel.target_cluster_id] || rel.target_cluster_id;

  return (
    <div
      style={{
        borderRadius: 16,
        background: "white",
        border: "1px solid #e2e8f0",
        padding: 14,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#eef2ff",
          color: "#4338ca",
          borderRadius: 999,
          padding: "6px 10px",
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        <Brain size={14} />
        {from} → {to}
      </div>
      <div style={{ color: "#475569", lineHeight: 1.6, fontSize: 14 }}>
        {rel.relationship}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState(getViewMode());
  const [rawTabs, setRawTabs] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [readingOrder, setReadingOrder] = useState([]);
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [isSummarising, setIsSummarising] = useState(false);
  const [articleView, setArticleView] = useState(false);

  const isFullMode = mode === "full";
  const compact = !isFullMode;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("view") === "full" ? "full" : "panel");
  }, []);

  const loadMindMap = async () => {
    setLoadingTabs(true);
    setError("");
    setSummary("");
    setArticleView(false);

    try {
      const tabs = await chrome.tabs.query({});

      const liveTabData = tabs
        .filter((tab) => tab.url && !tab.url.startsWith("chrome://"))
        .map((tab) => ({
          title: tab.title || "Untitled tab",
          url: tab.url || "",
          content: tab.title || "",
        }));

      setRawTabs(liveTabData);

      const response = await fetch("http://127.0.0.1:5000/analyse-tabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(liveTabData),
      });

      const rawText = await response.text();

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${rawText}`);
      }

      const result = JSON.parse(rawText);

      const mappedClusters = (result.clusters || []).map((cluster, i) => {
        const [colorA, colorB] = CLUSTER_COLORS[i % CLUSTER_COLORS.length];

        return {
          id: cluster.id || `cluster-${i}`,
          title: cluster.name || `Cluster ${i + 1}`,
          summary: cluster.summary || "",
          colorA,
          colorB,
          tabIndices: cluster.tab_indices || [],
          tabs: (cluster.tab_indices || []).map((index, j) => {
            const tab = liveTabData[index];
            return {
              id: `tab-${i}-${j}`,
              index,
              title: tab?.title || "Unknown tab",
              url: tab?.url || "",
              content: tab?.content || "",
              time: estimateReadTime(tab?.content || tab?.title || ""),
              read: false,
              note: cluster.summary || "",
            };
          }),
        };
      });

      setClusters(mappedClusters);
      setRelationships(result.relationships || []);
      setReadingOrder(result.reading_order || []);
      setActiveClusterId(mappedClusters[0]?.id || null);
      setActiveTab(null);
    } catch (err) {
      console.error("Failed to load live tabs:", err);
      setError(err.message || "Failed to load mind map.");
      setClusters([]);
      setRelationships([]);
      setReadingOrder([]);
      setActiveClusterId(null);
      setActiveTab(null);
    } finally {
      setLoadingTabs(false);
    }
  };

  useEffect(() => {
    loadMindMap();
  }, []);

  const filteredClusters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return clusters;

    return clusters
      .map((cluster) => ({
        ...cluster,
        tabs: cluster.tabs.filter(
          (tab) =>
            tab.title.toLowerCase().includes(q) ||
            tab.url.toLowerCase().includes(q) ||
            (tab.note || "").toLowerCase().includes(q)
        ),
      }))
      .filter(
        (cluster) =>
          cluster.title.toLowerCase().includes(q) || cluster.tabs.length > 0
      );
  }, [clusters, searchQuery]);

  const activeCluster =
    filteredClusters.find((cluster) => cluster.id === activeClusterId) ||
    clusters.find((cluster) => cluster.id === activeClusterId) ||
    null;

  const totalReadTime = useMemo(() => {
    const totalMinutes = rawTabs.reduce(
      (sum, tab) => sum + parseInt(estimateReadTime(tab.content || tab.title), 10),
      0
    );
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${totalMinutes}m`;
  }, [rawTabs]);

  const duplicates = useMemo(() => {
    const seen = new Set();
    let dupes = 0;
    rawTabs.forEach((tab) => {
      if (seen.has(tab.url)) dupes += 1;
      else seen.add(tab.url);
    });
    return dupes;
  }, [rawTabs]);

  const handleSummarise = () => {
    if (!activeCluster) return;
    setIsSummarising(true);
    setSummary("");

    const orderedTitles = activeCluster.tabs.map((t) => t.title).join(", ");

    setTimeout(() => {
      setSummary(
        `${activeCluster.title} groups ${activeCluster.tabs.length} related tabs. Start with the broader overview pages first, then move into the more specific items. Reading path: ${orderedTitles}.`
      );
      setIsSummarising(false);
    }, 900);
  };

  const openFullscreen = () => {
    const fullUrl = chrome.runtime.getURL("react-ui/dist/index.html?view=full");
    chrome.tabs.create({ url: fullUrl });
  };

  const openTabUrl = (url) => {
    if (!url) return;
    chrome.tabs.create({ url });
  };

  const nameLookup = useMemo(() => {
    const lookup = {};
    clusters.forEach((c) => {
      lookup[c.id] = c.title;
    });
    return lookup;
  }, [clusters]);

  if (articleView && activeTab && activeCluster) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          width: "100%",
          minWidth: isFullMode ? "100%" : PANEL_WIDTH,
          overflowY: "auto",
          overflowX: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            height: compact ? 56 : 64,
            borderBottom: "1px solid #e2e8f0",
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: compact ? "0 10px" : "0 16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setArticleView(false)}
            style={buttonStyle("secondary", compact)}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div
            style={{
              flex: 1,
              height: compact ? 34 : 38,
              borderRadius: 12,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              color: "#475569",
              fontSize: compact ? 12 : 13,
              gap: 8,
              overflow: "hidden",
            }}
          >
            <Globe size={14} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeTab.url}
            </span>
          </div>
        </div>

        <div
          style={{
            maxWidth: isFullMode ? 980 : PANEL_WIDTH,
            margin: "0 auto",
            padding: isFullMode ? "32px 24px 48px" : "14px 10px 20px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#eef2ff",
              color: "#4338ca",
              padding: "7px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <FileText size={13} />
            Focus View
          </div>

          <h1
            style={{
              marginTop: 14,
              fontSize: isFullMode ? 40 : 22,
              lineHeight: 1.12,
              marginBottom: 12,
            }}
          >
            {activeTab.title}
          </h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              color: "#64748b",
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#e2e8f0",
              }}
            />
            <div>
              <div style={{ color: "#0f172a", fontWeight: 600, fontSize: compact ? 13 : 15 }}>
                Cluster: {activeCluster.title}
              </div>
              <div style={{ fontSize: compact ? 12 : 14 }}>{activeTab.time} read</div>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 20,
              padding: isFullMode ? 28 : 14,
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={{ ...articleP, fontSize: compact ? 14 : 16 }}>
              This is the focused reading view for <strong>{activeTab.title}</strong>.
            </p>
            <p style={{ ...articleP, fontSize: compact ? 14 : 16 }}>
              In the full product, this view would let the user move from the mind
              map into a single tab with cleaner context and better reading flow.
            </p>
            <button
              onClick={() => openTabUrl(activeTab.url)}
              style={buttonStyle("primary", compact)}
            >
              <ExternalLink size={14} />
              Open Original Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        minWidth: isFullMode ? "100%" : PANEL_WIDTH,
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.15), transparent 30%), radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#0f172a",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: isFullMode ? 1400 : 360,
          width: "100%",
          margin: "0 auto",
          padding: isFullMode ? 20 : 8,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isFullMode ? "1.2fr 1fr" : "1fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(255,255,255,0.78)",
              borderRadius: compact ? 22 : 28,
              padding: isFullMode ? 22 : 12,
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
              backdropFilter: "blur(14px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: compact ? "7px 10px" : "8px 12px",
                    borderRadius: 999,
                    background: "rgba(99,102,241,0.08)",
                    color: "#4338ca",
                    fontWeight: 700,
                    fontSize: compact ? 11 : 12,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <Brain size={compact ? 13 : 14} />
                  TabMind
                </div>
                <h1
                  style={{
                    fontSize: isFullMode ? 32 : 18,
                    margin: "10px 0 6px",
                    lineHeight: 1.08,
                  }}
                >
                  Contextual Tab Mind Map
                </h1>
                <p
                  style={{
                    color: "#64748b",
                    margin: 0,
                    maxWidth: 700,
                    fontSize: compact ? 12 : 14,
                    lineHeight: 1.4,
                  }}
                >
                  Capture live tabs, cluster them, and move into a cleaner reading flow.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!isFullMode && (
                  <button style={buttonStyle("secondary", compact)} onClick={openFullscreen}>
                    <Maximize2 size={14} />
                    Expand
                  </button>
                )}
                <button style={buttonStyle("primary", compact)} onClick={loadMindMap}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingTabs && (
              <div
                style={{
                  color: "#475569",
                  marginBottom: 10,
                  fontSize: compact ? 12 : 14,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "10px 12px",
                  borderRadius: 14,
                }}
              >
                Capturing open tabs and generating mind map...
              </div>
            )}

            {error && (
              <div
                style={{
                  color: "#991b1b",
                  marginBottom: 10,
                  fontSize: compact ? 12 : 14,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "10px 12px",
                  borderRadius: 14,
                  wordBreak: "break-word",
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isFullMode
                  ? "repeat(5, minmax(0, 1fr))"
                  : "1fr",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <StatCard label="Total Tabs" value={rawTabs.length} compact={compact} />
              <StatCard label="Clusters" value={clusters.length} compact={compact} />
              <StatCard label="Duplicates" value={duplicates} compact={compact} />
              <StatCard label="Read Time" value={totalReadTime} compact={compact} />
              {isFullMode && (
                <StatCard label="Ordered Tabs" value={readingOrder.length} compact={compact} />
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: compact ? "10px 12px" : "12px 14px",
                marginBottom: 12,
              }}
            >
              <Search size={compact ? 16 : 18} color="#64748b" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs, URLs, or notes..."
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: compact ? 13 : 14,
                  background: "transparent",
                  color: "#0f172a",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {filteredClusters.length === 0 && !loadingTabs && (
                <div
                  style={{
                    borderRadius: 16,
                    border: "1px dashed #cbd5e1",
                    padding: 16,
                    background: "#f8fafc",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  No clusters to display.
                </div>
              )}

              {filteredClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  onClick={() => setActiveClusterId(cluster.id)}
                  style={{
                    borderRadius: compact ? 18 : 22,
                    padding: compact ? 12 : 16,
                    cursor: "pointer",
                    background:
                      activeClusterId === cluster.id
                        ? "rgba(255,255,255,0.98)"
                        : "rgba(255,255,255,0.85)",
                    border:
                      activeClusterId === cluster.id
                        ? "2px solid #6366f1"
                        : "1px solid #e2e8f0",
                    boxShadow:
                      activeClusterId === cluster.id
                        ? "0 18px 40px rgba(99,102,241,0.16)"
                        : "0 10px 24px rgba(15,23,42,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: compact ? 36 : 42,
                          height: compact ? 36 : 42,
                          borderRadius: 14,
                          background: `linear-gradient(135deg, ${cluster.colorA}, ${cluster.colorB})`,
                          display: "grid",
                          placeItems: "center",
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={compact ? 18 : 20} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: isFullMode ? 16 : 13,
                            marginBottom: 2,
                            lineHeight: 1.2,
                            wordBreak: "break-word",
                          }}
                        >
                          {cluster.title}
                        </div>
                        <div style={{ fontSize: compact ? 12 : 13, color: "#64748b" }}>
                          {cluster.tabs.length} tabs grouped together
                        </div>
                      </div>
                    </div>

                    {isFullMode && (
                      <button
                        style={buttonStyle("secondary", compact)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveClusterId(cluster.id);
                          handleSummarise();
                        }}
                      >
                        <Sparkles size={14} />
                        Summarise
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: compact ? 12 : 13,
                      color: "#475569",
                      marginBottom: 10,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
                    }}
                  >
                    {cluster.summary}
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {cluster.tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveClusterId(cluster.id);
                          setActiveTab(tab);
                          setArticleView(true);
                        }}
                        style={{
                          textAlign: "left",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          borderRadius: 14,
                          padding: compact ? 10 : 12,
                          cursor: "pointer",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            marginBottom: 4,
                            fontSize: compact ? 13 : 14,
                            lineHeight: 1.25,
                            wordBreak: "break-word",
                          }}
                        >
                          {tab.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            marginBottom: 6,
                          }}
                        >
                          {tab.url}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              color: "#475569",
                            }}
                          >
                            <Clock size={13} />
                            {tab.time}
                          </div>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              color: "#4338ca",
                              fontWeight: 600,
                            }}
                          >
                            Open <ExternalLink size={13} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isFullMode && (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  borderRadius: 28,
                  padding: 20,
                  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      Active cluster
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                      {activeCluster ? activeCluster.title : "Select a cluster"}
                    </div>
                  </div>

                  <button
                    style={buttonStyle("primary")}
                    disabled={!activeCluster || isSummarising}
                    onClick={handleSummarise}
                  >
                    <Sparkles size={16} />
                    {isSummarising ? "Summarising..." : "Summarise"}
                  </button>
                </div>

                {!activeCluster && (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: 18,
                      padding: 24,
                      color: "#64748b",
                      background: "#f8fafc",
                    }}
                  >
                    Select a cluster from the left to inspect it here.
                  </div>
                )}

                {activeCluster && (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>
                      AI summary
                    </div>
                    <div style={{ color: "#475569", lineHeight: 1.6 }}>
                      {isSummarising
                        ? "Generating a concise reading path for this cluster..."
                        : summary || "Click “Summarise” to generate an AI summary here."}
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.78)",
                  border: "1px solid rgba(255,255,255,0.75)",
                  borderRadius: 28,
                  padding: 20,
                  boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
                  backdropFilter: "blur(14px)",
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
                  Relationships
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {relationships.length === 0 && (
                    <div
                      style={{
                        border: "1px dashed #cbd5e1",
                        borderRadius: 18,
                        padding: 18,
                        color: "#64748b",
                        background: "#f8fafc",
                      }}
                    >
                      No relationships returned.
                    </div>
                  )}

                  {relationships.map((rel, i) => (
                    <RelationshipCard
                      key={`${rel.source_cluster_id}-${rel.target_cluster_id}-${i}`}
                      rel={rel}
                      nameLookup={nameLookup}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const articleP = {
  fontSize: 16,
  lineHeight: 1.8,
  color: "#334155",
  margin: "0 0 16px 0",
};
