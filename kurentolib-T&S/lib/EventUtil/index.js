/**
 * Created by Administrator on 2016/2/2.
 */

var KurentoUtil = require('../KurentoUtil'),
    kurento = require('kurento-client'),
    Users = require('../Users'),
    Classes = require('../Classes');

function wsSend(ws, msg) {
    if (!msg.id) msg.id = 'event';
    ws.send(JSON.stringify(msg));
}

function EventUtil(aUser) {

    aUser.on('test', function () {
        console.log('test');
        console.log(this);
    });

    /**
     * on candidate coming
     * @param option {candidate}
     */
    aUser.on('onIceCandidate', function (option) {
        var sessionId = this.sessionId || null,
            role = this.role || null,
            candidate = option.candidate || null;

        if (sessionId && role && candidate) KurentoUtil.addToIceCandidateQueueByRole(role, sessionId, candidate);

    });

    /**
     * on candidate coming for view
     * @param option {candidate,[who]}
     */
    aUser.on('onCandidateForView', function (option) {
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
    aUser.on('present', function (option) {
        var that = this,
            ws = that.ws,
            sessionId = that.sessionId,
            wsuri = that.wsuri,
            sdpOffer = option.sdpOffer,
            role = that.role,
            wsuri = that.wsuri,
            aClass = Classes[that.classid];

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

                that.pipeline = _pipeline;
                KurentoUtil.createKurentoWebRtcEndpoint(_pipeline, function (error, webRtcEndpoint) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    that.webrtcendpont = webRtcEndpoint;

                    KurentoUtil.webRtcEndpointAddIceCandidate(that);

                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        wsSend(ws, {evName: 'presentIceCandidate', candidate: candidate});
                    });

                    KurentoUtil.endPointProcessOffer(webRtcEndpoint, sdpOffer, function (error, sdpAnswer) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        wsSend(ws, {evName: 'presentSdpAnswer', sdpAnswer: sdpAnswer});
                        KurentoUtil.notifyInClass(aClass, {evName: 'coming', who: sessionId}, role);

                        KurentoUtil.webRtcEndpointGatherCandidates(webRtcEndpoint, function (error) {
                            if (error) return console.warn('webRtcEndpoint Gather Candidates', error);
                            return;
                        });
                    });
                });

                //create recv RtcEndpoint
                KurentoUtil.createKurentoRtcEndpoint(_pipeline, function (error, recvrtpendpoint) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    that.recvrtpendpoint = recvrtpendpoint;
                });
            } else {
                KurentoUtil.createKurentoPipeline(kurentoClient, function (error, pipeline) {
                    if (error) return wsSend(ws, {evName: 'presentError', error: error});

                    //copy above codes
                    that.pipeline = pipeline;
                    KurentoUtil.createKurentoWebRtcEndpoint(pipeline, function (error, webRtcEndpoint) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        that.webrtcendpont = webRtcEndpoint;

                        KurentoUtil.webRtcEndpointAddIceCandidate(that);

                        webRtcEndpoint.on('OnIceCandidate', function (event) {
                            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                            wsSend(ws, {evName: 'presentIceCandidate', candidate: candidate});
                        });

                        KurentoUtil.endPointProcessOffer(webRtcEndpoint, sdpOffer, function (error, sdpAnswer) {
                            if (error) return wsSend(ws, {evName: 'presentError', error: error});

                            wsSend(ws, {evName: 'presentSdpAnswer', sdpAnswer: sdpAnswer});
                            //通知其他人
                            KurentoUtil.notifyInClass(aClass, {evName: 'coming', who: sessionId}, role);
                            //通知自己 接收另一位已发布视频
                            switch (role) {
                                case 'student':
                                    if (aClass && aClass.teacher && aClass.teacher.sessionId)
                                        wsSend(ws, {evName: 'coming', who: aClass.teacher.sessionId});
                                    break;
                                case 'teacher':
                                    if (aClass && aClass.student && aClass.student.sessionId)
                                        wsSend(ws, {evName: 'coming', who: aClass.student.sessionId});
                                    break;
                                case 'monitorhelper':
                                    break;
                                default :
                                    break;
                            }


                            KurentoUtil.webRtcEndpointGatherCandidates(webRtcEndpoint, function (error) {
                                if (error) return console.warn('webRtcEndpoint Gather Candidates', error);
                                return;
                            });
                        });
                    });
                    KurentoUtil.createKurentoRtcEndpoint(pipeline, function (error, recvrtpendpoint) {
                        if (error) return wsSend(ws, {evName: 'presentError', error: error});

                        that.recvrtpendpoint = recvrtpendpoint;
                    });
                });
            }
        });
    });
    /**
     * view by role
     * @param option {who} (sessionId)
     */
    aUser.on('view', function (option) {
        var that = this,
            sessionId = that.sessionId,
            ws = that.ws,
            wsuri = that.wsuri,
            sdpoffer = option.sdpOffer,
            role = that.role,
            aClass = Classes[that.classid],
            pipeline = that.pipeline,
            who = null,
            callerWebRtcEndPoint = null;
        if (option && option.who) who = Users[option.who];
        if (option && !option.who) {
            switch (role) {
                case 'teacher':
                    who = aClass.student
                    break;
                case 'student':
                    who = aClass.teacher
                    break;
                default :
                    return wsSend(ws, {evName: 'viewError', error: 'have to need param: who !'});
                    break;
            }
        }
        if (!who) return wsSend(ws, {evName: 'viewError', error: 'only ' + role + ' in class'});
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
                that.t_viewwebrtcendpoint = viewWebRtcEndpoint;
            } else if (who && who.role === 'student') {
                that.s_viewwebrtcendpoint = viewWebRtcEndpoint;
            } else {
                that.viewwebrtcendpoint = viewWebRtcEndpoint;
            }

            KurentoUtil.webRtcEndpointAddIceCandidateForView(that, who.role);

            viewWebRtcEndpoint.on('OnIceCandidate', function (event) {
                var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                wsSend(ws, {evName: 'viewIceCandidate', candidate: candidate, who: who.id});
            });

            KurentoUtil.endPointProcessOffer(viewWebRtcEndpoint, sdpoffer, function (error, sdpAnswer) {
                if (error) return wsSend(ws, {evName: 'viewError', error: error});

                if (isSameNode) {
                    //TODO  connect two
                    //TODO  send the sdpAnswer
                    KurentoUtil.connectEndpoints(callerWebRtcEndPoint, viewWebRtcEndpoint, function (error) {
                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                        wsSend(ws, {evName: 'viewSdpAnswer', sdpAnswer: sdpAnswer, caller: who.id});

                        viewWebRtcEndpoint.gatherCandidates(function (error) {
                            if (error) return wsSend(ws, {evName: 'viewError', error: error});
                        });
                    });
                } else {
                    //TODO caller create the out rtcendpoint

                    var //对方的pipeline
                        caller_pipeline = who.pipeline,
                    //对方的 输出 rtpendpoint 们
                        caller_outrtpendpoint = who.outrtpendpoint,
                    //自己的 输入 rtpendpoint
                        recvrtpendpoint = that.recvrtpendpoint;

                    KurentoUtil.createKurentoRtcEndpoint(caller_pipeline, function (error, _outrtpendpoint) {
                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                        caller_outrtpendpoint[sessionId] = _outrtpendpoint;

                        KurentoUtil.connectEndpoints(callerWebRtcEndPoint, _outrtpendpoint, function (error) {
                            if (error) return wsSend(ws, {evName: 'viewError', error: error});

                            KurentoUtil.endPointGenerateOffer(_outrtpendpoint, function (error, callerSdpOffer) {
                                if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                KurentoUtil.endPointProcessOffer(recvrtpendpoint, callerSdpOffer, function (error, calleeSdpAnswer) {
                                    if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                    KurentoUtil.endpointProcessAnswer(_outrtpendpoint, calleeSdpAnswer, function (error) {
                                        if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                        KurentoUtil.connectEndpoints(recvrtpendpoint, viewWebRtcEndpoint, function (error) {
                                            if (error) return wsSend(ws, {evName: 'viewError', error: error});

                                            wsSend(ws, {evName: 'viewSdpAnswer', sdpAnswer: sdpAnswer, caller: who.id});

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
    aUser.on('stop', function (option) {
        //TODO
    });
}

module.exports = EventUtil;