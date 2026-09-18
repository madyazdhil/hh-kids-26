#!/bin/bash
# Start script for Regroup Happy Hour Deck
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PORT=8765

echo "⚡ Starting Regroup Happy Hour Presentation Deck..."
echo "📍 Serving directory: $DIR/src on http://localhost:$PORT"

# Check if port is already running
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️ Port $PORT is already in use, opening browser..."
else
    # Start python server in background
    cd "$DIR/src"
    python3 -m http.server $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    sleep 1
fi

# Open in default browser
open "http://localhost:$PORT"
echo "🎉 Presentation deck opened in browser!"
