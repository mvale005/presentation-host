@echo off
cd C:\presentation-host

set SERVER_URL=wss://remote.mvapphub.com

set ROOM_CODE=ROOM1

echo Starting host app...
node windows_host_app.js

pause