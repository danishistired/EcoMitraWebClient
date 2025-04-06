from flask import Flask, request, jsonify, send_from_directory, render_template
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Store multiple queries instead of just the latest one
queries = []
resolved_count = 0
teams = ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"]


@app.route('/')
def home():
    return render_template('index.html')


# Update the upload_file function to ensure each query has a unique ID
@app.route('/upload', methods=['POST'])
def upload_file():
    lat = request.form.get("latitude")
    lon = request.form.get("longitude")
    file = request.files.get("image")

    # Generate a unique ID for this query
    query_id = len(queries)

    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        query_data = {
            "id": query_id,
            "latitude": lat,
            "longitude": lon,
            "image_url": f"/uploads/{filename}",
            "address": f"Lat: {lat}, Lng: {lon}",
            "status": "pending",
            "assigned_team": None,
            "timestamp": request.form.get("timestamp") or "Not specified"
        }
    else:
        query_data = {
            "id": query_id,
            "latitude": lat,
            "longitude": lon,
            "image_url": None,
            "address": f"Lat: {lat}, Lng: {lon}",
            "status": "pending",
            "assigned_team": None,
            "timestamp": request.form.get("timestamp") or "Not specified"
        }

    queries.append(query_data)  # Store in the list

    return jsonify({"message": "File uploaded", "data": query_data})


@app.route('/all_queries', methods=['GET'])
def get_all_queries():
    return jsonify(queries)  # Return all stored queries


# Update the resolve_query endpoint to be more robust
@app.route('/resolve_query/<query_id>', methods=['POST'])
def resolve_query(query_id):
    global resolved_count

    # Convert query_id to the appropriate type based on what's passed
    try:
        # Try to convert to int if it's a numeric ID
        query_id_int = int(query_id)

        for i, query in enumerate(queries):
            if query.get("id") == query_id_int:
                queries.pop(i)
                resolved_count += 1
                return jsonify({"success": True, "resolved_count": resolved_count})
    except ValueError:
        # If it's not a numeric ID, try string comparison
        for i, query in enumerate(queries):
            if str(query.get("id")) == query_id:
                queries.pop(i)
                resolved_count += 1
                return jsonify({"success": True, "resolved_count": resolved_count})

    return jsonify({"success": False, "message": f"Query not found with ID: {query_id}"}), 404


@app.route('/assign_team', methods=['POST'])
def assign_team():
    query_id = request.json.get("query_id")
    team_name = request.json.get("team_name")

    if not query_id or not team_name:
        return jsonify({"success": False, "message": "Missing query_id or team_name"}), 400

    for query in queries:
        if query.get("id") == int(query_id):
            query["assigned_team"] = team_name
            return jsonify({"success": True, "query": query})

    return jsonify({"success": False, "message": "Query not found"}), 404


@app.route('/get_stats', methods=['GET'])
def get_stats():
    return jsonify({
        "total": len(queries),
        "pending": len(queries),
        "resolved": resolved_count,
        "teams": teams
    })


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

