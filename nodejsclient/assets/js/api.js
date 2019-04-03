var wsURL = "wss://59cb91f751ff5.streamlock.net:9443/webrtc-session.json";
var application = "webrtc";
var wsConnection = null;
var localUser = null;
var localVideo = null;
var peerConnectionConfig = {'iceServers': []};
var localStream = null;
var peerConnections = [];
var videoBitrate = 360;
var audioBitrate = 64;
var videoFrameRate = "29.97";
var players = [];


/*
* Browser get User Media
* */
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;

/*
* Browser get User Media
* */


function openCameraAndMicrophone() {

    localVideo = document.getElementById('localVideo');

    var constraints =
        {
            video: true,
            audio: true,
        };

    if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
        newAPI = false;
    } else if (navigator.getUserMedia) {
        navigator.getUserMedia(constraints, getUserMediaSuccess, errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

/*
* GET USER MEDIA CALL THIS WITH STREAM
* */
function getUserMediaSuccess(stream) {
    console.log("getUserMediaSuccess: " + stream);
    localStream = stream;
    try {
        localVideo.srcObject = stream;
    } catch (error) {
        localVideo.src = window.URL.createObjectURL(stream);
    }
    connectWebSocket(wsURL).then(function (wsConnectionFrom) {

        listenWebSocketEvents();

        peerConnections[localUser] = new RTCPeerConnection(peerConnectionConfig);
        peerConnections[localUser].onicecandidate = localIceCandidate;

        peerConnections[localUser].addStream(localStream);
        peerConnections[localUser].createOffer(gotLocalDescription, errorHandler);


    });
}

function errorHandler(error) {
    console.log(error);
}


/*
*
* Connect Wowza WebSocket
*
* */

function connectWebSocket(url) {
    return new Promise(function (resolve, reject) {
        if (wsConnection == null) {
            console.log("NO WEBSOCKET WE GONNA GENERATE NEW ONE")
            wsConnection = new WebSocket(url);
            wsConnection.binaryType = 'arraybuffer';

            wsConnection.onopen = function () {
                console.log("WS CONNECTION OPENED");
                resolve(wsConnection);
            }
        } else {
            console.log("USING EXISTING WS");
            resolve(wsConnection);
        }
    })


}

function listenWebSocketEvents() {
    wsConnection.onmessage = function (evt) {
        console.log("Wowza Web Socket Response : " + evt.data);

        var msgJSON = JSON.parse(evt.data);

        var msgStatus = Number(msgJSON['status']);
        var msgCommand = msgJSON['command'];

        if (msgJSON.direction == "publish") {

            if (msgJSON.command == "sendOffer") {

                console.log("Send Offer Sdp Type Answer", msgJSON["sdp"]);

                peerConnections[localUser].setRemoteDescription(new RTCSessionDescription(msgJSON["sdp"]), function () {

                }, errorHandler)

                var iceCandidates = msgJSON['iceCandidates'];
                if (iceCandidates !== undefined) {
                    for (var index in iceCandidates) {
                        console.log('iceCandidates: ' + iceCandidates[index]);
                        peerConnections[localUser].addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
                    }
                }

            }

            //wsConnection.close();
            //wsConnection = null;


        } else if (msgJSON.direction == "play") {
            var remStreamName = msgJSON.streamInfo.streamName;
            var remSessionId = msgJSON.streamInfo.sessionId;

            if (msgCommand == "getOffer") {



                players[remStreamName].plSetRemoteDescription(new RTCSessionDescription(msgJSON.sdp),remSessionId);

            } else if (msgCommand == "sendResponse") {
                var iceCandidates = msgJSON['iceCandidates'];
                if (iceCandidates !== undefined) {
                    for (var index in iceCandidates) {
                        console.log(' sendResponse iceCandidates: ' + JSON.stringify(iceCandidates[index]));
                        players[remStreamName].addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
                    }
                }
            }


        }

    }
}


function gotLocalDescription(description) {

    var enhanceData = new Object();

    if (audioBitrate !== undefined)
        enhanceData.audioBitrate = Number(audioBitrate);
    if (videoBitrate !== undefined)
        enhanceData.videoBitrate = Number(videoBitrate);
    if (videoFrameRate !== undefined)
        enhanceData.videoFrameRate = Number(videoFrameRate);


    description.sdp = enhanceSDP(description.sdp, enhanceData);

    console.log('gotLocalDescription: ' + JSON.stringify({'sdp': description}));

    peerConnections[localUser].setLocalDescription(description, function () {
        let streamInfo = {applicationName: application, streamName: localUser, sessionId: "[empty]"}

        wsConnection.send('{"direction":"publish", "command":"sendOffer", "streamInfo":' + JSON.stringify(streamInfo) + ', "sdp":' + JSON.stringify(description) + ', "userData":' + JSON.stringify({}) + '}');

    }, function () {
        console.log('set description error')
    });

}

function localIceCandidate(event) {
    if (event.candidate != null) {
        console.log('localIceCandidate: ' + JSON.stringify({'ice': event.candidate}));
    }
}

function remoteIceCandidate(event) {
    if (event.candidate != null) {
        console.log('remoteIceCandidate: ' + JSON.stringify({'ice': event.candidate}));
    }
}


/*
* START PLAYING
*
* */


function startPlay(streamName) {

    players[streamName] = new Player(streamName);


    connectWebSocket(wsURL).then(function (connectWebSocketResponse) {

        listenWebSocketEvents();

        players[streamName].sendPlayOffer(streamName);

    });


}

function closeStream(videoTag){
    if(players[videoTag]) {
        players[videoTag].stop();
        delete players[videoTag];
    }
}

function Player(streamName) {

    var remoteVideo = document.getElementById(streamName);

    var remPeerConnection = new RTCPeerConnection(peerConnectionConfig);
    remPeerConnection.onicecandidate = remoteIceCandidate;
    remPeerConnection.onaddstream = gotRemoteStream;

    this.sendPlayOffer = sendPlayGetOffer;
    this.plSetRemoteDescription = plSetRemoteDescription ;
    this.addIceCandidate = addIceCandidate ;
    this.stop = stopStream;


    function stopStream(){
        remPeerConnection.close();
    }

    function addIceCandidate(candidate){
        console.log("Player#addIceCandidate--"+streamName,candidate);
        remPeerConnection.addIceCandidate(candidate);
    }


    function plSetRemoteDescription(sdp, sessionId) {
        console.log("plSetRemoteDescription", sdp);
        remPeerConnection.setRemoteDescription(sdp).then(function () {
            return remPeerConnection.createAnswer();
        })
            .then(function (remoteDescription) {
                return remPeerConnection.setLocalDescription(remoteDescription);
            })
            .then(function(){
                let streamInfo = {applicationName: application, streamName: streamName, sessionId: sessionId};
                wsConnection.send('{"direction":"play", "command":"sendResponse", "streamInfo":' + JSON.stringify(streamInfo) + ', "sdp":' + JSON.stringify(remPeerConnection.localDescription) + ', "userData":' + JSON.stringify({}) + '}');

            })
    }

    function remoteIceCandidate(event) {
        if (event.candidate != null) {
            console.log('remoteIceCandidate: ' + JSON.stringify({'ice': event.candidate}));
        }
    }

    function gotRemoteStream(event) {

        console.log('gotRemoteStream', event.stream);

        try {
            remoteVideo.srcObject = event.stream;
        } catch (error) {
            remoteVideo.src = window.URL.createObjectURL(event.stream);
        }

    }

    function sendPlayGetOffer(streamName) {

        let streamInfo = {applicationName: application, streamName: streamName, sessionId: "[empty]"};

        console.log("sendPlayGetOffer: " + JSON.stringify(streamInfo));

        wsConnection.send('{"direction":"play", "command":"getOffer", "streamInfo":' + JSON.stringify(streamInfo) + ', "userData":' + JSON.stringify({}) + '}');

    }


}
