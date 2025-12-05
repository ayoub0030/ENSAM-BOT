# ENSAM-BOT RAG App

This repository contains a simple Retrieval-Augmented Generation (RAG) app (Vanilla Python + Streamlit).

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

## 4. Install dependencies

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

## 6. Running the app

### Streamlit UI

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

### Vanilla Python script

If you want to run the vanilla RAG script directly (for example `VanillaRag.py`):

```powershell
myenv\Scripts\Activate.ps1
python VanillaRag.py
```

Make sure your `.env` is configured beforehand.

---

## 7. Project structure (simplified)

```text
ENSAM-BOT/
├─ VanillaRag.py           # Main vanilla RAG script
├─ streamlit_app.py        # Streamlit UI entrypoint (if present)
├─ requirements.txt        # Python dependencies
├─ docs/
│  └─ Here is the cleaned version of your RAG document.pdf
├─ .env                    # Local-only env vars (ignored by git)
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

# Install deps
pip install -r requirements.txt

# Run Streamlit app
streamlit run streamlit_app.py

# Run vanilla script
python VanillaRag.py
```

---

## 9. Notes

- Do **not** commit your `.env` file or any API keys.
- If you change dependencies, run `pip freeze > requirements.txt` to update them (optional, if you want exact versions).
- Use a dedicated virtual environment per project to avoid dependency conflicts.
