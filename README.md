# seclore Astro Security Site

Original Astro + Node/Express website for a cybersecurity/data-security SaaS brand concept.

## Stack

- Astro static frontend
- Node + Express API
- MongoDB lead storage through Mongoose
- `.env` configuration for API port, Mongo URI, and frontend origin

## Run Locally

```bash
npm install
npm run dev
```

Frontend: `http://127.0.0.1:4321`  
Backend health: `http://127.0.0.1:5000/api/health`

## Environment

Create `.env` from `.env.example` and set:

```bash
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/seclore_leads
CLIENT_ORIGIN=http://127.0.0.1:4321
PUBLIC_API_BASE_URL=http://127.0.0.1:5000
```

## API

`POST /api/contact`

```json
{
  "name": "Maya Shah",
  "email": "maya@example.com",
  "message": "I want to discuss external collaboration controls."
}
```

`POST /api/demo`

```json
{
  "name": "Maya Shah",
  "email": "maya@example.com",
  "company": "Northstar Bank",
  "interest": "Compliance reporting"
}
```

The API validates required fields and returns JSON errors for invalid input. If `MONGO_URI` is not configured, lead endpoints return `503` with setup guidance.
