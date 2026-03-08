import json
import os
from flask import Flask, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/analyse-tabs": {"origins": "*"}, r"/health": {"origins": "*"}})

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PROMPT = """
You are an assistant that organises browser tabs into meaningful research clusters.

You will receive browser tabs. Each tab has:
- title
- url
- content

Your task:
1. Group tabs into clusters by topic or intent.
2. Name each cluster clearly.
3. Write a short summary for each cluster.
4. Identify relationships between clusters.
5. Suggest an efficient reading order across all tabs.

Return ONLY valid JSON in this exact format:
{
  "clusters": [
    {
      "id": "cluster_1",
      "name": "string",
      "summary": "string",
      "tab_indices": [0, 1]
    }
  ],
  "relationships": [
    {
      "source_cluster_id": "cluster_1",
      "target_cluster_id": "cluster_2",
      "relationship": "string"
    }
  ],
  "reading_order": [0, 2, 1]
}
"""

def fallback_response(tabs):
    return {
        "clusters": [
            {
                "id": "cluster_1",
                "name": "General Research",
                "summary": "Fallback cluster containing all tabs.",
                "tab_indices": list(range(len(tabs)))
            }
        ],
        "relationships": [],
        "reading_order": list(range(len(tabs)))
    }

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/analyse-tabs", methods=["POST"])
def analyse_tabs():
    data = request.get_json()

    if isinstance(data, list):
        tabs = data
    elif isinstance(data, dict):
        tabs = data.get("tabs", [])
    else:
        tabs = []

    if not tabs:
        return jsonify({"error": "No tabs provided"}), 400

    try:
        user_prompt = f"""
Here are the tabs:

{json.dumps(tabs, indent=2)}

Rules:
- Use tab indices from the input list.
- Every tab must appear in one cluster.
- Prefer 2 to 5 clusters unless the tabs are very diverse.
- Keep summaries concise.
- Return valid JSON only.
"""

        response = model.generate_content(f"{SYSTEM_PROMPT}\n\n{user_prompt}")
        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        parsed = json.loads(raw_text)
        return jsonify(parsed)

    except Exception as e:
        print("Gemini error:", e)
        return jsonify(fallback_response(tabs))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
