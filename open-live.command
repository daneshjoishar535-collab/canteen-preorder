#!/bin/zsh
# Double-click to open the LIVE deployed website. Wakes the free Render server first.
echo "Waking up the live API (can take up to 60 seconds on the free plan)..."
for i in {1..12}; do
  curl -s --max-time 10 https://canteen-api-v1ga.onrender.com/health | grep -q ok && { echo "API is awake."; break; }
  sleep 5
done
open https://canteen-preorder-six.vercel.app
echo "Opened https://canteen-preorder-six.vercel.app"
