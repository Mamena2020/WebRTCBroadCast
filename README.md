# WebRTCBroadCast
WebRTC One To Many Broadcast (SFU)
"stun:stun.l.google.com:19302"


- clone this repo.
- npm update

- Secure ip local
    for custom ip local (server.js host) other than localhost, set http://ip to secure on browser chrome.
    chrome://flags/#unsafely-treat-insecure-origin-as-secure

- Start server
  - node server or nodemon server

- open.
  - for broadcaster
    - http://ip:port
  - for viewers
    - http://ip:port/viewer.html

- Monitoring Status on browser
    - chrome://webrtc-internals/

- References
  - Code.
    - https://github.com/coding-with-chaim/webrtc-one-to-many
    - https://github.com/jamalag/flutter-webrtc-part2/blob/master/lib/main.dart
    - https://stackoverflow.com/questions/21233828/detecting-that-the-peers-browser-was-closed-in-a-webrtc-videochat
  
  - Videos
    - https://www.youtube.com/watch?v=QgPcswKUnXw&list=PL_YW-znSZ_dIeSBA9YiXwb-FtjOhoo-RS&index=11&ab_channel=AmirEshaq
    - https://www.youtube.com/watch?v=V9g4MYtCHkY&ab_channel=CodingWithChaim  
    - https://www.youtube.com/watch?v=GMbdEnK8h3U&t=148s&ab_channel=CodingWithChaim 
    
  - Articles
    - https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
    - https://testrtc.com/find-webrtc-active-connection/
    - https://www.kadekjayak.web.id/stun-turn-server/
    - https://testrtc.com/webrtc-api-trace/
    - https://stackoverflow.com/questions/42836729/how-to-fix-unreliable-webrtc-calling

  - Mediasoup ref ( not implemented yet ) 
    - https://mediasoup.org/
    - https://stackoverflow.com/questions/70635792/why-is-my-webrtc-peer-to-peer-application-failing-to-work-properly
  
  - Socket Stream ( not Implemented yet )
    - https://github.com/vincentdieltiens/WebSocketFileTransfer
    - https://stackoverflow.com/questions/56051454/mediastream-pipe-to-nodejs-socket-io-stream-to-google-speech-api-and-stream-back
    - https://stackoverflow.com/questions/50976084/how-do-i-stream-live-audio-from-the-browser-to-google-cloud-speech-via-socket-io/50976085#50976085
    