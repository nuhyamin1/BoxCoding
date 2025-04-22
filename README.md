# BoxCoding

BoxCoding is a web-based visual coding environment where code structures like classes, methods, functions, and even entire files are represented as interactive visual boxes. This allows users to design, organize, save, and load projects visually. It utilizes Flask for the backend, D3.js for visualization, and Monaco Editor for code editing capabilities associated with each box.

## Features

*   **Visual Code Structure:** Uses D3.js to represent code elements (classes, methods, functions, files) as interactive visual boxes. Users can arrange and connect these boxes to design application logic.
*   **Project Management:**
    *   Save current project state to a `.boxcode` file (JSON format).
    *   Load existing `.boxcode` projects from the server.
    *   List available projects stored on the server.
*   **Code Generation:** Includes functionality to generate code based on the visual project (currently a placeholder).
*   **Integrated Code Editor:** Uses Monaco Editor for viewing/editing associated code snippets.

## Technology Stack

*   **Backend:** Python (Flask)
*   **Frontend:** HTML, CSS, JavaScript
*   **JavaScript Libraries:**
    *   D3.js (v7) - For data visualization and interaction.
    *   Monaco Editor - For code editing.

## Setup and Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```
2.  **Install dependencies:**
    This project requires Flask. You can install it using pip:
    ```bash
    pip install Flask
    ```
    *(Note: Consider creating a `requirements.txt` file for easier dependency management.)*
3.  **Run the application:**
    ```bash
    python app.py
    ```
4.  Open your web browser and navigate to `http://127.0.0.1:5000` (or the address provided by Flask).

## Usage

*   Use the main interface to add and arrange visual elements (boxes).
*   Click **"Add File"** to add new code elements or files within the visual structure (exact functionality depends on `editor.js`/`app.js`).
*   Click **"Save Project"** to save the current state. You might be prompted for a name. Projects are saved in the `projects/` directory.
*   Click **"Load Project"** to open a modal displaying saved `.boxcode` files. Select a project to load it into the editor.
*   Click **"Generate Code"** to trigger the code generation process (currently outputs placeholder text). The generated code appears in a modal.

## Project Structure

```
.
├── .gitignore
├── app.py              # Main Flask application file
├── projects/           # Directory where .boxcode project files are saved
├── static/
│   ├── css/
│   │   └── style.css   # Custom CSS styles
│   └── js/
│       ├── app.js      # Main frontend application logic
│       └── editor.js   # Logic related to the Monaco editor and D3 visualization
└── templates/
    └── index.html      # Main HTML template for the application
```

## API Endpoints

The Flask backend provides the following API endpoints:

*   `GET /`: Serves the main HTML page (`index.html`).
*   `POST /api/save`: Saves project data (sent as JSON) to a `.boxcode` file.
    *   Request Body: `{ "name": "project_name", "data": { ... } }`
    *   Response: `{ "success": true/false, "message": "..." }`
*   `POST /api/load`: Loads project data from a specified `.boxcode` file.
    *   Request Body: `{ "filename": "project_name.boxcode" }`
    *   Response: `{ "success": true/false, "data": { ... } / "message": "..." }`
*   `GET /api/projects`: Lists all `.boxcode` files in the `projects/` directory.
    *   Response: `{ "success": true/false, "projects": [...] / "message": "..." }`
*   `POST /api/generate`: Placeholder endpoint for code generation.
    *   Request Body: `{ "data": { ... } }`
    *   Response: `{ "success": true, "generated_code": "..." }`
