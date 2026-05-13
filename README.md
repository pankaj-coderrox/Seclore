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

The API validates required fields and returns JSON errors for invalid input. If `MONGO_URI` is not configured, lead endpoints accept valid submissions with a success response and log the lead payload for local/deployment previews.

## Netlify

The static Astro build is Netlify-ready through `netlify.toml`. Demo submissions use `/api/demo` in production, which Netlify rewrites to `/.netlify/functions/demo`. Locally, `npm run dev` starts Astro and the Express API together, and the demo form posts to `http://127.0.0.1:5000/api/demo`. If `PUBLIC_API_BASE_URL` is set to a localhost URL, the deployed site ignores it and keeps using the Netlify rewrite so production browsers never fetch from their own localhost.
