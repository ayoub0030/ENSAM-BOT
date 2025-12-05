# ENSAM-BOT RAG App

This repository contains a Retrieval-Augmented Generation (RAG) system for ENSAM with multiple entrypoints:

- **Vanilla Python RAG** (`VanillaRag.py`)
- **Streamlit UI** (`streamlit_app.py`)
- **FastAPI backend** (`api.py`)
- **React (Vite) frontend** (`frontend/`)

---

## 1. Prerequisites

- Python 3.9+ installed
- Git installed
- An OpenAI API key

---

## 2. Clone the repository

```bash
git clone https://github.com/ayoub0030/ENSAM-BOT.git
cd ENSAM-BOT
```

---

## 3. Create and activate a virtual environment

### Windows (PowerShell)

```powershell
python -m venv myenv
myenv\Scripts\Activate.ps1
```

If execution policy blocks activation, run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again:

```powershell
myenv\Scripts\Activate.ps1
```

### Deactivate venv

```powershell
deactivate
```

The `.gitignore` already excludes common virtualenv folders.

---

## 4. Install Python dependencies

With the virtual environment **activated**:

```bash
pip install -r requirements.txt
```

---

## 5. Environment variables (`.env`)

Create a `.env` file at the root of the project (same folder as `VanillaRag.py`) and **never commit it** (it is already in `.gitignore`).

Example:

```env
OPENAI_API_KEY=sk-...
# Add any other keys / settings you use
```

> **Important:** If you ever accidentally commit `.env`, rotate your API key and remove the commit before pushing.

---

## 6. Running the apps

You can interact with the RAG system in three ways.

### 6.1 Streamlit UI (quick demo)

There is a quick starter file `quickStarterr.md` which essentially runs:

```powershell
myenv\Scripts\Activate.ps1
streamlit run streamlit_app.py
```

So, from the project root:

1. Activate the virtual environment:
   ```powershell
   myenv\Scripts\Activate.ps1
   ```
2. Run Streamlit:
   ```powershell
   streamlit run streamlit_app.py
   ```

Streamlit will print a local URL (e.g. `http://localhost:8501`). Open it in your browser.

On first load the app will automatically build or load the RAG index from the `docs/` folder (it uses the `vectorstore/` directory to cache the index).

### 6.2 Vanilla Python script

If you want to run the vanilla RAG script directly (for example `VanillaRag.py`):

```powershell
myenv\Scripts\Activate.ps1
python VanillaRag.py
```

This will build/load the index and can be used for quick CLI-style testing.

### 6.3 FastAPI backend

The backend API is defined in `api.py` and exposes endpoints such as `/health`, `/build-index`, `/query`, `/status`, `/docs-info`.

From the project root (with venv activated):

```powershell
myenv\Scripts\Activate.ps1
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

or simply (using the `__main__` block):

```powershell
myenv\Scripts\Activate.ps1
python api.py
```

The API will listen by default on `http://localhost:8000`.

**Typical flow via API:**

1. `POST /build-index` with optional `chunk_size` and `chunk_overlap` to build the RAG index from PDFs in `docs/`.
2. `POST /query` with a `question` (and optional `use_web_search`) to get answers + sources.

### 6.4 React (Vite) frontend

The React frontend lives in the `frontend/` directory and communicates with the FastAPI backend.

#### Install Node dependencies (first time only)

```powershell
cd frontend
npm install
```

#### Configure API URL (optional)

By default, the frontend uses:

```js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

If your API is running on a different URL or port, create a `.env` file inside `frontend/` and set:

```env
VITE_API_URL=http://localhost:8000
```

#### Run the React dev server

From the `frontend/` folder:

```powershell
npm run dev
```

Vite will print a local URL such as `http://localhost:5173`. Make sure the FastAPI backend is running (on `http://localhost:8000` by default), then open the frontend URL in your browser.

---

## 7. Project structure (simplified)

```text
ENSAM-BOT/
├─ VanillaRag.py           # Main vanilla RAG class (indexing + querying)
├─ streamlit_app.py        # Streamlit UI entrypoint
├─ api.py                  # FastAPI backend (RAG API)
├─ requirements.txt        # Python dependencies
├─ docs/                   # PDF documents used for RAG
│  └─ ...
├─ vectorstore/            # Saved FAISS index (auto-created)
├─ frontend/               # React (Vite) frontend
│  ├─ package.json
│  ├─ index.html
│  └─ src/
│     ├─ App.jsx
│     ├─ api.js            # Axios client for FastAPI
│     └─ components/
├─ .env                    # Local-only env vars for backend (ignored by git)
├─ .gitignore
└─ README.md
```

---

## 8. Common commands

```powershell
# Create venv
python -m venv myenv

# Activate venv (Windows PowerShell)
myenv\Scripts\Activate.ps1

# Install Python deps
pip install -r requirements.txt

# Run Streamlit app
streamlit run streamlit_app.py

# Run vanilla script
python VanillaRag.py

# Run FastAPI backend
uvicorn api:app --host 0.0.0.0 --port 8000 --reload

# Frontend (from frontend/)
cd frontend
npm install
npm run dev
```

---

## 9. Notes

- Do **not** commit your `.env` file or any API keys.
- If you change dependencies, run `pip freeze > requirements.txt` to update them (optional, if you want exact versions).
- Use a dedicated virtual environment per project to avoid dependency conflicts.
