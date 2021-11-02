

export { restartIceIfNeeded }
export { negotiate }
export { sendSignalling }
export { waitToCompleteIceGathering }
export { getRxTxRate }


/**
 * @param {Event} ev 
 * @param {string} url
 * 
 *     https://blog.mozilla.org/webrtc/perfect-negotiation-in-webrtc/
 */
async function negotiate(ev, url) {
    let pc = /** @type {RTCPeerConnection} */ (ev.target)

    console.debug('>onnegotiationneeded')

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    let ofr = await waitToCompleteIceGathering(pc, true)

    let ntry = 0
    let ans = ''
    while (ans === '') {
        try {
            ans = await sendSignalling(url, ofr)
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: ans }))
        } catch {
            ntry = ntry + 1
            const event = new CustomEvent('retry-counter', { detail: ntry })
            pc.dispatchEvent(event)
            await (new Promise(r => setTimeout(r, 2000)))
        }
    }
}

/**
 * @param {Event} event 
 */
function restartIceIfNeeded(event) {
    let pc = /** @type {RTCPeerConnection} */ (event.target)

    if (pc.iceConnectionState === "disconnected") {   //'failed' is also an option
        console.debug('*** restarting ice')
        pc.restartIce()
    }
}

/**
 * @param {RTCSessionDescription} desc The session description.
 * @param {string} url Where to do WHIP or WHAP
 * @returns {Promise<string>}
 */
async function sendSignalling(url, desc) {
    console.debug('sending N line offer:', desc.sdp.split(/\r\n|\r|\n/).length)
    let fetchopt =
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp', },
        body: desc.sdp
    }
    let resp = await fetch(url, fetchopt)
    let resptext = await resp.text()
    if (resp.status != 202) {
        throw `SFU error: ${resptext} ${resp.status}`
        // pc.close()
        // return
    }
    console.debug('got N line answer:', resptext.split(/\r\n|\r|\n/).length)
    return resptext
}

/**
 * @param {RTCPeerConnection} pc
 * @param {boolean} logPerformance
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
 * @param {RTCPeerConnection} pc
 */
async function getRxTxRate(pc) {
    let rxrate = 0
    let txrate = 0
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
        txrate
    }
}

