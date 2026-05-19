#!/bin/bash
set -e

echo "🔨 Starting Amigos build process..."

echo "📦 Installing root dependencies..."
npm ci

echo "🏗️  Building frontend with Vite..."
npm run build

echo "✅ Build completed successfully!"
