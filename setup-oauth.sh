#!/bin/bash

# Halo OAuth Configuration Script
# This script helps you configure Google OAuth Client ID across all files

echo "🔧 Halo MVP - Google OAuth Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

# Prompt for Google Client ID
echo ""
echo "📋 Enter your Google OAuth Client ID:"
echo "   (Get it from: https://console.cloud.google.com/apis/credentials)"
echo "   Format: xxxxx-xxxx.apps.googleusercontent.com"
echo ""
read -p "Client ID: " CLIENT_ID

if [ -z "$CLIENT_ID" ]; then
    echo "❌ No Client ID provided. Exiting."
    exit 1
fi

echo ""
echo "🔄 Updating configuration files..."

# Update .env file
if grep -q "GOOGLE_CLIENT_ID=" .env; then
    # Replace existing
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|g" .env
    else
        # Linux
        sed -i "s|GOOGLE_CLIENT_ID=.*|GOOGLE_CLIENT_ID=$CLIENT_ID|g" .env
    fi
    echo "✅ Updated .env"
else
    # Add new
    echo "GOOGLE_CLIENT_ID=$CLIENT_ID" >> .env
    echo "✅ Added to .env"
fi

# Update login.html
if [ -f public/login.html ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|data-client_id=\"[^\"]*\"|data-client_id=\"$CLIENT_ID\"|g" public/login.html
    else
        sed -i "s|data-client_id=\"[^\"]*\"|data-client_id=\"$CLIENT_ID\"|g" public/login.html
    fi
    echo "✅ Updated public/login.html"
fi

# Update signup.html
if [ -f public/signup.html ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|data-client_id=\"[^\"]*\"|data-client_id=\"$CLIENT_ID\"|g" public/signup.html
    else
        sed -i "s|data-client_id=\"[^\"]*\"|data-client_id=\"$CLIENT_ID\"|g" public/signup.html
    fi
    echo "✅ Updated public/signup.html"
fi

echo ""
echo "✨ Configuration complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your Google Cloud Console is configured:"
echo "      - Authorized JavaScript origins: http://localhost:3000"
echo "      - Authorized redirect URIs: http://localhost:3000"
echo "   2. Start the server: npm start"
echo "   3. Test at: http://localhost:3000/login.html"
echo ""
echo "📚 For detailed setup instructions, see: OAUTH_SETUP.md"
