# API Configuration Guide

This guide explains how to configure the frontend to connect to the backend API.

## Environment Variables

The frontend uses environment variables to configure the API connection. Create a `.env` file in the `frontend/job-portal` directory:

```bash
# Copy the example file
cp .env.example .env
```

### Configuration Options

#### `VITE_API_URL` (Required)
The base URL of your backend API.

- **Local Development**: `http://localhost:3000`
- **Production**: Your production backend URL (e.g., `https://api.yourdomain.com`)

#### `VITE_API_TIMEOUT_MS` (Optional)
API request timeout in milliseconds. Default: 15000 (15 seconds).

## Setup Steps

1. **Create `.env` file**:
   ```bash
   cd frontend/job-portal
   cp .env.example .env
   ```

2. **Edit `.env`** and set your backend URL:
   ```
   VITE_API_URL=http://localhost:3000
   ```

3. **Start the backend server** (in a separate terminal):
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **Start the frontend**:
   ```bash
   cd frontend/job-portal
   npm install
   npm run dev
   ```

## How It Works

The API client (`src/utils/api.js`) automatically:
- Reads `VITE_API_URL` from environment variables
- Appends API endpoints to the base URL
- Includes JWT tokens in Authorization headers
- Handles CORS and authentication errors
- Provides timeout handling

## Testing the Connection

1. Make sure both frontend and backend are running
2. Open the browser console
3. Navigate to the app - you should see API requests in the Network tab
4. Check for any CORS or connection errors

## Troubleshooting

### CORS Errors
If you see CORS errors:
- Make sure the backend `.env` has `FRONTEND_URL=http://localhost:5173`
- Restart the backend server after changing `.env`

### Connection Refused
- Verify the backend is running on the correct port
- Check that `VITE_API_URL` matches your backend URL
- Ensure no firewall is blocking the connection

### Environment Variables Not Loading
- Restart the Vite dev server after creating/editing `.env`
- Make sure variable names start with `VITE_`
- Check that `.env` is in the `frontend/job-portal` directory

## Production Deployment

For production:
1. Set `VITE_API_URL` to your production backend URL
2. Build the frontend: `npm run build`
3. The environment variables are embedded at build time

## API Endpoints

The frontend uses these API endpoints:

- `POST /api/login` - HR/Admin login
- `POST /api/signup` - HR/Admin signup
- `POST /api/candidate/login` - Candidate login
- `POST /api/candidate/signup` - Candidate signup
- `GET /api/jobs` - Get all jobs (public)
- `GET /api/jobs/all` - Get all jobs (HR only)
- `POST /api/jobs` - Create job (HR only)
- `PUT /api/jobs/:id` - Update job (HR only)
- `PATCH /api/jobs/:id/enabled` - Toggle job status (HR only)
- `GET /api/candidate/profile` - Get profile
- `POST /api/candidate/profile` - Save profile
- `POST /api/applications` - Apply to job
- `GET /api/applications` - Get applications
- `POST /api/applications/save/:jobId` - Save/unsave job
- `GET /api/applications/saved` - Get saved jobs

