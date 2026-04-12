@echo off
cd C:\presentation-host-render

set SERVER_URL=wss://presentation-remote.onrender.com
set ROOM_CODE=ROOM1

echo Starting host app...
node windows_host_app.js

pause