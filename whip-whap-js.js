
/**
 * WHIP WHAP module.
 * @module whip-whap-js
 */


export { handleIceStateChange }
export { handleNegotiationNeeded }
export { helperGetRxTxRate }


// do not export for now
// export { sendSignalling }
// export { waitToCompleteIceGathering }


/**
 * @param {Event} ev 
 * @param {string} url
 * 
 *     https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/
 */
/**
 * Event handler for 'negotiationneeded' event.
 * 
 * @function handleNegotiationNeeded
 * @param {Event} event 
 * @param {string} url 
 * @param {Headers} headers might contain 'Authorization' or 'X-deadsfu-subuuid' 
 * 
 * @example WHIP example
 * // pc.onnegotiationneeded = ev => whipwhap.handleNegotiationNeeded(ev, '/pub')
 * 
 * @example WHAP example
 * // pc.onnegotiationneeded = ev => whipwhap.handleNegotiationNeeded(ev, '/sub')
 */

async function handleNegotiationNeeded(ev, url, headers) {
    let pc = /** @type {RTCPeerConnection} */ (ev.target)

    console.debug('>onnegotiationneeded')

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    let ofr = await waitToCompleteIceGathering(pc, true)

    const t0 = performance.now()

    if (typeof headers !== 'object') { // is there a better way?
        headers = new Headers()
    }
    if (typeof subuuid === 'string' && subuuid.length == 36) {
        headers.set('X-deadsfu-subuuid', subuuid) //sfu also accepts param &subuuid=..., but this is more secure
    }
    if (typeof bearerToken === 'string' ) {
        headers.set('Authorization', `Bearer ${bearerToken}`)
    }
   


    while (true) {
        console.debug('sending N line offer:', ofr.sdp.split(/\r\n|\r|\n/).length)

        let opt = {}
        opt.method = 'POST'
        headers.set('Content-Type', 'application/sdp')
        opt.headers = headers
        opt.body = ofr.sdp
        let resp = { status: -1 }
        try { // without try/catch, a thrown except from fetch exits our 'thread'
            resp = await fetch(url, opt)
        } catch (error) {
            ;  // not needed console.log(error)
        }



        if (resp.status == 201) {
            let anssdp = await resp.text()
            console.debug('got N line answer:', anssdp.split(/\r\n|\r|\n/).length)
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: anssdp }))
            return
        }

        let numsec = (performance.now() - t0) / 1000
        let xdetail = { status: resp.status, numsec: numsec }
        const event = new CustomEvent('downtime-msg', { detail: xdetail })
        pc.dispatchEvent(event)
        await (new Promise(r => setTimeout(r, 2000)))

    }
}

/**
 * Event handler for 'iceconnectionstatechange' event.
 * 
 * @function handleIceStateChange
 * @param {Event} event 
 * 
 * @example
 * // pc.addEventListener('iceconnectionstatechange', whipwhap.handleIceStateChange)
 */
function handleIceStateChange(event) {
    let pc = /** @type {RTCPeerConnection} */ (event.target)

    console.debug('>iceconnectionstatechange', pc.iceConnectionState)

    // 12 10 21
    // I am not really sure of the ideal iceConnectionStates to trigger
    // an ice restart.
    // Prior to 12/10/21 I had ''
    // The MDN perfect negotiation example uses 'failed'
    // as of 12/10/21, I am changing from disconnected to failed as per the MDN
    // perfect negotation example:
    // states definitions: 
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState#value

    if (pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected" ||
        pc.iceConnectionState === "closed") {   //'failed' is also an option
        console.debug('*** restarting ice')
        pc.restartIce()
    }
}







/**
 * @ignore
 * Wait until ICE is complete, or 250ms has elapsed,
 * which ever comes first.
 * 
 * @param {RTCPeerConnection} pc
 * @param {boolean} logPerformance
 * @return {Promise<RTCSessionDescription>}
 */
async function waitToCompleteIceGathering(pc, logPerformance) {
    const t0 = performance.now()

    let p = new Promise(resolve => {
        setTimeout(function () {
            resolve(pc.localDescription)
        }, 250)
        pc.onicegatheringstatechange = ev => pc.iceGatheringState === 'complete' && resolve(pc.localDescription)
    })

    if (logPerformance === true) {
        await p
        console.debug('ice gather blocked for N ms:', Math.ceil(performance.now() - t0))
    }
    return p
}

/**
 * This is a helper function, which is not required
 * to make WHIP or WHAP connections.
 * It will return the current rx/tx bitrates
 * the next time a getStats() event is available.
 * 
 * @param {RTCPeerConnection} pc
 */
async function helperGetRxTxRate(pc) {
    let rxrate = 0
    let txrate = 0
    let qualityLimitation = false

    try {

        //@ts-ignore
        let ratemap = pc.ratemap
        if (typeof ratemap === 'undefined') {
            ratemap = new Map()
        }
        //@ts-ignore
        pc.ratemap = ratemap

        const results = await pc.getStats(null)

        //console.debug_(JSON.stringify(Object.fromEntries(await pc.getStats(null))))

        results.forEach(report => {
            const now = report.timestamp



            let xtraDebug = false
            if (xtraDebug) {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    console.debug('frames: Nrx', report.framesReceived, 'Ndecode', report.framesDecoded, 'Nrx-Ndecode', report.framesReceived - report.framesDecoded)
                }
            }

            //debugging notes
            // if (typeof report.bytesReceived !== 'undefined') {
            //     console.debug(report.type, report.mediaType, report.bytesReceived)
            // }
            // if (typeof report.bytesTransmitted !== 'undefined') {
            //     console.debug(report.type, report.mediaType, report.bytesTransmitted)
            // }

            // NO!: if (report.type === 'outbound-rtp' && report.kind === 'video') {
            // we don't constrain rx/tx rate to just video, we include audio also
            if (report.type === 'outbound-rtp') {
                const bytes = report.bytesSent
                if (ratemap.has(report.ssrc)) { //report.id may also be a good key
                    const bytesPrev = ratemap.get(report.ssrc).bytesPrev
                    const timestampPrev = ratemap.get(report.ssrc).timestampPrev
                    const bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev)
                    txrate += bitrate

                    if (report.qualityLimitationReason && report.qualityLimitationReason != 'none') {
                        qualityLimitation = true
                    }

                    //console.debug('tx speed', report.ssrc, report.type, report.mediaType, bitrate)
                }
                ratemap.set(report.ssrc, { bytesPrev: bytes, timestampPrev: now })
            }
            if (report.type === 'inbound-rtp') {
                const bytes = report.bytesReceived
                if (ratemap.has(report.ssrc)) { //report.id may also be a good key
                    const bytesPrev = ratemap.get(report.ssrc).bytesPrev
                    const timestampPrev = ratemap.get(report.ssrc).timestampPrev
                    const bitrate = 8 * (bytes - bytesPrev) / (now - timestampPrev)
                    rxrate += bitrate
                    //console.debug('rx speed',report.ssrc, report.type, report.mediaType, bitrate)
                }
                ratemap.set(report.ssrc, { bytesPrev: bytes, timestampPrev: now })
            }
        })

    } catch (err) {
        console.error(err)
    }
    // we have kbps
    rxrate = Math.floor(rxrate)
    txrate = Math.floor(txrate)

    return {
        rxrate,
        txrate,
        qualityLimitation
    }
}

