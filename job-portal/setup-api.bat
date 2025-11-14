@echo off
REM Setup script for API configuration (Windows)

echo Setting up API configuration...

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Backend API URL
        echo # For local development, use: http://localhost:3000
        echo # For production, use your production backend URL
        echo VITE_API_URL=http://localhost:3000
        echo.
        echo # Optional: API timeout in milliseconds (default: 15000)
        echo # VITE_API_TIMEOUT_MS=15000
    ) > .env
    echo ✓ .env file created
) else (
    echo ✓ .env file already exists
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Make sure your backend is running on http://localhost:3000
echo 2. Start the frontend with: npm run dev
echo 3. The frontend will automatically connect to the backend API
echo.

pause

