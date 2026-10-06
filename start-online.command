#!/bin/zsh
# Double-click to run the project on this Mac using the CLOUD database (MongoDB Atlas, internet needed).
DIR="${0:A:h}"
echo "Starting Campus Canteen (LOCAL + Atlas cloud database)..."
lsof -ti tcp:5001 -ti tcp:5173 -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null; sleep 1
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/backend' && npm run dev\""
osascript -e "tell application \"Terminal\" to do script \"cd '$DIR/frontend' && npm run dev\""
echo "Waiting for the servers..."
for i in {1..60}; do
  curl -s http://localhost:5001/health >/dev/null && curl -s http://localhost:5173 >/dev/null && break
  sleep 1
done
open http://localhost:5173
echo "Done. App: http://localhost:5173   (keep the two server windows open)"
