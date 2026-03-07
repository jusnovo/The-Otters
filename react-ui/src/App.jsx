import React, { useMemo, useState } from "react";
import {
  Brain,
  Search,
  Sparkles,
  Layers,
  Clock,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  FileText,
  Globe,
} from "lucide-react";

const MOCK_STATS = {
  totalTabs: 42,
  duplicates: 3,
  clusterCount: 4,
  totalReadTime: "2h 15m",
  oldTabs: 12,
};

const MOCK_CLUSTERS = [
  {
    id: "c1",
    title: "AI & LLM Research",
    x: 25,
    y: 30,
    colorA: "#60a5fa",
    colorB: "#6366f1",
    tabs: [
      {
        id: "t1",
        title: "Understanding Context Windows in LLMs",
        url: "anthropic.com/research",
        time: "12m",
        read: false,
        note: "Peer-reviewed research",
      },
      {
        id: "t2",
        title: "React UI Generation with AI",
        url: "v0.dev/blog",
        time: "8m",
        read: true,
        note: "Corporate blog",
      },
      {
        id: "t3",
        title: "Why AI will destroy jobs",
        url: "news-daily.com",
        time: "25m",
        read: false,
        note: "Opinion / high bias",
      },
    ],
  },
  {
    id: "c2",
    title: "Japan Trip Planning",
    x: 75,
    y: 25,
    colorA: "#f472b6",
    colorB: "#f43f5e",
    tabs: [
      {
        id: "t4",
        title: "Kyoto 3-Day Itinerary",
        url: "japan-guide.com",
        time: "15m",
        read: false,
        note: "Independent guide",
      },
      {
        id: "t5",
        title: "Best Ryokans in Hakone",
        url: "booking.com",
        time: "10m",
        read: false,
        note: "Commercial listings",
      },
      {
        id: "t6",
        title: "JR Pass Calculator",
        url: "jrpass.com",
        time: "5m",
        read: false,
        note: "Utility tool",
      },
    ],
  },
  {
    id: "c3",
    title: "Design Inspiration",
    x: 78,
    y: 68,
    colorA: "#fbbf24",
    colorB: "#f97316",
    tabs: [
      {
        id: "t7",
        title: "Glassmorphism UI Trends",
        url: "dribbble.com",
        time: "4m",
        read: false,
        note: "Design board",
      },
      {
        id: "t8",
        title: "Beautiful Web Gradients",
        url: "cssgradient.io",
        time: "3m",
        read: false,
        note: "Open-source tool",
      },
    ],
  },
  {
    id: "c4",
    title: "Work / Admin",
    x: 22,
    y: 70,
    colorA: "#34d399",
    colorB: "#14b8a6",
    tabs: [
      {
        id: "t9",
        title: "Q3 Financial Reports",
        url: "docs.google.com",
        time: "30m",
        read: false,
        note: "Internal document",
      },
      {
        id: "t10",
        title: "Team Sync Notes",
        url: "notion.so",
        time: "5m",
        read: false,
        note: "Internal workspace",
      },
      {
        id: "t11",
        title: "Jira Dashboard",
        url: "jira.atlassian.com",
        time: "1m",
        read: false,
        note: "Tracker",
      },
    ],
  },
];

function getTabCoords(cx, cy, index, total) {
  const radiusX = 12;
  const radiusY = 18;
  const angleFromCenter = Math.atan2(cy - 50, cx - 50);
  const spread = Math.PI * 0.9;
  const startAngle = angleFromCenter - spread / 2;
  const angle =
    total === 1
      ? angleFromCenter
      : startAngle + (index / (total - 1)) * spread;

  return {
    x: cx + radiusX * Math.cos(angle),
    y: cy + radiusY * Math.sin(angle),
  };
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.78)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}>
        {value}
      </div>
    </div>
  );
}

export default function App() {
  const [clusters] = useState(MOCK_CLUSTERS);
  const [activeClusterId, setActiveClusterId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [summary, setSummary] = useState("");
  const [isSummarising, setIsSummarising] = useState(false);
  const [view, setView] = useState({ type: "dashboard", cluster: null, tab: null });

  const activeCluster =
    clusters.find((cluster) => cluster.id === activeClusterId) || null;

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

  const handleSummarise = () => {
    if (!activeCluster) return;
    setIsSummarising(true);
    setSummary("");

    setTimeout(() => {
      setSummary(
        `${activeCluster.title} groups related tabs that can be read together. Start with the higher-level overview items, then move into the more practical or niche tabs. This cluster is useful because it reduces context switching and gives a clearer reading path.`
      );
      setIsSummarising(false);
    }, 1200);
  };

  if (view.type === "article" && view.cluster && view.tab) {
    const { cluster, tab } = view;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            height: 64,
            borderBottom: "1px solid #e2e8f0",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 20px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setView({ type: "dashboard", cluster: null, tab: null })}
            style={buttonStyle("secondary")}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div
            style={{
              flex: 1,
              height: 38,
              borderRadius: 12,
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
              color: "#475569",
              fontSize: 14,
              gap: 8,
            }}
          >
            <Globe size={15} />
            https://{tab.url}/article/read
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 64px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#eef2ff",
              color: "#4338ca",
              padding: "8px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <FileText size={14} />
            Article View
          </div>

          <h1
            style={{
              marginTop: 20,
              fontSize: 42,
              lineHeight: 1.1,
              marginBottom: 18,
            }}
          >
            {tab.title}
          </h1>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              color: "#64748b",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#e2e8f0",
              }}
            />
            <div>
              <div style={{ color: "#0f172a", fontWeight: 600 }}>Author Name</div>
              <div style={{ fontSize: 14 }}>{tab.time} read • Published today</div>
            </div>
          </div>

          <div
            style={{
              background: "white",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
              border: "1px solid #e2e8f0",
            }}
          >
            <p style={articleP}>
              You clicked <strong>{tab.title}</strong> from the TabMind dashboard.
              This view simulates how a focused reading experience could work after
              clustering tabs into meaningful groups.
            </p>
            <p style={articleP}>
              Instead of jumping between unrelated pages, the interface encourages a
              more deliberate reading sequence. Tabs become a structured knowledge
              map rather than a chaotic backlog.
            </p>
            <h2 style={{ fontSize: 28, marginTop: 28, marginBottom: 12 }}>
              Why this matters
            </h2>
            <p style={articleP}>
              Grouping tabs by theme reduces context switching, highlights overlap,
              and makes it easier to decide what to read first and what to archive.
            </p>

            <div
              style={{
                margin: "28px 0",
                height: 220,
                borderRadius: 20,
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.08))",
                border: "1px dashed #cbd5e1",
                display: "grid",
                placeItems: "center",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Simulated visual / graphic area
            </div>

            <p style={articleP}>
              Current cluster: <strong>{cluster.title}</strong>
            </p>
            <p style={articleP}>Source: {tab.url}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.15), transparent 30%), radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#0f172a",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(255,255,255,0.78)",
              borderRadius: 28,
              padding: 22,
              boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
              backdropFilter: "blur(14px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(99,102,241,0.08)",
                    color: "#4338ca",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  <Brain size={14} />
                  TabMind
                </div>
                <h1 style={{ fontSize: 34, margin: "14px 0 8px" }}>
                  Contextual Tab Mind Map
                </h1>
                <p style={{ color: "#64748b", margin: 0, maxWidth: 700 }}>
                  Group open tabs into meaningful clusters, inspect relationships,
                  and move into a focused reading flow.
                </p>
              </div>

              <button
                style={buttonStyle("primary")}
                onClick={() => {
                  setSummary("");
                  setActiveClusterId(null);
                }}
              >
                <RefreshCw size={16} />
                Reset
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <StatCard label="Total Tabs" value={MOCK_STATS.totalTabs} />
              <StatCard label="Clusters" value={MOCK_STATS.clusterCount} />
              <StatCard label="Duplicates" value={MOCK_STATS.duplicates} />
              <StatCard label="Read Time" value={MOCK_STATS.totalReadTime} />
              <StatCard label="Old Tabs" value={MOCK_STATS.oldTabs} />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "12px 14px",
                marginBottom: 18,
              }}
            >
              <Search size={18} color="#64748b" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tabs, URLs, or notes..."
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: 14,
                  background: "transparent",
                  color: "#0f172a",
                }}
              />
            </div>

            <div
              style={{
                position: "relative",
                minHeight: 560,
                borderRadius: 28,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(248,250,252,0.92))",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 150,
                  height: 150,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.95), rgba(168,85,247,0.95))",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 50px rgba(79,70,229,0.25)",
                  zIndex: 2,
                }}
              >
                <Brain size={34} />
                <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                  Open Tabs
                </div>
                <div style={{ fontSize: 12, opacity: 0.88 }}>Mind map view</div>
              </div>

              {filteredClusters.map((cluster) => (
                <React.Fragment key={cluster.id}>
                  <div
                    onClick={() => setActiveClusterId(cluster.id)}
                    style={{
                      position: "absolute",
                      left: `${cluster.x}%`,
                      top: `${cluster.y}%`,
                      transform: "translate(-50%, -50%)",
                      width: 220,
                      padding: 16,
                      borderRadius: 22,
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
                      zIndex: 3,
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        background: `linear-gradient(135deg, ${cluster.colorA}, ${cluster.colorB})`,
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        marginBottom: 10,
                      }}
                    >
                      {cluster.id === "c1" && <Brain size={20} />}
                      {cluster.id === "c2" && <FileText size={20} />}
                      {cluster.id === "c3" && <Sparkles size={20} />}
                      {cluster.id === "c4" && <Layers size={20} />}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {cluster.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                      {cluster.tabs.length} tabs grouped together
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      {cluster.tabs.slice(0, 3).map((tab) => (
                        <div
                          key={tab.id}
                          style={{
                            fontSize: 12,
                            color: "#334155",
                            background: "#f8fafc",
                            borderRadius: 10,
                            padding: "8px 10px",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {tab.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  {cluster.tabs.map((tab, index) => {
                    const coords = getTabCoords(cluster.x, cluster.y, index, cluster.tabs.length);

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setView({ type: "article", cluster, tab })}
                        style={{
                          position: "absolute",
                          left: `${coords.x}%`,
                          top: `${coords.y}%`,
                          transform: "translate(-50%, -50%)",
                          border: "1px solid #e2e8f0",
                          background: "rgba(255,255,255,0.9)",
                          borderRadius: 999,
                          padding: "8px 12px",
                          fontSize: 11,
                          color: "#334155",
                          boxShadow: "0 8px 16px rgba(15,23,42,0.06)",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          zIndex: 2,
                        }}
                      >
                        {tab.title}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 20,
            }}
          >
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
                  Click a cluster card in the mind map to inspect it here.
                </div>
              )}

              {activeCluster && (
                <>
                  <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                    {activeCluster.tabs.map((tab) => (
                      <div
                        key={tab.id}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          background: "white",
                          padding: 14,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            {tab.title}
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b" }}>
                            {tab.url}
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                            {tab.note}
                          </div>
                        </div>

                        <div style={{ display: "grid", justifyItems: "end", gap: 8 }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 12,
                              color: "#475569",
                              background: "#f8fafc",
                              padding: "6px 10px",
                              borderRadius: 999,
                            }}
                          >
                            <Clock size={13} />
                            {tab.time}
                          </div>

                          <button
                            style={buttonStyle("secondary")}
                            onClick={() =>
                              setView({ type: "article", cluster: activeCluster, tab })
                            }
                          >
                            <ExternalLink size={14} />
                            Open
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

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
                </>
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
                <RelationshipCard
                  from="AI & LLM Research"
                  to="Design Inspiration"
                  text="The design cluster contains UI references that could shape the presentation layer of AI tab grouping."
                />
                <RelationshipCard
                  from="Japan Trip Planning"
                  to="Work / Admin"
                  text="These clusters are unrelated, making them a good example of why tab separation matters."
                />
                <RelationshipCard
                  from="Work / Admin"
                  to="AI & LLM Research"
                  text="Research tabs may eventually feed product or workflow decisions in a work context."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelationshipCard({ from, to, text }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "white",
        border: "1px solid #e2e8f0",
        padding: 16,
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
      <div style={{ color: "#475569", lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

function buttonStyle(type = "primary") {
  const base = {
    border: "none",
    borderRadius: 14,
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
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

const articleP = {
  fontSize: 18,
  lineHeight: 1.8,
  color: "#334155",
  margin: "0 0 18px 0",
};
