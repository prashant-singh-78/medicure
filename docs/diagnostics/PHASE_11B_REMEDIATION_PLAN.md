# Medicure Phase 11B — Remediation and Action Plan

**Plan Date:** 2026-10-25  
**Execution Gate:** Pre-Execution Planning (Review Required Before Applying Changes)  
**Target:** Remediation of Repository Tracking, Build Quirks, Linter Debt, and API Host Configuration  

---

## 1. Overview & Guiding Principles

This plan outlines the minimal, targeted, and non-destructive remediation steps required to transition Medicure from the Phase 11B preflight audit to a clean, deployable academic demonstration.

### Strict Safety Rules
- **No data loss:** Local SQLite databases (`medicines.db`, `medicine_expanded.db`) must never be deleted.
- **No credential leaks:** Environment files (`.env`) must remain untracked.
- **Minimal code changes:** Only fix confirmed functional blockers and verified linter defects.
- **No clinical claims:** Maintain clear disclaimer boundaries across all UI modules.

---

## 2. Issue 1: Git-Tracked Sensitive Databases

### Problem
`backend/database/medicines.db` and `backend/database/database/medicines.db` are actively tracked in the Git index (`git ls-files`). Any runtime update modifies the tracked file, risking accidental commits of user session hashes.

### Remediation Step (Non-Destructive Untracking)
Execute Git untracking with the `--cached` flag. This removes the file from Git's tracking index while leaving the actual database file untouched on the developer's disk:

```powershell
# 1. Untrack from Git index without deleting local files
git rm --cached "backend/database/medicines.db"
git rm --cached "backend/database/database/medicines.db"

# 2. Verify .gitignore already includes database patterns
# (Confirmed: *.db, *.sqlite, *.sqlite3 are present in .gitignore)

# 3. Stage and commit ONLY the untracking operation
git commit -m "chore(security): untrack local sqlite databases from git index"
```

### Historical Commit Scrubbing (Optional for Public Repositories)
Because `medicines.db` was committed in previous revisions (`29e79a9`, `8955985`, `1150101`, `62ae950`, `497bfc8`):
- If the repository remains private or academic, untracking via `git rm --cached` is sufficient.
- If the repository is published open-source, run `git-filter-repo` or `BFG Repo-Cleaner` to purge historical blobs:
  ```bash
  bfg --delete-files medicines.db
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  ```
- **Credential Rotation:** Rotate any non-demo test passwords used during development.

---

## 3. Issue 2: Frontend Build Across NTFS Junctions & ESLint Debt

### Problem A: NTFS Cross-Drive Build Quirk
When Vite 8 / Rolldown is invoked from `C:` pointing through the NTFS junction to `D:`, cross-drive path resolution prevents relative file calculation.
- **Remediation:** In documentation, CI/CD scripts, and Dockerfiles, specify build commands from the canonical root:
  ```powershell
  cd "D:\prash projects\fy project\smart-health-assistant\frontend"
  npm run build
  ```
  In Linux/Docker environments, no cross-drive NTFS junctions exist, ensuring consistent zero-error builds.

### Problem B: ESLint React 19 / ESLint 9 Linter Errors (12 Errors, 6 Warnings)
While `npm run build` succeeds cleanly in 202ms, standalone `npx eslint src` fails with code 1.
- **Proposed Minimal Fixes:**
  1. **Unused Variables (6 errors):** Remove or underscore-prefix unused variables (`err` -> `_err`, `error` -> `_error`, remove unused `isStandalone` in `AboutApp.jsx`, remove unused `addToast` in `Ayurveda.jsx`).
  2. **Effect Hoisting (`react-hooks/immutability` - 4 errors):** In `History.jsx`, `MedicineReminder.jsx`, and `Meditation.jsx`, move helper functions (`fetchHistory`, `fetchReminders`, `completeSession`) *above* the `useEffect` hooks that call them.
  3. **Synchronous setState in Effect (`react-hooks/set-state-in-effect` - 2 errors):**
     - In `App.jsx:115`, move `setUser(null)` into a separate callback or wrap in an asynchronous check.
     - In `EmergencySOS.jsx:77`, avoid immediate synchronous setState during effect mounting.

---

## 4. Issue 3: Frontend API URL Consistency for Cross-Domain Hosting

### Problem
Most pages use `(import.meta.env.VITE_API_BASE_URL || '') + '/api/...'`. However, 3 isolated API calls in `AboutDisease.jsx`, `MedicineDetection.jsx`, and `MedicineSuggestion.jsx` hardcode relative `/api/medicine/...` without `VITE_API_BASE_URL`.
- If the frontend is deployed to GitHub Pages (`https://<user>.github.io/medicure`) while the backend is deployed to Render/Railway (`https://api.medicure.org`), those 3 relative requests would 404 against GitHub Pages!

### Proposed Minimal Fix
Update the 3 lines to prepend `(import.meta.env.VITE_API_BASE_URL || '')`:
- `frontend/src/pages/AboutDisease.jsx:15`
- `frontend/src/pages/MedicineDetection.jsx:28` & `74`
- `frontend/src/pages/MedicineSuggestion.jsx:16`

---

## 5. Issue 4: Production CORS & Environment Configuration

### Problem
`backend/app/main.py` currently uses:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
When `allow_credentials=True`, modern browser security standards reject wildcard origins (`"*"`) on cross-origin credentialed requests.

### Proposed Minimal Fix
Allow configurable origins from environment:
```python
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 6. Issue 5: Containerized Deployment Runbook (Docker)

To ensure smooth academic demo deployment without local Windows path or loopback sandbox friction, provide a unified `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./backend/database:/app/database
      - ./backend/models:/app/models

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://localhost:8000
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 7. Prioritized Execution Order

Upon user review and approval, execute remediation in the following exact order:

1. **Step 1 — Untrack Sensitive DB:** Run `git rm --cached` on the 2 tracked SQLite files.
2. **Step 2 — Normalize API URLs:** Update the 3 relative fetch calls to respect `VITE_API_BASE_URL`.
3. **Step 3 — Remediate ESLint Debt:** Fix function hoisting and unused variables in the 6 React components.
4. **Step 4 — Verify Builds & Tests:** Re-run `npm run build`, `npx eslint src`, and all 3 Python regression suites.
5. **Step 5 — Ready for Demo Hosting:** Package container or deploy static assets with live Uvicorn backend.
