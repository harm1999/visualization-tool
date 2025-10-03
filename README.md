# Visualization Tool
Please click the picture below to get an introduction on the tooling and its features.

[![Watch the video](https://github.com/user-attachments/assets/6566ee42-184e-43dd-85ae-f3925817435d)](https://vimeo.com/1124158939)


Visualization Tool is a full-stack application for exploring software architecture data. It pairs a React-based front-end with a Flask API and a PostgreSQL database to load, visualize, and analyze nodes, edges, traces, and recommendations captured from complex systems.

## Repository structure

```
.
├── api/             # Flask application and database layer
├── front-end2/      # React + TypeScript + Vite user interface
└── README.md        # Project overview (this file)
```

### Back-end (`api/`)

* **Framework:** Flask with CORS enabled for local development.【F:api/application.py†L1-L104】
* **Database access:** SQLAlchemy models and helpers manage nodes, edges, functions, and trace data in PostgreSQL.【F:api/SQLConnector.py†L1-L125】
* **Core capabilities:**
  * Bootstrap database tables and ingest graph payloads exported from visualization tools.【F:api/application.py†L22-L65】【F:api/Database.py†L45-L122】
  * Query nodes, edges, descendants, and surrounding context for targeted exploration.【F:api/application.py†L67-L140】
  * Upload and analyze execution traces, including tree traversal utilities and automated descriptions.【F:api/application.py†L142-L212】【F:api/Database.py†L12-L79】
* **Dependencies:** listed in `api/requirements.txt`. Python 3.10+ is recommended.【F:api/requirements.txt†L1-L6】

Environment variables configure database connectivity and default to a local PostgreSQL instance:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL hostname.【F:api/SQLConnector.py†L86-L120】 |
| `DB_PORT` | `5432` | PostgreSQL port. |
| `DB_NAME` | `new_tool` | Database name. |
| `DB_USER` | `postgres` | Database user. |
| `DB_PASSWORD` | `` (empty) | Database password. |

### Front-end (`front-end2/`)

* **Framework:** React 19 with TypeScript, Vite, and Tailwind CSS for rapid development.【F:front-end2/package.json†L1-L44】
* **Visualization libraries:** Cytoscape (plus multiple layout extensions), D3, and Material Tailwind components for rich graph rendering and layout control.【F:front-end2/package.json†L13-L34】
* **Application entry point:** `src/main.tsx` bootstraps the UI, while `App.tsx`, `DynamicView.tsx`, and `StaticView.tsx` provide interactive and static exploration modes.【F:front-end2/src/App.tsx†L1-L94】【F:front-end2/src/DynamicView.tsx†L1-L200】
* **Tooling:** ESLint, TypeScript project references, and Vite dev server for hot module replacement.【F:front-end2/package.json†L6-L31】

## Getting started

You can run the full stack with Docker or launch each layer manually.

### Option 1: Docker (recommended)

1. Install Docker Desktop (or Docker Engine) and Docker Compose.
2. From the repository root, change into the front-end directory:
   ```bash
   cd front-end2
   docker-compose up --build
   ```
    (NOTE: Sometimes, an error is thrown on the first build. Running ```docker-compose-up``` again solves this.)

3. The React app will be available at <http://localhost:3000>, the Flask API at <http://localhost:5000>, and PostgreSQL on port 5432 using the credentials defined in `docker-compose.yml`. Data volumes are persisted between runs.【F:front-end2/docker-compose.yml†L1-L37】

### Option 2: Run services locally

#### Backend API

```bash
cd api
python -m venv .venv
source .venv/bin/activate  # On Windows use `.venv\Scripts\activate`
pip install -r requirements.txt
export FLASK_APP=application.py
export DB_HOST=localhost     # adjust if you are not using the defaults
flask run --host 0.0.0.0 --port 5000
```

Ensure PostgreSQL is running and matches the credentials described above.

#### Front-end

```bash
cd front-end2
npm install
npm run dev
```

The Vite dev server will provide a URL (usually `http://localhost:5173`) where you can access the UI.

## Data workflows

1. **Initialize database tables:** Send a `PUT` request to `/create-tables/` to create core tables if they do not exist.【F:api/application.py†L22-L33】
2. **Ingest architecture data:** POST graph JSON payloads to `/inject-data/`. Nodes, edges, and relationships are normalized for querying.【F:api/application.py†L35-L45】【F:api/Database.py†L45-L122】
3. **Upload traces:** Upload XML trace files via `/upload-trace/` to populate the `trace_nodes` table for timeline analysis.【F:api/application.py†L164-L182】【F:api/Database.py†L12-L79】
4. **Explore relationships:** Utilize `/get-node/`, `/get-descendants/`, `/get-surroundings/`, `/get-tree-*` endpoints and related APIs to fetch the data that powers the interactive visualizations.【F:api/application.py†L46-L212】

## Useful scripts

* `npm run lint` in `front-end2/` runs ESLint over the TypeScript source.【F:front-end2/package.json†L6-L31】
* `npm run build` performs a production build of the front-end.
* The Flask app can be launched with `python application.py` for a quick local test environment.【F:api/application.py†L206-L212】

## Contributing

1. Create a feature branch from `main`.
2. Follow the existing TypeScript and Python styles in the respective directories.
3. Ensure lint checks and tests (if available) pass before opening a pull request.
4. Document new endpoints or UI behaviors in this README as needed.

## License

This project does not currently declare a license. Please contact the repository owner for usage terms.
