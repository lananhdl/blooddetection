#!/bin/bash

# Blood Cell Detection Website - Development Start Script
echo "🩸 Starting Blood Cell Detection Website in Development Mode..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
if ! command_exists python3; then
    echo "❌ Python 3 is not installed."
    exit 1
fi

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed."
    exit 1
fi

# Check npm
if ! command_exists npm; then
    echo "❌ npm is not installed."
    exit 1
fi

# Check if model file exists
if [ ! -f "SSD_custom.pth" ]; then
    echo "❌ Model file 'SSD_custom.pth' not found in the root directory."
    exit 1
fi

echo "✅ All requirements met!"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "📥 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "🚀 Starting development servers..."

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
source ../venv/bin/activate
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "📱 Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "🎉 Development servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup processes
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup INT TERM

# Wait for processes
wait 