/**
 * Created by Administrator on 2016/2/2.
 */

var EventEmitter = require('events').EventEmitter,
    KurentoUtil = require('../KurentoUtil'),
    kurento = require('kurento-client'),
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
    this.on('onIceCandidate', function (option) {
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

        if (sessionId && role && candidate) KurentoUtil.addToIceCandidateQueueByRoleForView(role, sessionId, candidate, who);

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
            role = this.role,
            wsuri = this.wsuri,
            aClass = Classes[this.classid];

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

                this.pipeline = _pipeline;
                KurentoUtil.createKurentoWebRtcEndpoint(_pipeline, function (error, webRtcEndpoint) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    this.webrtcendpont = webRtcEndpoint;

                    KurentoUtil.webRtcEndpointAddIceCandidate(this);

                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        wsSend(ws, {evName: 'presentIceCandidate', candidate: candidate});
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

                //create recv RtcEndpoint
                KurentoUtil.createKurentoRtcEndpoint(_pipeline, function (error, recvrtpendpoint) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    this.recvrtpendpoint = recvrtpendpoint;
                });
            } else {
                KurentoUtil.createKurentoPipeline(kurentoClient, function (error, pipeline) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    //copy above codes
                    this.pipeline = pipeline;
                    KurentoUtil.createKurentoWebRtcEndpoint(pipeline, function (error, webRtcEndpoint) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        this.webrtcendpont = webRtcEndpoint;

                        KurentoUtil.webRtcEndpointAddIceCandidate(this);

                        webRtcEndpoint.on('OnIceCandidate', function (event) {
                            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                            wsSend(ws, {evName: 'presentIceCandidate', candidate: candidate});
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
                    KurentoUtil.createKurentoRtcEndpoint(pipeline, function (error, recvrtpendpoint) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        this.recvrtpendpoint = recvrtpendpoint;
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
            sdpoffer = option.sdpOffer,
            role = this.role,
            aClass = Classes[this.classid],
            pipeline = this.pipeline,
            who = null,
            callerWebRtcEndPoint = null;
        if (option && option.who) who = Users[option.who];
        if (option && !option.who) (role === 'teacher') ? who = aClass.student : who = aClass.teacher;
        callerWebRtcEndPoint = who.webrtcendpont;

        //judge node
        var isSameNode = false;
        if (wsuri === who.wsuri) {
            isSameNode = true;
        }

        //TODO  clear candidate
        KurentoUtil.clearIceCandidateByRoleForView(role, sessionId, who.role);

        //TODO  create a webRtcEndpoint
        //TODO  add ice candidate
        KurentoUtil.createKurentoWebRtcEndpoint(pipeline, function (error, viewWebRtcEndpoint) {
            if (error) return wsSend(ws, {evName: 'viewError', error: error});

            if (who && who.role === 'teacher') {
                this.t_viewwebrtcendpoint = viewWebRtcEndpoint;
            } else if (who && who.role === 'student') {
                this.s_viewwebrtcendpoint = viewWebRtcEndpoint;
            } else {
                this.viewwebrtcendpoint = viewWebRtcEndpoint;
            }

            KurentoUtil.webRtcEndpointAddIceCandidateForView(this, who.role);

            viewWebRtcEndpoint.on('OnIceCandidate', function (event) {
                var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                wsSend(ws, {evName: 'viewIceCandidate', candidate: candidate, who: who.id});
            });

            KurentoUtil.endPointProcessOffer(viewWebRtcEndpoint, sdpoffer, function (error, sdpAnswer) {
                if (error) return wsSend(ws, {evName: 'viewError', error: error});

                wsSend(ws, {evName: 'viewSdpAnswer', sdpAnswer: sdpAnswer, caller: who.id});

                if (isSameNode) {
                    //TODO  connect two
                    //TODO  send the sdpAnswer
                    callerWebRtcEndPoint.connect(viewWebRtcEndpoint, function (error) {
                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                        viewWebRtcEndpoint.gatherCandidates(function (error) {
                            if (error) return wsSend(ws, {evName: 'viewError', error: error});
                        });
                    });
                } else {
                    //TODO caller create the out rtcendpoint
                    var caller_pipeline = who.pipeline,
                        caller_outrtpendpoint = who.outrtpendpoint,
                        recvrtpendpoint = this.recvrtpendpoint;

                    KurentoUtil.createKurentoRtcEndpoint(caller_outrtpendpoint, function (error, _outrtpendpoint) {
                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                        caller_outrtpendpoint[sessionId] = _outrtpendpoint;

                        KurentoUtil.connectEndpoints(callerWebRtcEndPoint, caller_outrtpendpoint, function (error) {
                            if (error) return wsSend(ws, {evName: 'viewError', error: error});

                            KurentoUtil.endPointGenerateOffer(_outrtpendpoint, function (error, callerSdpOffer) {
                                if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                KurentoUtil.endPointProcessOffer(recvrtpendpoint, callerSdpOffer, function (error, calleeSdpAnswer) {
                                    if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                    KurentoUtil.endpointPrecessAnswer(_outrtpendpoint, calleeSdpAnswer, function (error) {
                                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                        KurentoUtil.connectEndpoints(recvrtpendpoint, viewWebRtcEndpoint, function (error) {
                                            if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                            viewWebRtcEndpoint.gatherCandidates(function (error) {
                                                if (error) return wsSend(ws, {evName: 'viewError', error: error});
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                }
            });
        });
    });

    /**
     *
     * @param option
     */
    this.on('stop', function (option) {
        //TODO
    });
}

EventUtil.prototype = new EventEmitter();

module.exports = EventUtil;