<!-- markdownlint-disable MD033 -->

# AnimalKart Platform

AnimalKart is an agri-investment marketplace that blends a cinematic Next.js frontend with a FastAPI backend wired directly into Odoo ERP. Investors, agents, and admins can browse livestock units, place orders, validate KYC, manage warehouses, and reconcile invoices in one cohesive stack.

---

## 1. Architecture at a Glance

| Layer | Stack | Highlights |
| --- | --- | --- |
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, Framer Motion, GSAP, Lenis, Zustand, React Hook Form + Zod | Immersive smooth-scroll storytelling, animated dashboards, typed forms, REST client | 
| Backend | FastAPI, SQLAlchemy, JWT via python-jose, Passlib, SQLite (dev) | Multi-role auth (investor/agent/admin), Odoo sync, order + invoice lifecycle, warehouse APIs | 
| Integrations | Odoo XML-RPC service, Docker Compose | Partner/product ingestion, order confirmation, invoice posting, one-command local orchestration |

Key backend services live in [`backend/app/main.py`](backend/app/main.py) (@ backend/app/main.py#5-777). JWT/role guards are defined in [`backend/app/auth.py`](backend/app/auth.py) (@ backend/app/auth.py#1-70), while configuration + env parsing lives in [`backend/app/config.py`](backend/app/config.py) (@ backend/app/config.py#1-75). Frontend dependencies/scripts are managed from [`animalkart/package.json`](animalkart/package.json) (@ animalkart/package.json#1-44).

---

## 2. Feature Highlights

1. **Multi-role Authentication** – Tokens embed role, partner_id, and KYC state for downstream enforcement (@ backend/app/auth.py#12-70).
2. **Investor Dashboards** – Wallets, holdings, orders, invoices, referrals, rewards, and transfers endpoints (@ backend/app/main.py#258-551).
3. **Admin Control Plane** – Approve orders, validate deliveries, generate/post invoices, and register payments directly against Odoo (@ backend/app/main.py#553-777).
4. **Warehouse Intelligence** – Stock snapshots, warehouse CRUD, transfers, and admin stock adjustments (@ backend/app/main.py#267-347, backend/app/main.py#611-729).
5. **Typed Motion UI** – Next.js App Router + Tailwind v4 + GSAP/Lenis for buttery transitions, with Zustand state management (@ animalkart/package.json#5-42).

---

## 3. Repository Layout

```
Animal_Kart-1/
├── animalkart/          # Next.js 16 frontend (App Router, Tailwind v4)
├── backend/             # FastAPI service + Odoo integration
├── docker-compose.yml   # Orchestrates frontend/backend together
└── README.md            # You are here
```

---

## 4. Getting Started

### 4.1 Clone

```bash
git clone https://github.com/SreeRamVaddi2208/Animal_Kart.git
cd Animal_Kart
```

### 4.2 Environment Variables

#### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Populate values for Odoo connectivity, JWT secrets, database URL, and CORS origins (defaults defined in [`backend/app/config.py`](backend/app/config.py) @ backend/app/config.py#47-61). Never commit production secrets.

#### Frontend (`animalkart/.env.local`)

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development
```

Add any additional public vars referenced in components.

### 4.3 Install Dependencies

**Frontend**

```bash
cd animalkart
npm install
```

**Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate        # macOS/Linux
pip install -r requirements.txt
```

### 4.4 Run Locally

Start the backend and frontend in separate terminals:

**Backend (FastAPI + Uvicorn)**

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Swagger UI: <http://localhost:8000/docs>

**Frontend (Next.js dev server)**

```bash
cd animalkart
npm run dev
```

App URL: <http://localhost:3000>

---

## 5. Docker Compose Workflow

The root `docker-compose.yml` spins up both services with shared networking:

```bash
docker compose up --build
```

Override environment values via `.env` or Compose overrides. Ensure the backend container can reach your Odoo endpoint.

---

## 6. Useful Scripts

| Context | Command | Purpose |
| --- | --- | --- |
| Frontend | `npm run dev` | Start Next.js dev server |
| Frontend | `npm run build && npm run start` | Production build/serve |
| Frontend | `npm run lint` | ESLint check |
| Backend | `uvicorn app.main:app --reload` | Run FastAPI locally |
| Backend | `pytest` (future) | Add API tests via pytest + httpx |

---

## 7. Deployment Notes

1. **Backend** – Containerize with `backend/Dockerfile`, supply production env vars, and point `DATABASE_URL` to Postgres/MySQL. Deploy on AWS ECS/Fargate, Azure App Service, Render, etc.
2. **Frontend** – Build with `npm run build` and serve via Node 20+, or deploy to Vercel/Netlify.
3. **Secrets** – Use GitHub Actions secrets, SSM, or Vault. Keep `.env` files out of source control.

---

## 8. Contributing

1. Fork → branch → commit → PR.
2. Keep diffs focused; run linters before pushing.
3. Open GitHub issues for bugs, feature requests, or integration ideas.

Happy building! 🐃🚀

