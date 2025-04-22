from flask import Flask, render_template, request, jsonify
import json
import os

app = Flask(__name__)

# Directory for storing project files
PROJECTS_DIR = "projects"
os.makedirs(PROJECTS_DIR, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/save', methods=['POST'])
def save_project():
    data = request.json
    project_name = data.get('name', 'untitled')
    project_data = data.get('data', {})
    
    try:
        # Save project data to a JSON file
        filename = f"{project_name}.boxcode"
        with open(os.path.join(PROJECTS_DIR, filename), 'w') as f:
            json.dump(project_data, f, indent=4)
        return jsonify({"success": True, "message": f"Project saved as {filename}"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error saving project: {str(e)}"}), 500

@app.route('/api/load', methods=['POST'])
def load_project():
    data = request.json
    filename = data.get('filename')
    
    try:
        with open(os.path.join(PROJECTS_DIR, filename), 'r') as f:
            project_data = json.load(f)
        return jsonify({"success": True, "data": project_data})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error loading project: {str(e)}"}), 500

@app.route('/api/projects', methods=['GET'])
def list_projects():
    try:
        projects = [f for f in os.listdir(PROJECTS_DIR) if f.endswith('.boxcode')]
        return jsonify({"success": True, "projects": projects})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error listing projects: {str(e)}"}), 500

@app.route('/api/generate', methods=['POST'])
def generate_code():
    data = request.json
    project_data = data.get('data', {})
    
    # Here you would implement the code generation logic similar to your PyQt app
    # For now, just return the raw data
    return jsonify({"success": True, "generated_code": "# Generated code would be here"})

if __name__ == '__main__':
    app.run(debug=True)