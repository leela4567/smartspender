#!/bin/bash
# Run ON the server as root: sudo bash deploy.sh https://github.com/YOU/smart-spender.git
set -e
APP=/opt/smart-spender
if [ -d $APP ]; then git -C $APP pull; else git clone "$1" $APP; fi
[ -f $APP/backend/.env ] || { echo "Create $APP/backend/.env first (copy .env.example)"; exit 1; }
cd $APP/frontend && npm ci && npm run build
cd $APP/backend && npm ci --omit=dev
pm2 delete smart-spender 2>/dev/null || true
pm2 start server.js --name smart-spender
pm2 startup systemd -u root --hp /root >/dev/null
pm2 save
echo "Deployed. Check: curl localhost/api/health"
