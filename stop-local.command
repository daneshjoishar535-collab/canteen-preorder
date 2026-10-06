#!/bin/zsh
# Double-click to stop the local backend (5001) and frontend (5173) servers.
lsof -ti tcp:5001 -ti tcp:5173 -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null
echo "Local servers stopped. You can close the Terminal windows."
