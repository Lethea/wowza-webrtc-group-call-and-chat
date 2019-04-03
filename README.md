# wowza-webrtc-group-call-and-chat
Wowza Webrtc Group Call Sample, it's n to n webrtc sample application with chat room feautures.

You can join existing room or create a new room.

Simple webrtc group chat application that using Wowza as SFU

![Room Page](https://image.prntscr.com/image/u5-KbF4HRWS1EA5_9ODcxA.png)


Wowza Streaming Engine installation
---------------------------------
Download the Wowza Streaming Engine from [WOWZA STREAMING ENGINE]

You can find webrtc installation guide on wowza docs [WOWZA WEBRTC INSTALL]


INSTALLATION
---------------------------------
```
git clone git@github.com:Lethea/wowza-webrtc-group-call-and-chat.git
```

 There is two project 
1. Nodejs Client : This includes index.html + wowza webrtc websocket connect api ( api.js )
   * Wowza Streaming Engine WEBRTC websocket api send publish / play request to the wowza streaming engine 
   * Listen wowza webrtc websocket response 
   * Connect Nodejs server for chat room operation such as login / disconnect 
   
2. Nodejs Server : This provide login to chat room, listen events, messaging
   * This is for chatroom application
   * Allows user to login to the given room
   * Allows user to public chat
   * Listen login / disconnect event

On Nodejs Server Run Following Command
```

npm install --save express

npm install --save socket.io

or basically

npm install

```

CONFIGURATION
----------------------------------
As you know, webrtc isn't allowed when the page is not safe ( https )

Please install ssl to your wowza streaming engine or proxy pass the request to the wowza webrtc websocket 

Change the Wowza Webrtc websocket url in _**nodeclientjs/assets/js/api.js**_ with your own

```
var wsURL = "wss://59cb91f751ff5.streamlock.net:9443/webrtc-session.json";
```

Change the nodejs websocket url in _**nodejsclient/index.html**_

```
var socketIoConnectionUrl = "https://10.6.1.136";
```
*By default, the nodejs application run on port 3000, 
define ssl to nodejs or proxy pass the 443 with socket.io path to 3000*

CONNECT TO CHAT ROOM
-----------------------------

```
cd nodejsserver

node videochat.js
```

Open your nodejsclient with https with browser ( chrome preferred )

````
https://your_web_server_ip/nodejsclient/index.html
````

Login Page

![Login Page](https://image.prntscr.com/image/i0Xlxv4dTZa39FT3ywhIzA.png)

* Enter your nickname  (English Characters & Numbers without space required)
* Enter your Room Name (English Characters & Numbers without space required)

![Room Page](https://image.prntscr.com/image/u5-KbF4HRWS1EA5_9ODcxA.png)

![Wowza Image](https://image.prntscr.com/image/gy_wmKXTSQWPbgQ3Y-GHbg.png)

Note
-------------
For proxy pass you can use nginx as well

Features
-------------
- [x] Login 
- [x] Dynamic Chat Room
- [x] Text Chat
- [x] Play / Publish Implementation
- [x] PeerConnection / Icecandidate etc webrtc stuff implemented
- [ ] Selecting Camera / Microphone
- [ ] Publish Stream Button ( Now starting automatically )
- [ ] Webrtc Api Implementation for local user must be changed
- [ ] External Player Link For Hls Playback
- [ ] Typo Control
- [ ] Test

Contact
------------
````
Mail : emre.karatasoglu@hotmail.com
Phone / Whatsapp / Telegram : +90 532 346 67 79
Donate :   1HxYXXDNQen9kDHjdjPrHkj1xS64fkENes ( BTC )
           Ld8BNcvP69146jgT5hVbTzSsnL7q6WoUSg ( LTC ) 
           0x77935c829b0f12b05151ec7bce31d58a97f735e8 ( ETH ) 
````






[WOWZA STREAMING ENGINE]:https://www.wowza.com/pricing/installer
[WOWZA WEBRTC INSTALL]:https://www.wowza.com/docs/how-to-use-webrtc-with-wowza-streaming-engine
