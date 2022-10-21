# WebRTCBroadCast
WebRTC One To Many Broadcast (SFU)
"stun:stun.l.google.com:19302"


- clone this repo.
- npm update

- secure ip local
  for custom ip local (server.js host) other than localhost, set http://ip to secure on browser chrome.
  chrome://flags/#unsafely-treat-insecure-origin-as-secure

- node server or nodemon server

- open.
  - for broadcaster
    - http://ip:port
  - for viewers
    - http://ip:port/viewer.html 