#!/bin/bash

# Blood Cell Detection Website - Start Script
echo "🩸 Starting Blood Cell Detection Website..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if model file exists
if [ ! -f "SSD_custom.pth" ]; then
    echo "❌ Model file 'SSD_custom.pth' not found in the root directory."
    echo "Please make sure the trained model file is present."
    exit 1
fi

echo "✅ All requirements met!"

# Start the application
echo "🚀 Starting application with Docker Compose..."
docker-compose up --build

echo "🎉 Application started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs" 