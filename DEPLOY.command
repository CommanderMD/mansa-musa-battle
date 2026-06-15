#!/bin/bash
# Double-click this file to publish "Black Excellence: Multiplier Battle".
cd "$(dirname "$0")"
echo "Logging in to Cloudflare (a browser window will open — click Allow)..."
npx --yes wrangler login
echo "Deploying..."
npx --yes wrangler deploy
echo ""
echo "Done. The live URL is shown above (….workers.dev). Press any key to close."
read -n 1
