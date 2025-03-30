from flask import Flask, request, jsonify, send_from_directory, render_template
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Store multiple queries instead of just the latest one
queries = []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    lat = request.form.get("latitude")
    lon = request.form.get("longitude")
    file = request.files.get("image")

    if file:
        filename = file.filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        query_data = {
            "latitude": lat,
            "longitude": lon,
            "image_url": f"/uploads/{filename}",
            "address": f"Lat: {lat}, Lng: {lon}"
        }
    else:
        query_data = {
            "latitude": lat,
            "longitude": lon,
            "image_url": None,
            "address": f"Lat: {lat}, Lng: {lon}"
        }

    queries.append(query_data)  # Store in the list

    return jsonify({"message": "File uploaded", "data": query_data})

@app.route('/all_queries', methods=['GET'])
def get_all_queries():
    return jsonify(queries)  # Return all stored queries

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

