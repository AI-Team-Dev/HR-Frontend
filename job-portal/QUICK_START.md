# Quick Start Guide - API Setup

## ✅ Step 1: Verify Environment File

The `.env` file has been created with the default configuration:
```
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=15000
```

## ✅ Step 2: Start the Backend

Open a terminal and start the backend server:

```bash
cd backend
npm install
npm run dev
```

The backend should start on `http://localhost:3000`

## ✅ Step 3: Start the Frontend

Open another terminal and start the frontend:

```bash
cd frontend/job-portal
npm install
npm run dev
```

The frontend should start on `http://localhost:5173`

## ✅ Step 4: Test the Connection

1. Open your browser to `http://localhost:5173`
2. Open the browser's Developer Tools (F12)
3. Go to the Network tab
4. Navigate through the app - you should see API requests to `http://localhost:3000/api/...`

## Configuration

### Changing the API URL

If your backend runs on a different port or URL, edit `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### For Production

When deploying to production, update `.env` with your production backend URL:

```env
VITE_API_URL=https://api.yourdomain.com
```

**Important**: After changing `.env`, restart the Vite dev server.

## Troubleshooting

### Backend Not Running
- Error: "Network error" or "Failed to fetch"
- Solution: Make sure the backend is running on port 3000

### CORS Errors
- Error: "CORS policy" in console
- Solution: Check that backend `.env` has `FRONTEND_URL=http://localhost:5173`

### Environment Variables Not Loading
- Error: API calls go to wrong URL
- Solution: Restart the Vite dev server after changing `.env`

## API Endpoints Used

The frontend automatically connects to these endpoints:

- Authentication: `/api/login`, `/api/signup`, `/api/candidate/login`, `/api/candidate/signup`
- Jobs: `/api/jobs`, `/api/jobs/all`, `/api/jobs/:id`
- Profile: `/api/candidate/profile`
- Applications: `/api/applications`, `/api/applications/saved`

All endpoints are configured automatically - no manual setup needed!

