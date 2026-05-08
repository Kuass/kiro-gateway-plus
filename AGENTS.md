# AGENTS.md

Compact repo guidance for future OpenCode sessions. Keep this file factual and short; prefer executable config over prose when they disagree.

## Repo shape

- This fork tracks `jwadow/kiro-gateway` plus local patches listed at the top of `README.md`; do not assume upstream behavior without checking fork commits/docs first.
- Root Python app is the Kiro gateway: `main.py` builds the FastAPI app and includes `kiro.routes_openai` plus `kiro.routes_anthropic`.
- Root package boundaries matter: API adapters live in `kiro/routes_*.py`, conversion logic in `kiro/converters_*.py` and shared `kiro/converters_core.py`, streaming in `kiro/streaming_*.py`, auth/account/model/http plumbing in `kiro/auth.py`, `kiro/account_manager.py`, `kiro/model_resolver.py`, `kiro/http_client.py`.
- There is also a TypeScript admin backend in `backend/` with its own `backend/AGENTS.md`. Treat it as a separate Express/Mongo service; run its commands from `backend/`.
- `frontend/AGENTS.md` currently describes a Next.js app, but the checked-in `frontend/` only has `Dockerfile`, `env.example`, and `next.config.js`; verify files before relying on that guide.

## Python gateway commands

- Install Python deps: `pip install -r requirements.txt`.
- Run gateway: `python main.py`; override with `python main.py --host 127.0.0.1 --port 9000`. CLI args beat env vars.
- Uvicorn direct run is valid, but uvicorn owns CLI args: `uvicorn main:app --host 0.0.0.0 --port 8000`.
- Focused tests: `pytest tests/unit/test_auth_manager.py -v` or `pytest tests/unit/test_auth_manager.py::TestKiroAuthManagerInitialization::test_initialization_stores_credentials -v`.
- CI test command is `pytest -v --tb=short`; coverage is a separate pass after installing `pytest-cov`: `pytest --cov=kiro --cov-report=xml --cov-report=term`.
- `pytest.ini` sets `testpaths = tests`, `pythonpath = .`, and excludes `old`, `requests`, and `_notes`; `manual_api_test.py` is intentionally not part of automatic pytest.

## Testing constraints

- Tests must not reach the network. `tests/conftest.py` installs autouse fixtures that create temporary credentials/state and block real `httpx.AsyncClient` connections.
- Add regression tests in the closest existing `tests/unit/test_*.py` file; check `tests/README.md` before creating a new test file.
- Gateway feature changes usually need coverage across OpenAI and Anthropic surfaces, and both streaming and non-streaming paths when the behavior is shared.

## Runtime/config gotchas

- `.env` is loaded in `kiro/config.py`; `.env.example` is the source of available knobs.
- Incoming API key validation can be legacy env mode (`PROXY_API_KEY`) or MongoDB mode (`API_KEY_SOURCE=mongodb`). Billing/model allowlist also depend on MongoDB settings.
- Kiro auth can come from `KIRO_CREDS_FILE`, `REFRESH_TOKEN`, or `KIRO_CLI_DB_FILE`; README notes macOS kiro-cli data is typically under `~/Library/Application Support/kiro-cli`.
- `ACCOUNT_SYSTEM=true` can migrate `.env` credentials into `credentials.json` and maintain runtime state in `state.json`; do not commit generated credential/state files.
- Streaming first-token retry knobs are `FIRST_TOKEN_TIMEOUT`, `FIRST_TOKEN_MAX_RETRIES`, and `STREAMING_READ_TIMEOUT`.
- Debug logs are controlled by `DEBUG_MODE=off|errors|all` and write under `debug_logs/`.

## Docker/CI

- Local Docker path: `docker-compose up -d`, `docker-compose logs -f`, `docker-compose down`; compose loads `.env` and maps `./debug_logs:/app/debug_logs`.
- Root `Dockerfile` is Python 3.10 slim, runs as non-root `kiro`, removes `credentials.json`/`state.json`, and starts with `python main.py`.
- GitHub Actions builds/tests only the root gateway image: install `requirements.txt`, run pytest, build `kiro-gateway:test`, run Trivy in report-only mode, verify imports and `python main.py --version`, then push on non-PR events.

## Backend service (`backend/`)

- Commands from `backend/package.json`: `npm run dev`, `npm run build`, `npm run start`, `npm run seed`, `npm run lint`.
- `backend/tsconfig.json` uses `module: NodeNext`, `target: ES2022`, `strict: true`, outputs to `dist/`.
- Backend entrypoint is `backend/src/index.ts`; default port is `BACKEND_PORT || 3000` even though `backend/AGENTS.md` mentions 3005.
- Follow backend layering from `backend/AGENTS.md`: routes → controllers → services → repositories → models.

## Change discipline

- Preserve gateway transparency: fix Kiro/API compatibility issues and opt-in enhancements, but do not silently rewrite user conversation content or decide what context to drop.
- Catch specific exceptions with useful context; do not introduce bare `except:`/broad swallowing or credential logging.
- Keep code/comments/docstrings in English. Existing non-English comments exist in config, but new work should not add more.
- Before finishing code edits, run the narrow relevant pytest/backend command and use JetBrains file inspections for changed files when available.
