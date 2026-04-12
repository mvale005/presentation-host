/*
Windows PowerPoint Host App

Install on Windows:
  npm init -y
  npm install ws node-key-sender

Run:
  set SERVER_URL=wss://YOUR_RENDER_URL
  set ROOM_CODE=TEST
  node windows_host_app.js

Notes:
- Start PowerPoint slideshow mode first.
- Keep the slideshow window focused.
- This version auto-reconnects if the socket drops.
*/

const WebSocket = require('ws');
const keySender = require('node-key-sender');

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3000';
const ROOM_CODE = (process.env.ROOM_CODE || 'TEST').trim().toUpperCase();
const HOST_NAME = process.env.HOST_NAME || 'Windows Host';

const HEARTBEAT_MS = 30000;
const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 10000;

let socket = null;
let shouldReconnect = true;
let reconnectTimer = null;
let reconnectAttempts = 0;

function log(message) {
  console.log(message);
}

function pressKey(keyName) {
  return keySender.sendKey(keyName).catch((err) => {
    console.error(`Failed to press ${keyName}:`, err && err.message ? err.message : err);
  });
}

function sendPing() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('Sending ping from host');
    socket.send(JSON.stringify({ type: 'ping', source: 'host' }));
  }
}

function connect() {
  log(`Connecting to: ${SERVER_URL}`);
  log(`Room code: ${ROOM_CODE}`);
  log(`Host name: ${HOST_NAME}`);

  socket = new WebSocket(SERVER_URL);

  socket.on('open', () => {
    reconnectAttempts = 0;
    log('Connected to server.');

    socket.send(JSON.stringify({
      type: 'join',
      room: ROOM_CODE,
      username: HOST_NAME,
      role: 'host'
    }));

    log(`Joined room ${ROOM_CODE} as ${HOST_NAME}.`);
    log('Waiting for slide commands...');

    sendPing();
  });

  socket.on('message', (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());

      if (data.type === 'ping') {
        return;
      }

      if (data.type !== 'slide') return;

      const action = String(data.action || '').toLowerCase();
      const sender = String(data.username || 'someone');

      if (action === 'next') {
        log(`${sender} clicked Next`);
        pressKey('right');
        return;
      }

      if (action === 'previous') {
        log(`${sender} clicked Previous`);
        pressKey('left');
        return;
      }
    } catch (error) {
      console.error('Bad message:', error.message);
    }
  });

  socket.on('close', () => {
    log('Disconnected from server.');

    if (!shouldReconnect) return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.max(1, reconnectAttempts + 1),
      RECONNECT_MAX_MS
    );

    reconnectAttempts += 1;
    log(`Reconnecting in ${Math.round(delay / 1000)} seconds...`);

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
}

setInterval(sendPing, HEARTBEAT_MS);

process.on('SIGINT', () => {
  shouldReconnect = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    socket.close();
  }

  console.log('\nHost app stopped.');
  process.exit(0);
});

connect();
