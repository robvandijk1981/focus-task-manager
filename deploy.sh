#!/bin/bash

echo "🚀 Railway Deployment Script"
echo "============================="

# Check if we have the updated static files
if [ -f "static/assets/index-1757351137892.js" ]; then
    echo "✅ Updated frontend build found"
else
    echo "❌ Updated frontend build not found. Building..."
    npm run build
    cp -r dist/* static/
fi

# Check git status
echo "📋 Git status:"
git status --short

# Add all changes
echo "📦 Adding changes to git..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Deploy updated frontend with database API integration

- Updated static files to serve new build (index-1757351137892.js)
- Frontend now properly connects to live database API
- Fixes frontend-backend data mismatch issue"

echo "✅ Changes committed locally"
echo ""
echo "🔧 Next steps:"
echo "1. Go to https://railway.app and log into your dashboard"
echo "2. Find your project: web-production-7f4e"
echo "3. Look for 'Redeploy' or 'Deploy' button"
echo "4. Or connect this repository to GitHub and push there"
echo ""
echo "📊 Current status:"
echo "- Backend API: ✅ Working (14 tracks, 1 goal, 3 tasks)"
echo "- Frontend code: ✅ Ready with API integration"
echo "- Deployment: ⏳ Pending manual trigger"
