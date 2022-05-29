[1]: https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/

# WHIP-WHAP-JS: WebRTC WHIP and WHAP using [Perfect Negotiation][1]

## Features
- Does *NOT* encapsulate RTCPeerConnection
- Small, simple code base
- Auto-retries WHIP/WHAP on WebRTC failure, or when iceConnectionState is "disconnected"
- Uses *Perfect Negotiation* for WHIP and WHAP as from the _Jan-Ivar Bruaroey_ article [here][1]


## WHIP
WHIP stands for WebRTC-HTTP ingestion protocol
It's an IETF draft, and you can learn more here:
https://github.com/wish-wg/webrtc-http-ingest-protocol

## WHAP
WHIP stands for WebRTC-HTTP access protocol
And this is the only place to learn about it for now.
It's similar to WHIP, but intended for receiving audio/video from WebRTC servers.
See the example below.

## LICENSE AND PULL REQUEST TERMS
- MIT license
- Not part of license, but note regarding pull requests and submissions:
- You agree any submissions or pull requests to this project are granted under the terms of the MIT open source license.


## WHIP Example

WHIP example: send camera to WHIP server.
```js

let url = '/whip'
let whipwhap = await import('https://cdn.jsdelivr.net/npm/whip-whap-js')
document.write('<video id="video1" autoplay controls muted width="1024" allowfullscreen/>')
let pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
pc.addEventListener('iceconnectionstatechange', whipwhap.handleIceStateChange)
pc.addEventListener('negotiationneeded', ev => whipwhap.handleNegotiationNeeded(ev, url))
let gum = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
pc.addTransceiver(gum.getVideoTracks()[0], { 'direction': 'sendonly' })
pc.addTransceiver(gum.getAudioTracks()[0], { 'direction': 'sendonly' })
let video1 = document.getElementById('video1')
video1.srcObject = gum
video1.play()

```

## WHAP Example

WHAP example: receive video/audio from WebRTC server to HTML video element. 
```js

let url = '/whap'
let whipwhap = await import('https://cdn.jsdelivr.net/npm/whip-whap-js')
document.write('<video id="video1" autoplay controls muted width="1024" allowfullscreen/>')
let pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
pc.addTransceiver('video', { 'direction': 'recvonly' }) // build sdp
pc.addTransceiver('audio', { 'direction': 'recvonly' }) // build sdp
pc.addEventListener('iceconnectionstatechange', whipwhap.handleIceStateChange)
pc.addEventListener('negotiationneeded', ev => whipwhap.handleNegotiationNeeded(ev, url))
let video1 = document.getElementById('video1')
pc.ontrack = ev => video1.srcObject = ev.streams[0]

```

## Location Header

Server should return a `Location` header on success, it could be used on `DELETE`

```js

let location = null

pc.addEventListener('negotiationneeded', async ev => {
    location = await whipwhap.handleNegotiationNeeded(ev, url))
}

// to stop
if (locatioin) {
    fetch(location, {method: 'DELETE'})
}

```

When used in [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), `Access-Control-Expose-Headers: Location` header is needed.

## Functions
<a name="module_whip-whap-js"></a>

## whip-whap-js
WHIP WHAP module.


* [whip-whap-js](#module_whip-whap-js)
    * [~handleNegotiationNeeded(event, url)](#module_whip-whap-js..handleNegotiationNeeded)
    * [~handleIceStateChange(event)](#module_whip-whap-js..handleIceStateChange)
    * [~helperGetRxTxRate(pc)](#module_whip-whap-js..helperGetRxTxRate)

<a name="module_whip-whap-js..handleNegotiationNeeded"></a>

### whip-whap-js~handleNegotiationNeeded(event, url)
Event handler for 'negotiationneeded' event.

**Kind**: inner method of [<code>whip-whap-js</code>](#module_whip-whap-js)  

| Param | Type |
| --- | --- |
| event | <code>Event</code> | 
| url | <code>string</code> | 


<a name="module_whip-whap-js..handleIceStateChange"></a>

### whip-whap-js~handleIceStateChange(event)
Event handler for 'iceconnectionstatechange' event.

**Kind**: inner method of [<code>whip-whap-js</code>](#module_whip-whap-js)  

| Param | Type |
| --- | --- |
| event | <code>Event</code> | 


<a name="module_whip-whap-js..helperGetRxTxRate"></a>

### whip-whap-js~helperGetRxTxRate(pc)
This is a helper function, which is not required
to make WHIP or WHAP connections.
It will return the current rx/tx bitrates
the next time a getStats() event is available.

**Kind**: inner method of [<code>whip-whap-js</code>](#module_whip-whap-js)  

| Param | Type |
| --- | --- |
| pc | <code>RTCPeerConnection</code> | 
