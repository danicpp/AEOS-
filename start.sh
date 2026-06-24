#!/bin/bash
# AEOS — Quick start script

set -e

echo ""
echo "⬡  AEOS — Autonomous E-Commerce Operating System"
echo "================================================="
echo ""

# Check API key
if [ ! -f "backend/.env" ]; then
  echo "📋 Creating backend/.env from example..."
  cp backend/.env.example backend/.env
  echo "⚠️  Please edit backend/.env and add your GEMINI_API_KEY"
  echo "   Then run this script again."
  exit 1
fi

if grep -q "your_api_key_here" backend/.env; then
  echo "⚠️  Please set your GEMINI_API_KEY in backend/.env"
  exit 1
fi

echo "✓ API key found"
echo ""

# Backend
echo "🔧 Installing backend dependencies..."
cd backend
py -m pip install -r requirements.txt -q
echo "✓ Backend ready"

echo ""
echo "🚀 Starting FastAPI server on http://localhost:8002 ..."
py -m uvicorn main:app --reload --port 8002 &
BACKEND_PID=$!
cd ..

sleep 2

# Frontend
echo ""
echo "🔧 Installing frontend dependencies..."
cd frontend
npm install --silent
echo "✓ Frontend ready"

echo ""
echo "🚀 Starting React app on http://localhost:3000 ..."
echo ""
echo "================================================="
echo "  Backend: http://localhost:8002"
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8002/docs"
echo "================================================="
echo ""

npm start

# Cleanup
kill $BACKEND_PID 2>/dev/null
