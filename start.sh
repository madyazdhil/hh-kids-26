#!/bin/bash
# Start script for Regroup Happy Hour Deck & Admin Control Center
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORT=8765

echo "⚡ Starting Regroup Happy Hour Presentation Deck & Admin Control..."

# Check if port is already running
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port $PORT is already in use, opening browser..."
else
    # Start python server in background using scripts/server.py
    python3 "$DIR/scripts/server.py" $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    sleep 1
fi

# Detect local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")

echo "================================================================"
echo "🖥️ MC Presentation Deck : http://localhost:$PORT"
echo "🎮 Admin Panel Laptop   : http://localhost:$PORT/admin.html"
echo "📱 Admin Panel HP Eldina: http://$LOCAL_IP:$PORT/admin.html"
echo "================================================================"

# Open Presentation in default browser
open "http://localhost:$PORT"
echo "🎉 Presentation deck opened in browser!"
