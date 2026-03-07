document.getElementById('inhaleBtn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const outputEl = document.getElementById('output');
  statusEl.innerText = "Inhaling... 💨";

  // 1. Get all tabs in the current window
  const tabs = await chrome.tabs.query({ currentWindow: true });

  // 2. Map through tabs to extract data
  const tabData = await Promise.all(tabs.map(async (tab) => {
    // Skip internal chrome:// pages which we can't scrape
    if (!tab.url.startsWith('http')) return null;

    try {
      // 3. Inject a script to get the page's "main" text
      const [{result}] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Grab first 800 chars and clean up extra whitespace
          return document.body.innerText.substring(0, 800).replace(/\s+/g, ' ');
        }
      });
      
      return {
        title: tab.title,
        url: tab.url,
        content: result
      };
    } catch (e) {
      // Fallback if the page blocks scripting (like some high-security sites)
      return { title: tab.title, url: tab.url, content: "Content restricted" };
    }
  }));

  // Filter out the nulls (non-website tabs)
  const finalData = tabData.filter(t => t !== null);

  // 4. Show result for Person 2 (The AI Person)
  statusEl.innerText = `Successfully captured ${finalData.length} tabs!`;
  outputEl.style.display = 'block';
  outputEl.innerText = JSON.stringify(finalData, null, 2);
  
  console.log("SEND THIS TO PERSON 2:", finalData);
});