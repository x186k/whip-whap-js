# WHIP-WHAP-JS: WebRTC WHIP and WHAP support in a short single JS file



## WHIP
WHIP stands for WebRTC-HTTP ingestion protocol
It's an IETF draft, and you can learn more here:
https://www.ietf.org/id/draft-ietf-wish-whip-01.html

## WHAP
WHIP stands for WebRTC-HTTP access protocol
And this is the only place to learn about it for now.

## Features
- Auto-retries WHIP/WHAP on WebRTC failure, or when iceConnectionState is "disconnected"

 


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

**Example**  
```js
WHIP example
// pc.onnegotiationneeded = ev => whipwhap.handleNegotiationNeeded(ev, '/pub')
```
**Example**  
```js
WHAP example
// pc.onnegotiationneeded = ev => whipwhap.handleNegotiationNeeded(ev, '/sub')
```
<a name="module_whip-whap-js..handleIceStateChange"></a>

### whip-whap-js~handleIceStateChange(event)
Event handler for 'iceconnectionstatechange' event.

**Kind**: inner method of [<code>whip-whap-js</code>](#module_whip-whap-js)  

| Param | Type |
| --- | --- |
| event | <code>Event</code> | 

**Example**  
```js
// pc.addEventListener('iceconnectionstatechange', whipwhap.handleIceStateChange)
```
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

