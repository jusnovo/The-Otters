document.addEventListener("DOMContentLoaded", () => {
  const generateButton = document.getElementById("generate");
  const status = document.getElementById("status");
  const mindmap = document.getElementById("mindmap");

  if (!generateButton || !status || !mindmap) {
    console.error("Popup elements not found.");
    return;
  }

  generateButton.addEventListener("click", async () => {
    status.textContent = "Capturing tabs and generating mind map...";
    mindmap.innerHTML = "";

    try {
      const tabs = await chrome.tabs.query({});

      const tabData = tabs.map((tab) => ({
        title: tab.title || "Untitled tab",
        url: tab.url || "",
        content: tab.title || ""
      }));

      const response = await fetch("http://127.0.0.1:5000/analyse-tabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(tabData)
      });

      const rawText = await response.text();
      console.log("RAW BACKEND RESPONSE:", rawText);

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${rawText}`);
      }

      const result = JSON.parse(rawText);

      status.textContent = "Mind map ready.";
      renderMindMap(result, tabData, mindmap);
    } catch (error) {
      console.error("Popup error:", error);
      status.textContent = "Something went wrong. Open Errors / DevTools.";
    }
  });
});

function renderMindMap(result, tabData, mindmap) {
  mindmap.innerHTML = "";

  if (!result.clusters || result.clusters.length === 0) {
    mindmap.innerHTML = "<p>No clusters returned.</p>";
    return;
  }

  result.clusters.forEach((cluster) => {
    const clusterDiv = document.createElement("div");
    clusterDiv.className = "cluster";

    const titleDiv = document.createElement("div");
    titleDiv.className = "cluster-title";
    titleDiv.textContent = cluster.name || "Untitled Cluster";

    const summaryDiv = document.createElement("div");
    summaryDiv.className = "cluster-summary";
    summaryDiv.textContent = cluster.summary || "";

    clusterDiv.appendChild(titleDiv);
    clusterDiv.appendChild(summaryDiv);

    (cluster.tab_indices || []).forEach((index) => {
      const tab = tabData[index];
      if (tab) {
        const tabDiv = document.createElement("div");
        tabDiv.className = "tab-item";
        tabDiv.textContent = "• " + tab.title;
        clusterDiv.appendChild(tabDiv);
      }
    });

    mindmap.appendChild(clusterDiv);
  });

  if (result.relationships && result.relationships.length > 0) {
    const relationshipsDiv = document.createElement("div");
    relationshipsDiv.className = "relationships";

    const heading = document.createElement("div");
    heading.className = "cluster-title";
    heading.textContent = "Relationships";
    relationshipsDiv.appendChild(heading);

    result.relationships.forEach((rel) => {
      const relDiv = document.createElement("div");
      relDiv.className = "relationship-item";
      relDiv.textContent =
        `${rel.source_cluster_id} → ${rel.target_cluster_id}: ${rel.relationship}`;
      relationshipsDiv.appendChild(relDiv);
    });

    mindmap.appendChild(relationshipsDiv);
  }
}
