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
