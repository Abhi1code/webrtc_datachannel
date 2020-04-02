'use strict';

var localConnection;
var remoteConnection;
var sendChannel;
var receiveChannel;
var pcConstraint;
var dataConstraint;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

var name = "abhim";
var otherconn = "abhi";
var conn = new WebSocket('ws://localhost:8282');
      
//----------------------------------------------------------------------------------------------
      
      conn.onopen = function(e) {
      console.log("Connection established!");
      var data = {
                   name: name,
                   meta: 'login'
            };
            conn.send(JSON.stringify(data));
      };

//----------------------------------------------------------------------------------------------

      conn.onmessage = function(e) {
      console.log(e.data);
      var data = JSON.parse(e.data);
      
      switch(data.meta){
        case 'login':
           login(data);
        break;
//----------------------------------------------------------------------------------------------
        case 'invaliduser':
           otherconn = null;
           $('#callBtn').prop('disabled', false);
           alert(data.extra+' Error!! User not exist');
        break;
//----------------------------------------------------------------------------------------------
        case 'handlecandidate':
           handleCandidate(data);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleoffer':
           handleOffer(data.offer, data.sender);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleanswer':
           handleAnswer(data.answer);
        break;
//----------------------------------------------------------------------------------------------
        case 'handleleave':
           handleLeave();
        break;
//----------------------------------------------------------------------------------------------     
        case 'error':
           error();
        break;
//----------------------------------------------------------------------------------------------
        default :
            error();
        break;

      }
      
      };

//----------------------------------------------------------------------------------------------

      conn.onclose = function(e) {
         console.log("Connection closed..");
         //$("#login_page").show();
         //$("#chat_room").hide();
         //name = "";
         //location.reload();
      };

      function login(data){
         
         if (data.status === 'true') {
          
          console.log("login success");

         } else {

          alert("oops..try a different username");
          $('#join').prop('disabled', false);
         }
      }

//----------------------------------------------------------------------------------------------

      //when we got an ice candidate from a remote user 
      function handleCandidate(candidate) { 
        //console.log("Test candidate");
        //console.log(candidate);

    //const newIceCandidate = new RTCIceCandidate(candidate);
      remoteConnection.addIceCandidate(new RTCIceCandidate({
           sdpMLineIndex: candidate.sdpMLineIndex,
           candidate: candidate.candidate,
           sdpMid: candidate.sdpMid
         })).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
      };

      //----------------------------------------------------------------------------------------------

      function send(data){
        if (otherconn) {
           data.connecteduser = otherconn;
           data.user = name;
           conn.send(JSON.stringify(data));
        }
      }

//----------------------------------------------------------------------------------------------

      //when somebody sends us an offer 
      function handleOffer(offer, name) {
      
      remoteConnection.setRemoteDescription(new RTCSessionDescription({
        sdp: offer,
        type: "offer"
      }));
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  );
      /*yourConn.setRemoteDescription(new RTCSessionDescription(offer));
  
      //create an answer to an offer 
      yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
    
      send({ 
         meta: "answer", 
         answer: answer 
      }); 
    
      }, function (error) { 
      alert("Error when creating an answer"); 
      $('#callBtn').prop('disabled', false);
       }); */
      };



function enableStartButton() {
  startButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

function createConnection() {
  dataChannelSend.placeholder = '';
  var servers = null;
  pcConstraint = null;
  dataConstraint = null;
  trace('Using SCTP based data channels');
  // For SCTP, reliable and ordered delivery is true by default.
  // Add localConnection to global scope to make it visible
  // from the browser console.
  /*window.localConnection = localConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created local peer connection object localConnection');

  sendChannel = localConnection.createDataChannel('sendDataChannel',
      dataConstraint);
  trace('Created send data channel');

  localConnection.onicecandidate = iceCallback1;
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;*/

  // Add remoteConnection to global scope to make it visible
  // from the browser console.
  window.remoteConnection = remoteConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created remote peer connection object remoteConnection');

  remoteConnection.onicecandidate = iceCallback2;
  remoteConnection.ondatachannel = receiveChannelCallback;

  /*localConnection.createOffer().then(
    gotDescription1,
    onCreateSessionDescriptionError
  );*/
  startButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function sendData() {
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data);
}

function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

function gotDescription1(desc) {
  localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  );
}

function gotDescription2(desc) {
  remoteConnection.setLocalDescription(new RTCSessionDescription(desc));
  trace('Answer from remoteConnection \n' + desc.sdp);
  send({ 
         meta: "answer", 
         answer: desc.sdp
      }); 
  //localConnection.setRemoteDescription(desc);
}

function iceCallback1(event) {
  trace('local ice callback');
  if (event.candidate) {
    remoteConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function iceCallback2(event) {
  //trace('remote ice callback');
  if (event.candidate) {
    trace('remote ice callback');
    trace(event.candidate.candidate);
    trace(event.candidate.sdpMid);
    trace(event.candidate.sdpMLineIndex);
    send({ 
                  meta: "icecandidate",
                  candidate: String(event.candidate.candidate),
                  sdpMid: String(event.candidate.sdpMid),
                  sdpMLineIndex: event.candidate.sdpMLineIndex
        }); 
    //trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  
  $("#image").attr("src","data:image/png;base64," + event.data);
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}

function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
