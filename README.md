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
MONGO_URI=mongodb+srv://username:password@cluster.example.mongodb.net/seclore_leads?retryWrites=true&w=majority
CLIENT_ORIGIN=http://127.0.0.1:4321,http://localhost:4321
PUBLIC_API_BASE_URL=http://127.0.0.1:5000
PUBLIC_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
RECAPTCHA_SECRET_KEY=
```

Use the Google reCAPTCHA test site key for local development only. In production, set
`PUBLIC_RECAPTCHA_SITE_KEY` and `RECAPTCHA_SECRET_KEY` to real keys from the same
Google reCAPTCHA project.

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

The API validates required fields and returns JSON errors for invalid input. If `MONGO_URI` is not configured, lead endpoints accept valid submissions with a success response and log the lead payload for local/deployment previews. When MongoDB is configured, failed saves return a clear message for authentication, Atlas IP access list, or network issues.

## Netlify

The static Astro build is Netlify-ready through `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

Demo submissions use `/api/demo` in production, which Netlify rewrites to `/.netlify/functions/demo`. Locally, `npm run dev` starts Astro and the Express API together, and forms post to `http://127.0.0.1:5000`. Frontend pages only default to localhost while running in Astro development mode; production uses `PUBLIC_API_BASE_URL` when provided, otherwise same-origin `/api/...`.

For Netlify, set these environment variables:

```bash
MONGO_URI=your MongoDB Atlas connection string
CLIENT_ORIGIN=https://your-site.netlify.app
PUBLIC_RECAPTCHA_SITE_KEY=your production site key
RECAPTCHA_SECRET_KEY=your production secret key
```
