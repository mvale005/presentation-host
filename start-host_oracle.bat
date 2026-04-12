@echo off
cd C:\presentation-host-oracle

set SERVER_URL=ws://163.192.207.1:3000 
set ROOM_CODE=ROOM1

echo Starting host app...
node windows_host_app.js

pause