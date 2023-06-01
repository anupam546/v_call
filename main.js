let APP_ID = "1d4cb1ae18aa4b979771fb8e8751a286";
let token = null;
let uid = String(Math.floor(Math.random() * 100000));


let client;
let channel;

let querryString = window.location.search
let urlParams = new URLSearchParams(querryString)
let roomId = urlParams.get('room')

document.getElementById("room_Id").innerText ='Room Id: ' + roomId;



if(!roomId){
  window.location = 'lobby.html'
}


let localStream; // have local camera video and audio streams
let remoteStream; // have remote camera video and audio streams
let peerConnection; //store info btwn peer
let videoStream;
// const server = {
//   iceServers: [
//     {
//       urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
//     },
//   ],
// };

var server = {
  iceServers: [
      {
        urls: "stun:a.relay.metered.ca:80",
      },
      {
        urls: "turn:a.relay.metered.ca:80",
        username: "da00f07e0ec774c2883b5fb2",
        credential: "NHSgAgnGl/dU85Md",
      },
      {
        urls: "turn:a.relay.metered.ca:80?transport=tcp",
        username: "da00f07e0ec774c2883b5fb2",
        credential: "NHSgAgnGl/dU85Md",
      },
      {
        urls: "turn:a.relay.metered.ca:443",
        username: "da00f07e0ec774c2883b5fb2",
        credential: "NHSgAgnGl/dU85Md",
      },
      {
        urls: "turn:a.relay.metered.ca:443?transport=tcp",
        username: "da00f07e0ec774c2883b5fb2",
        credential: "NHSgAgnGl/dU85Md",
      },
  ],
};





let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel(roomId);
   await channel.join();

  channel.on('MemberJoined', handleUserJoined);
  channel.on('MemberLeft', handleUserLeft);
  
  client.on('MessageFromPeer', handleMessageFromPeer);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

const videoTracks = localStream.getVideoTracks();
if (videoTracks.length > 0) {
  const videoTrack = videoTracks[0];
  videoStream = new MediaStream([videoTrack]);
  // You now have the video stream and can use it as needed
  console.log(videoStream);
} else {
  console.log('No video tracks found in the local stream.');
}

  document.getElementById("user-1").srcObject = videoStream;
};

let handleUserLeft = (MemberId) => {
  document.getElementById('user-2').style.display = "none";
}

let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text)
  console.log('Message :', message);
   
  if(message.type === 'offer'){
    createAnswer(MemberId, message.offer)
  }
  if(message.type === 'answer'){
    addAnswer(message.answer)
  }  
  if(message.type === 'candidate'){
   if(peerConnection){
    peerConnection.addIceCandidate(message.candidate);
   }
  }
}

let handleUserJoined = async (MemberId) => { 
  
  user.textContent="user-2 has joined";
  console.log("A New Member has joined", MemberId);
  createOffer(MemberId);
};

let createPeerConnection = async (MemberId) =>{
  peerConnection = new RTCPeerConnection(server);
  remoteStream = new MediaStream();
  document.getElementById('user-2').srcObject = remoteStream;
  document.getElementById('user-2').style.display='inline';
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    document.getElementById("user-1").srcObject = videoStream;
  }
   
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      client.sendMessageToPeer({text:JSON.stringify({'type':'candidate','candidate':event.candidate})},MemberId) 
    }
  }
}


let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId)
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer({text:JSON.stringify({'type':'offer','offer':offer})},MemberId)

};

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId)
  await peerConnection.setRemoteDescription(offer)
  let answer = await peerConnection.createAnswer()
  await peerConnection.setLocalDescription(answer)
  client.sendMessageToPeer({text:JSON.stringify({'type':'answer','answer':answer})},MemberId)


}

let addAnswer = async (answer) => {
  if(!peerConnection.currentRemoteDescription){
      peerConnection.setRemoteDescription(answer)
  }
}
 
let leaveChannel = async () => {
  await channel.leave();
  await client.logout();
}

window.addEventListener('beforeunload', leaveChannel)

init();
