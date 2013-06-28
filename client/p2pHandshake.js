
//var vid1 = document.getElementById("vid1");
//var vid2 = document.getElementById("vid2");
btn1.disabled = false;
btn2.disabled = true;
btn3.disabled = true;
var pc1,pc2;
var localstream;
var sdpConstraints = {'mandatory': {
                        'OfferToReceiveAudio':true,
                        'OfferToReceiveVideo':true }};

//JSS - attach audio and video to localstream
function gotStream(stream){
  trace("Received local stream");
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(vid1, stream);
  localstream = stream;
  btn2.disabled = false;
}

//JSS - called in the 'start' button click handler
//JSS - request user media and attaches it to a stream via 'gotStream'
function start() {
  trace("Requesting local stream");
  btn1.disabled = true;
  // Call into getUserMedia via the polyfill (adapter.js).
  getUserMedia({audio:true, video:true},
                gotStream, function() {});
}

//JSS - Where all of the protocol handshaking occurs
//JSS -

function call() {
  btn2.disabled = true;
  btn3.disabled = false;
  trace("Starting call");
  videoTracks = localstream.getVideoTracks();
  audioTracks = localstream.getAudioTracks();
  if (videoTracks.length > 0)
    trace('Using Video device: ' + videoTracks[0].label);  
  if (audioTracks.length > 0)
    trace('Using Audio device: ' + audioTracks[0].label);

  //JSS - ICE configuration format as documented in http://dev.w3.org/2011/webrtc/editor/webrtc.html#event-icecandidate 
  var servers = {'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }]};;
  //JSS - server is set to null by default.  Should this be a reference to the stun server?

  pc1 = new RTCPeerConnection(servers);
  trace("Created local peer connection object pc1");
  //JSS - onicecandidate is an event handler provided by RTCPeerConnection
  pc1.onicecandidate = iceCallback1;
  pc2 = new RTCPeerConnection(servers);
  trace("Created remote peer connection object pc2");
  pc2.onicecandidate = iceCallback2;
  //JSS - onaddstream fires anytime a media stream is accepted by a remote peer
  pc2.onaddstream = gotRemoteStream;

  pc1.addStream(localstream);
  trace("Adding Local Stream to peer connection");

  //JSS - got Description1 is provided as a callback to createOffer
  pc1.createOffer(gotDescription1);
}

function gotDescription1(desc){
  pc1.setLocalDescription(desc);
  trace("Offer from pc1 \n" + desc.sdp);
  pc2.setRemoteDescription(desc);
  // Since the "remote" side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2.createAnswer(gotDescription2, null, sdpConstraints);
}

function gotDescription2(desc){
  pc2.setLocalDescription(desc);
  trace("Answer from pc2 \n" + desc.sdp);
  pc1.setRemoteDescription(desc);
}

function hangup() {
  trace("Ending call");
  pc1.close(); 
  pc2.close();
  pc1 = null;
  pc2 = null;
  btn3.disabled = true;
  btn2.disabled = false;
}

function gotRemoteStream(e){
  // Call the polyfill wrapper to attach the media stream to this element.
  attachMediaStream(vid2, e.stream);
  trace("Received remote stream");
}

function iceCallback1(event){
  if (event.candidate) {
    pc2.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Local ICE candidate: \n" + event.candidate.candidate);
  }
}
      
function iceCallback2(event){
  if (event.candidate) {
    pc1.addIceCandidate(new RTCIceCandidate(event.candidate));
    trace("Remote ICE candidate: \n " + event.candidate.candidate);
  }
}