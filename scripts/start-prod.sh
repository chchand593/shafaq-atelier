#!/bin/bash
# Persistent server wrapper — survives parent shell reaping.
# Uses setsid + double-fork-style detachment + nohup.
cd /home/z/my-project

# Kill any stale instances first
pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "bun server.js" 2>/dev/null
pkill -9 -f "bun next dev" 2>/dev/null
sleep 2

# Start the production server in a fully detached session
# Use the standalone build (much lower memory than Turbopack dev)
setsid bash -c '
  cd /home/z/my-project/.next/standalone
  export NODE_ENV=production
  exec bun server.js
' </dev/null >/home/z/my-project/prod.log 2>&1 &

# Wait for it to be ready
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  if ss -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "Server ready at attempt $i"
    ss -tlnp 2>/dev/null | grep 3000
    exit 0
  fi
done
echo "Server failed to start"
exit 1
