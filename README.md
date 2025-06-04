# DealIQ Full Stack Setup

This README covers:

1. **Frontend Setup** (Next.js)
2. **Backend Setup** (FastAPI)
3. **Ollama Setup** (Local LLM server)

Once complete, you will have a working frontend and backend, with AI inference via Ollama, all hosted locally or deployed to your environment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Directory Structure](#directory-structure)
3. [Backend Setup (FastAPI)](#backend-setup-fastapi)
   1. [Create & Activate Virtual Environment](#create--activate-virtual-environment)
   2. [Install Python Dependencies](#install-python-dependencies)
   3. [Environment Variables](#environment-variables)
   4. [Run FastAPI Server](#run-fastapi-server)
   5. [API Endpoints](#api-endpoints)
4. [Ollama Setup (Local LLM)](#ollama-setup-local-llm)
   1. [Install Ollama](#install-ollama)
   2. [Pull a Model](#pull-a-model)
   3. [Start Ollama Server](#start-ollama-server)
   4. [Verify Ollama is Running](#verify-ollama-is-running)
5. [Frontend Setup (Next.js)](#frontend-setup-nextjs)
   1. [Create Project](#create-project)
   2. [Install Dependencies](#install-dependencies)
   3. [Environment Variables](#environment-variables-frontend)
   4. [Run Development Server](#run-development-server)
6. [Putting It All Together](#putting-it-all-together)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Operating System**: macOS, Linux, or Windows (with WSL).
- **Python 3.9+** installed and accessible via `python3`.
- **Node.js / npm** (v16+) installed for the frontend.
- **Ollama CLI** (see below).
- **Docker** (if planning to containerize or deploy as in production).

---

## Directory Structure

```
dealiq/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── services/
│   │   │   └── ollama_service.py
│   │   └── utils/
│   │       └── finance_data.py
│   ├── requirements.txt
│   ├── Dockerfile      ← (for containerized deploy)
│   └── entrypoint.sh   ← (to start Ollama & Uvicorn)
└── frontend/
    ├── app/
    │   └── page.tsx
    ├── public/
    ├── styles/
    ├── next.config.js
    ├── package.json
    └── .env.local       ← (for API_BASE)
```

---

## Backend Setup (FastAPI)

### Create & Activate Virtual Environment

1. Open a terminal and `cd` into the `backend/` folder:
   ```bash
   cd dealiq/backend
   ```
2. Create a new virtual environment:
   ```bash
   python3 -m venv venv
   ```
3. Activate the virtual environment:
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows (Powershell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```

### Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**`requirements.txt`** should include:

```
fastapi
uvicorn[standard]
pydantic
python-dotenv
httpx
yfinance
requests
```

### Environment Variables

Create a `.env` file in `backend/` with:

```
OLLAMA_URL=http://localhost:11435/api/generate
OLLAMA_MODEL=llama3.2
NEWSAPI_KEY=<your_newsapi_key>  # (optional, if using NewsAPI)
```

### Run FastAPI Server

If you are using Ollama locally (not in Docker), start it first (see Ollama section below). Then in the `venv`:

```bash
uvicorn app.main:app --reload --port 8000
```

Your backend will now listen on `http://localhost:8000` and expect Ollama at `http://localhost:11435`.

### API Endpoints

- **POST** `/api/generate_memo`
  - **Request**: `{ "ticker": "AAPL" }`
  - **Response**:
    ```json
    {
      "company_name": "Apple Inc.",
      "Sector": "Technology",
      "Market Cap": "$...",
      "Price": "$...",
      "Volume": "...",
      "Price Change": "...",
      "Key Metrics": {
        "peRatio": "...",
        "eps": "...",
        "dividend": "...",
        "beta": "..."
      },
      "memo": {
        "Executive Summary": "...",
        "Business Overview": "...",
        "Financial Highlights": "...",
        "Comparable Companies": "...",
        "Valuation Narrative": "...",
        "Risks & Recommendations": "...",
        "Recommendation": "...",
        "Target Price": "..."
      }
    }
    ```

---

## Ollama Setup (Local LLM)

### Install Ollama

Follow instructions at [https://ollama.ai/docs](https://ollama.ai/docs). On macOS/Linux, typically:

```bash
# Using their install script:
curl -fsSL https://ol.ai/install.sh | bash
```

Verify `ollama` is on your `PATH`:

```bash
ollama --version
```

### Pull a Model

```bash
ollama pull llama3.2
```

This downloads the `llama3.2` model locally.

### Start Ollama Server

Run Ollama in one terminal. By default, it listens on port `11435`:

```bash
ollama run llama3.2
```

If you need to specify port explicitly:

```bash
ollama run llama3.2 --port 11435
```

### Verify Ollama is Running

In another terminal:

```bash
curl -X POST http://localhost:11435/api/generate   -H "Content-Type: application/json"   -d '{"model":"llama3.2", "prompt":"Hello"}'
```

You should receive a JSON response containing `"response": "...some text..."`.

---

## Frontend Setup (Next.js)

### Create Project

If you haven’t already, from the `dealiq/` root:

```bash
cd dealiq
npx create-next-app@latest frontend --experimental-app
cd frontend
```

### Install Dependencies

```bash
npm install
npm install lucide-react @radix-ui/react-tabs @tailwindcss/forms # (or your UI libs)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure **`tailwind.config.js`** and add your styles in `globals.css`.

### Environment Variables

Create `.env.local` inside the `frontend/` folder:

```
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

This ensures your frontend makes requests to `http://localhost:8000/api/generate_memo`.

### Update Fetch in `page.tsx`

In your `page.tsx`, ensure you use:

```js
const apiBase = process.env.NEXT_PUBLIC_API_BASE;

const res = await fetch(`${apiBase}/api/generate_memo`, {
  method: 'POST',
  ...
});
```

### Run Development Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`, enter a ticker, and click “Generate Memo.” The frontend fetches from your FastAPI backend, which in turn queries Ollama.

---

## Putting It All Together

1. **Start Ollama** (port 11435):
   ```bash
   ollama run llama3.2
   ```
2. **Activate backend venv** & **start FastAPI** (port 8000):
   ```bash
   source venv/bin/activate
   uvicorn app.main:app --reload --port 8000
   ```
3. **Start frontend** (port 3000):
   ```bash
   cd frontend
   npm run dev
   ```
4. **Visit** `http://localhost:3000` → test “AAPL” or any ticker.
   - Frontend calls FastAPI → FastAPI calls Ollama → Ollama returns deep memo JSON → Frontend renders it.

---

## Troubleshooting

- **Ollama unavailable**: Ensure `ollama run llama3.2` is listening on `localhost:11435`.  
  Check logs and model download status.
- **FastAPI errors**: Look at the console where `uvicorn` is running. Confirm `.env` is correct.
- **Frontend no response**: Check DevTools Network tab. Ensure `NEXT_PUBLIC_API_BASE` points to `http://localhost:8000`.
- **CORS issues**: Backend uses `fastapi.middleware.cors.CORSMiddleware` to allow origins `localhost:3000`, `localhost:8000`, etc. Update as needed.

---

**Congratulations!** You now have a local full‐stack setup with a Next.js frontend, FastAPI backend, and Ollama LLM serving the `llama3.2` model. Enjoy building out further features and deploying to your preferred cloud environment.
