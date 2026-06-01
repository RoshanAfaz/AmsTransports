PORT=8081 node .output/server/index.mjs > server.log 2>&1 &
SERVER_PID=$!
sleep 3
curl -s http://localhost:8081/fleet > output.html
kill $SERVER_PID
cat server.log
