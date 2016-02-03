/**
 * Created by Administrator on 2016/2/2.
 */

var EventEmitter = require('events').EventEmitter,
    KurentoUtil = require('../KurentoUtil'),
    Users = require('../Users'),
    Classes = require('../Classes');

function wsSend(ws, msg) {
    if (!msg.id) msg.id = 'event';
    ws.send(JSON.stringify(msg));
}

function EventUtil() {

    this.on('test', function () {
        console.log('test');
        console.log(this);
    });

    /**
     * on candidate coming
     * @param option {candidate}
     */
    this.on('onCandidate', function (option) {
        var sessionId = this.sessionId || null,
            role = this.role || null,
            candidate = option.candidate || null;

        if (sessionId && role && candidate) KurentoUtil.addToIceCandidateQueueByRole(role, sessionId, candidate);

    });

    /**
     * on candidate coming for view
     * @param option {candidate,[who]}
     */
    this.on('onCandidateForView', function (option) {
        var sessionId = this.sessionId || null,
            role = this.role || null,
            candidate = option.candidate || null,
            who = option.who;

        if (sessionId && role && candidate) KurentoUtil.addToIceCandidateQueueByRole(role, sessionId, candidate, who);

    });

    /**
     * present self video
     * return
     *          {evName: 'presentError', error: error}
     *          {evName: 'presentSdpAnswer', sdpAnswer: sdpAnswer}
     */
    this.on('present', function (option) {
        var ws = this.ws,
            sessionId = this.sessionId,
            wsuri = this.wsuri,
            sdpOffer = option.sdpOffer,
            aUser = Users[sessionId],
            role = aUser.role,
            wsuri = aUser.wsuri,
            aClass = Classes[aUser.classid];

        //TODO clear the candidate queue
        //TODO create a kurento client
        //TODO create a kurento pipeline
        //TODO create a kurento webrtcendpoint
        //TODO add ice candidates
        //TODO webrtcendpoint process sdpoffer
        //TODO send sdpAnswer

        KurentoUtil.clearIceCandidateByRole(role, sessionId);

        KurentoUtil.createKurentoClient(wsuri, function (error, kurentoClient) {
            if (error) return wsSend(ws, {evName: 'presentError', error: error});


            var _pipeline;
            if (aClass) {
                if (role !== 'teacher' && aClass['teacher'] && aClass['teacher'].wsuri && aClass['teacher'].wsuri === wsuri) _pipeline = aClass['teacher'].pipeline;
                if (role !== 'student' && aClass['student'] && aClass['student'].wsuri && aClass['student'].wsuri === wsuri) _pipeline = aClass['student'].pipeline;
            }

            if (_pipeline) {

                aUser.pipeline = _pipeline;
                KurentoUtil.createKurentoWebRtcEndpoint(pipeline, function (error, webRtcEndpoint) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    aUser.webrtcendpont = webRtcEndpoint;

                    KurentoUtil.webRtcEndpointAddIceCandidate(aUser);

                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        wsSend(ws, {evName: 'iceCandidate', candidate: candidate});
                    });

                    KurentoUtil.endPointProcessOffer(webRtcEndpoint, sdpOffer, function (error, sdpAnswer) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        wsSend(ws, {evName: 'presentSdpAnswer', sdpAnswer: sdpAnswer});

                        KurentoUtil.webRtcEndpointGatherCandidates(webRtcEndpoint, function (error) {
                            if (error) return console.warn('webRtcEndpoint Gather Candidates', error);
                            return;
                        });
                    });
                });
            } else {
                KurentoUtil.createKurentoPipeline(kurentoClient, function (error, pipeline) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    //copy above codes
                    aUser.pipeline = _pipeline;
                    KurentoUtil.createKurentoWebRtcEndpoint(pipeline, function (error, webRtcEndpoint) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        aUser.webrtcendpont = webRtcEndpoint;

                        KurentoUtil.webRtcEndpointAddIceCandidate(aUser);

                        webRtcEndpoint.on('OnIceCandidate', function (event) {
                            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                            wsSend(ws, {evName: 'iceCandidate', candidate: candidate});
                        });

                        KurentoUtil.endPointProcessOffer(webRtcEndpoint, sdpOffer, function (error, sdpAnswer) {
                            if (error) return wsSend(ws, {evName: 'presentError', error: error});

                            wsSend(ws, {evName: 'presentSdpAnswer', sdpAnswer: sdpAnswer});

                            KurentoUtil.webRtcEndpointGatherCandidates(webRtcEndpoint, function (error) {
                                if (error) return console.warn('webRtcEndpoint Gather Candidates', error);
                                return;
                            });
                        });
                    });
                });
            }
        });
    });

    /**
     * view by role
     * @param option {who} (sessionId)
     */
    this.on('view', function (option) {
        var sessionId = this.sessionId,
            ws = this.ws,
            wsuri = this.wsuri,
            role = this.role,
            aClass = Classes[this.classid],
            who = null;
        if (option && option.who) who = Users[option.who];

        //judge node
        var isSameNode = false;
        if (wsuri === who.wsuri) {
            isSameNode = true;
        }

        if (isSameNode) {

        } else {

        }


    });

}

EventUtil.prototype = new EventEmitter();

module.exports = EventUtil;