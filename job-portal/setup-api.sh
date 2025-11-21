#!/bin/bash

# Setup script for API configuration

echo "Setting up API configuration..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Backend API URL
# For local development, use: http://localhost:3000
# For production, use your production backend URL
VITE_API_URL=http://localhost:3000

# Optional: API timeout in milliseconds (default: 15000)
# VITE_API_TIMEOUT_MS=15000
EOF
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your backend is running on http://localhost:3000"
echo "2. Start the frontend with: npm run dev"
echo "3. The frontend will automatically connect to the backend API"
echo ""

