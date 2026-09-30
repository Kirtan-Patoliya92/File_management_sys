from flask import Flask, render_template, request, jsonify, send_file
from pathlib import Path
import os

app = Flask(__name__)
BASE_DIR = Path(__file__).parent / "managed_files"
BASE_DIR.mkdir(exist_ok=True)

def safe_path(name: str) -> Path:
    """Prevent paths from escaping managed_files."""
    name = (name or "").strip()
    if not name:
        raise ValueError("File name cannot be empty.")
    path = (BASE_DIR / name).resolve()
    if path.parent != BASE_DIR.resolve():
        raise ValueError("Only files directly inside the managed_files folder are allowed.")
    return path

@app.route("/")
def index():
    return render_template("index.html")

@app.get("/api/files")
def list_files():
    items = []
    for p in sorted(BASE_DIR.iterdir(), key=lambda x: x.name.lower()):
        if p.is_file():
            items.append({
                "name": p.name,
                "size": p.stat().st_size,
                "modified": p.stat().st_mtime
            })
    return jsonify(items)

@app.post("/api/files")
def create_file():
    data = request.get_json(silent=True) or {}
    try:
        path = safe_path(data.get("name"))
        if path.exists():
            return jsonify({"error": "File already exists."}), 409
        path.write_text(data.get("content", ""), encoding="utf-8")
        return jsonify({"message": "File created successfully."}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.get("/api/files/<path:name>")
def read_file(name):
    try:
        path = safe_path(name)
        if not path.exists() or not path.is_file():
            return jsonify({"error": "File does not exist."}), 404
        return jsonify({"name": path.name, "content": path.read_text(encoding="utf-8")})
    except (ValueError, UnicodeDecodeError) as e:
        return jsonify({"error": str(e)}), 400

@app.put("/api/files/<path:name>")
def rewrite_file(name):
    try:
        path = safe_path(name)
        if not path.exists():
            return jsonify({"error": "File does not exist."}), 404
        data = request.get_json(silent=True) or {}
        path.write_text(data.get("content", ""), encoding="utf-8")
        return jsonify({"message": "File rewritten successfully."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.delete("/api/files/<path:name>")
def delete_file(name):
    try:
        path = safe_path(name)
        if not path.exists():
            return jsonify({"error": "File does not exist."}), 404
        path.unlink()
        return jsonify({"message": "File deleted successfully."})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.get("/api/files/<path:name>/download")
def download_file(name):
    try:
        path = safe_path(name)
        if not path.exists():
            return jsonify({"error": "File does not exist."}), 404
        return send_file(path, as_attachment=True, download_name=path.name)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
