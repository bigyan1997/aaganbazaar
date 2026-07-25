# Aaganbazaar

A Nepal-focused ecommerce marketplace — Django 6 + DRF backend, React 19 + Vite + Tailwind v4 frontend.

## Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in DJANGO_SECRET_KEY and DATABASE_URL
python manage.py migrate
python manage.py runserver
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Backend tests

```bash
cd backend
python manage.py test tests          # full suite: smoke, functional, integration, e2e, security, fuzz
```

Load/stress testing (Locust, not a project dependency - installed ad hoc):

```bash
pip install locust
python manage.py seed_load_test_data   # creates an approved seller + products to hit
DJANGO_SETTINGS_MODULE=config.settings.loadtest python manage.py runserver 127.0.0.1:8006
locust -f locustfile.py --headless --host=http://127.0.0.1:8006 --users=100 --spawn-rate=20 --run-time=30s
```

`config.settings.loadtest` only loosens rate limits for this measurement - never point it anywhere but a local throwaway run.
