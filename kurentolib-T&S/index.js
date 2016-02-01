/**
 * Created by Administrator on 2016/1/19.
 * changed by gyc on 2016/1/29
 */
var kurento = require('kurento-client');
var User = require('./lib/User');
var config = require('./config');


/*
 * Definition of global variables.
 */
var candidatesQueue = {};
var viewCandidatesQueue = {};
var monitorCandidatesQueue = {};
var kurentoClient = {};
var classes = {
    _default: {
        users: {},
        monitors: {}
    }
};
var users = {};
var monitors = {};
var noPresenterMessage = 'No active presenter. Try again later...';


/*
 * Definition of functions
 */

// Recover kurentoClient for the first time.
function getKurentoClient(wsuri, callback) {
    var _wsuri = wsuri || config.DEFAULT_WSURI;
    if (kurentoClient[_wsuri]) {
        return callback(null, kurentoClient[_wsuri]);
    }

    kurento(_wsuri, function (error, _kurentoClient) {
        if (error) {
            console.log("Could not find media server at address " + argv.ws_uri);
            return callback("Could not find media server at address" + argv.ws_uri
                + ". Exiting with error " + error);
        }

        kurentoClient[wsuri] = _kurentoClient;
        callback(null, kurentoClient[_wsuri]);
    });
}

function startPresenter(sessionId, ws, option, callback) {
    clearCandidatesQueue(sessionId);

    var _option = {
        sessionId: sessionId,
        ws: ws
    };
    if (option.wsuri) {
        _option['wsuri'] = option.wsuri;
    }
    if (option.role) {
        _option['role'] = option.role;
    }
    //创建用户
    var user = new User(_option);
    users[sessionId] = null;
    users[sessionId] = user;

    //判断节点
    if (classes._default.users !== {}) {
        var isSamePipeline = false;
        for (var key in classes._default.users) {
            if (classes._default.users[key].wsuri === user.wsuri) {
                isSamePipeline = true;
                user.pipeline = classes._default.users[key].pipeline;
            }
        }

        if (isSamePipeline) {
            user.pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                user.webrtcendpont = webRtcEndpoint;

                if (candidatesQueue[sessionId]) {
                    while (candidatesQueue[sessionId].length) {
                        var candidate = candidatesQueue[sessionId].shift();
                        webRtcEndpoint.addIceCandidate(candidate);
                    }
                }

                webRtcEndpoint.on('OnIceCandidate', function (event) {
                    var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate
                    }));
                });

                webRtcEndpoint.processOffer(option.sdpOffer, function (error, sdpAnswer) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    //TODO change '_default' class
                    classes._default.users[sessionId] = user;

                    notifyOthers(user.classid, sessionId);
                    callback(null, sdpAnswer);
                });

                webRtcEndpoint.gatherCandidates(function (error) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }
                });
            });
        } else {
            getKurentoClient(user.wsuri, function (error, kurentoClient) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                kurentoClient.create('MediaPipeline', function (error, pipeline) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    user.pipeline = pipeline;
                    pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }

                        user.webrtcendpont = webRtcEndpoint;

                        if (candidatesQueue[sessionId]) {
                            while (candidatesQueue[sessionId].length) {
                                var candidate = candidatesQueue[sessionId].shift();
                                webRtcEndpoint.addIceCandidate(candidate);
                            }
                        }

                        webRtcEndpoint.on('OnIceCandidate', function (event) {
                            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                            ws.send(JSON.stringify({
                                id: 'iceCandidate',
                                candidate: candidate
                            }));
                        });

                        webRtcEndpoint.processOffer(option.sdpOffer, function (error, sdpAnswer) {
                            if (error) {
                                stop(sessionId);
                                return callback(error);
                            }

                            //TODO change '_default' class
                            classes._default.users[sessionId] = user;

                            notifyOthers(user.classid, sessionId);
                            callback(null, sdpAnswer);
                        });

                        webRtcEndpoint.gatherCandidates(function (error) {
                            if (error) {
                                stop(sessionId);
                                return callback(error);
                            }
                        });
                    });
                });
            });
        }
    } else {
        getKurentoClient(user.wsuri, function (error, kurentoClient) {
            if (error) {
                stop(sessionId);
                return callback(error);
            }

            kurentoClient.create('MediaPipeline', function (error, pipeline) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }

                user.pipeline = pipeline;
                pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                    if (error) {
                        stop(sessionId);
                        return callback(error);
                    }

                    user.webrtcendpont = webRtcEndpoint;

                    if (candidatesQueue[sessionId]) {
                        while (candidatesQueue[sessionId].length) {
                            var candidate = candidatesQueue[sessionId].shift();
                            webRtcEndpoint.addIceCandidate(candidate);
                        }
                    }

                    webRtcEndpoint.on('OnIceCandidate', function (event) {
                        var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                        ws.send(JSON.stringify({
                            id: 'iceCandidate',
                            candidate: candidate
                        }));
                    });

                    webRtcEndpoint.processOffer(option.sdpOffer, function (error, sdpAnswer) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }

                        //TODO change '_default' class
                        classes._default.users[sessionId] = user;

                        notifyOthers(user.classid, sessionId)
                        callback(null, sdpAnswer);
                    });

                    webRtcEndpoint.gatherCandidates(function (error) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                    });
                });
            });
        });
    }
}

function startViewer(sessionId, ws, option, callback) {


    var callee = option.callee,
        sdpOffer = option.sdpOffer;
    var sessionAndCallee = sessionId + '/' + callee;
    clearViewCandidatesQueue(sessionAndCallee);

    users[sessionId].pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
        if (error) {
            stop(sessionId);
            return callback(error);
        }
        users[sessionId].view[callee] = {
            webRtcEndpoint: webRtcEndpoint
        }

        if (users[sessionId] === null) {
            stop(sessionId);
            return callback(noPresenterMessage);
        }
        if (viewCandidatesQueue[sessionAndCallee]) {
            while (viewCandidatesQueue[sessionAndCallee].length) {
                var candidate = viewCandidatesQueue[sessionAndCallee].shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

        webRtcEndpoint.on('OnIceCandidate', function (event) {
            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            ws.send(JSON.stringify({
                id: 'viewIceCandidate',
                candidate: candidate,
                who: callee
            }));
        });

        webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                if (error) {
                    stop(sessionId);
                    return callback(error);
                }
                if (users[sessionId] === null) {
                    stop(sessionId);
                    return callback(noPresenterMessage);
                }

                //判断节点
                if (users[sessionId].wsuri === users[callee].wsuri) {

                    users[callee].webrtcendpont.connect(webRtcEndpoint, function (error) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                        if (users[sessionId] === null) {
                            stop(sessionId);
                            return callback(noPresenterMessage);
                        }

                        callback(null, callee, sdpAnswer);
                        webRtcEndpoint.gatherCandidates(function (error) {
                            if (error) {
                                stop(sessionId);
                                return callback(error);
                            }
                        });
                    });

                } else {
                    //俩个作为桥接的rtcendpoint
                    users[sessionId].view[callee]['calleertcendpoint'] = null;
                    users[sessionId].view[callee]['rtcendpoint'] = null;

                    //创建 callee 的rtcendpoint
                    users[callee].pipeline.create('RtpEndpoint', function (error, calleeRtpEndpoint) {
                        if (error) {
                            stop(sessionId);
                            return callback(error);
                        }
                        if (users[sessionId] === null) {
                            stop(sessionId);
                            return callback(noPresenterMessage);
                        }

                        users[sessionId].view[callee]['calleertcendpoint'] = calleeRtpEndpoint;

                        //callee 的 webrtcendpoint 连接 calleeRtpEndpoint
                        users[callee].webrtcendpont.connect(calleeRtpEndpoint, function (error) {
                            if (error) {
                                stop(sessionId);
                                return callback(error);
                            }
                            if (users[sessionId] === null) {
                                stop(sessionId);
                                return callback(noPresenterMessage);
                            }

                            //calleeRtpEndpoint 创建 sdp 信息
                            calleeRtpEndpoint.generateOffer(function (error, calleeRtpEndpointSDPOffer) {
                                if (error) {
                                    return callback(error);
                                }
                                if (users[sessionId] === null) {
                                    stop(sessionId);
                                    return callback(noPresenterMessage);
                                }

                                //创建 user 的 rtcendpoint
                                users[sessionId].pipeline.create('RtpEndpoint', function (error, RtpEndpoint) {
                                    if (error) {
                                        return callback(error);
                                    }
                                    if (users[sessionId] === null) {
                                        stop(sessionId);
                                        return callback(noPresenterMessage);
                                    }

                                    users[sessionId].view[callee]['rtcendpoint'] = RtpEndpoint;

                                    //RtpEndpoint 返回 sdp
                                    RtpEndpoint.processOffer(calleeRtpEndpointSDPOffer, function (error, RtpEndpointSDPAnswer) {
                                        if (error) {
                                            return callback(error);
                                        }
                                        if (users[sessionId] === null) {
                                            stop(sessionId);
                                            return callback(noPresenterMessage);
                                        }

                                        //calleeRtpEndpoint 接受返回的 SDP
                                        calleeRtpEndpoint.processAnswer(RtpEndpointSDPAnswer, function (error, sdpupdate) {
                                            if (error) {
                                                return callback(error);
                                            }
                                            if (users[sessionId] === null) {
                                                stop(sessionId);
                                                return callback(noPresenterMessage);
                                            }

                                            //RtpEndpoint 连接 已经创建好的 webRtcEndpoint
                                            RtpEndpoint.connect(webRtcEndpoint, function (error) {
                                                if (error) {
                                                    return callback(error);
                                                }
                                                if (users[sessionId] === null) {
                                                    stop(sessionId);
                                                    return callback(noPresenterMessage);
                                                }

                                                callback(null, callee, sdpAnswer);
                                                webRtcEndpoint.gatherCandidates(function (error) {
                                                    if (error) {
                                                        stop(sessionId);
                                                        return callback(error);
                                                    }
                                                });

                                            });

                                        });

                                    });

                                });

                            });

                        });

                    });
                }
            }
        )
        ;
    });

}

function clearCandidatesQueue(sessionId) {
    if (candidatesQueue[sessionId]) {
        delete candidatesQueue[sessionId];
    }
}

function clearMonitorCandidatesQueue(sessionId) {
    if (monitorCandidatesQueue[sessionId]) {
        delete monitorCandidatesQueue[sessionId];
    }
}

function clearViewCandidatesQueue(sessionId) {
    if (viewCandidatesQueue[sessionId]) {
        delete viewCandidatesQueue[sessionId];
    }
}

function stop(sessionId) {
    if (users[sessionId]) {
        if (users[sessionId].view) {
            var viewers = users[sessionId].view;
            for (var i in viewers) {
                if (users[i]) {
                    try {
                        users[i].ws.send(JSON.stringify({
                            id: 'leaveView',
                            callee: sessionId
                        }));
                    } catch (e) {
                        console.log(e);
                    }
                    //销毁 其他人 的桥接
                    if (users[i].view[sessionId]) {
                        var viewer = users[i].view[sessionId];
                        if (viewer.webRtcEndpoint) {
                            viewer.webRtcEndpoint.release();
                            delete viewer.webRtcEndpoint;
                        }
                        if (viewer.calleertcendpoint) {
                            viewer.calleertcendpoint.release();
                            delete viewer.calleertcendpoint;
                        }
                        if (viewer.rtcendpoint) {
                            viewer.rtcendpoint.release();
                            delete viewer.rtcendpoint;
                        }
                        delete users[i].view[sessionId];
                    }
                    //销毁 自己 的桥接
                    if (users[sessionId].view[i]) {
                        var myviewer = users[sessionId].view[i];

                        if (myviewer.webRtcEndpoint) {
                            myviewer.webRtcEndpoint.release();
                            delete myviewer.webRtcEndpoint;
                        }
                        if (myviewer.calleertcendpoint) {
                            myviewer.calleertcendpoint.release();
                            delete myviewer.calleertcendpoint;
                        }
                        if (myviewer.rtcendpoint) {
                            myviewer.rtcendpoint.release();
                            delete myviewer.rtcendpoint;
                        }

                    }
                }
            }
        }

        //销毁监控
        if (users[sessionId].classid && classes[users[sessionId].classid] && classes[users[sessionId].classid].monitors) {
            var monitorsofclass = classes[users[sessionId].classid].monitors;

            for (var monitorSessionId in monitorsofclass) {
                var monitor = monitorsofclass[monitorSessionId];
                for (var callee in monitor.view) {
                    if (callee === sessionId) {
                        if (monitor.view[callee].webrtcendpont) {
                            monitor.view[callee].webrtcendpont.release();
                        }
                        if (monitor.view[callee].calleeRtpEndpoint) {
                            monitor.view[callee].calleeRtpEndpoint.release();
                        }
                        if (monitor.view[callee].RtpEndpoint) {
                            monitor.view[callee].RtpEndpoint.release();
                        }

                        delete monitor.view[callee];
                        monitor.ws.send(JSON.stringify({
                            id: 'leaveView',
                            who: callee
                        }));
                        break;
                    }
                }
            }
        }

        users[sessionId].webrtcendpont.getMediaPipeline(function (error, pipeline) {
            users[sessionId].webrtcendpont.release();

            pipeline.getChilds(function (error, results) {
                if (results && results.length === 0) {
                    pipeline.release();
                }
                if (users[sessionId] && users[sessionId].classid) {
                    delete classes[users[sessionId].classid].users[sessionId];
                }
                delete users[sessionId];

            });

        });

    }
    //清空候选
    clearCandidatesQueue(sessionId);
    //清空 他人 的候选
    for (var i in viewCandidatesQueue) {
        if (i.split('/')[0] === sessionId) {
            clearViewCandidatesQueue(i);
        }
    }
    //清空监控候选
    for (var k in monitorCandidatesQueue) {
        if (k.split('/')[1] === sessionId) {
            clearMonitorCandidatesQueue(k);
        }
    }

}

function onIceCandidate(sessionId, _candidate) {
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

    if (users[sessionId] && users[sessionId].webRtcEndpoint) {
        console.info('Sending presenter candidate');
        users[sessionId].webRtcEndpoint.addIceCandidate(candidate);
    } else {
        //console.info('Queueing candidate');
        if (!candidatesQueue[sessionId]) {
            candidatesQueue[sessionId] = [];
        }
        candidatesQueue[sessionId].push(candidate);
    }
}

function OnViewIceCandidate(sessionId, callee, _candidate) {
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

    if (users[sessionId].view[callee] && users[sessionId].view[callee].webRtcEndpoint) {
        users[sessionId].view[callee].webRtcEndpoint.addIceCandidate(candidate);
    } else {
        var sesssionIdAndCallee = sessionId + '/' + callee;
        //console.info('Queueing View candidate');
        if (!viewCandidatesQueue[sesssionIdAndCallee]) {
            viewCandidatesQueue[sesssionIdAndCallee] = [];
        }
        viewCandidatesQueue[sesssionIdAndCallee].push(candidate);
    }

}

function getPresnters(sessionId, ws) {
    if (users[sessionId]) {
        var classid = users[sessionId].classid,
            aclass = classes[classid],
            usersofaclass = aclass.users,
            addviewlist = [];

        for (var _sessionId in usersofaclass) {
            if (_sessionId !== sessionId) {
                addviewlist.push(_sessionId);
            }
        }
        ws.send(JSON.stringify({
            id: 'pushViewList',
            addviewlist: addviewlist
        }));
    }
}

function notifyOthers(classid, sessionId) {
    if (classes[classid]) {
        var usersofaclass = classes[classid].users;
        var monitorofaclass = classes[classid].monitors;

        for (var user in usersofaclass) {
            if (user !== sessionId) {
                try {
                    usersofaclass[user].ws.send(JSON.stringify({
                        id: 'comingCallee',
                        callee: sessionId
                    }));
                } catch (e) {
                    console.log(e);
                }
                try {
                    usersofaclass[sessionId].ws.send(JSON.stringify({
                        id: 'comingCallee',
                        callee: user
                    }));
                } catch (e) {
                    console.log(e);
                }
            }
        }

        for (var monitorSeesionId in monitorofaclass) {
            var monitor = monitorofaclass[monitorSeesionId];
            monitor.ws.send(JSON.stringify({
                id: 'comingCallee',
                who: sessionId
            }));
        }
    }
}

function monitorLogin(sessionId, option, ws) {
    var userlist = [];

    if (classes[option.classid]) {

        //TODO monitor获取student的wsuri,
        var stuwsuri = null;
        for (var user in classes[option.classid].users) {
            if (classes[option.classid].users[user].role === 'student') {
                stuwsuri = classes[option.classid].users[user].wsuri;
                break;
            }
        }


        var _option = {
                sessionId: sessionId,
                classid: option.classid,
                ws: ws,
                role: 'monitor',
                wsuri: stuwsuri
            },
            monitor = new User(_option);

        monitors[sessionId] = monitor;
        classes[option.classid].monitors[sessionId] = null;
        classes[option.classid].monitors[sessionId] = monitor;

        for (var i in classes[option.classid].users) {
            userlist.push(i);
        }

    }

    ws.send(JSON.stringify({
        id: 'monitorLoginResponse',
        userlist: userlist
    }));
}

function monitorOffer(sessionId, ws, callee, sdpoffer) {
    if (monitors[sessionId] && users[callee]) {
        var monitor = monitors[sessionId],
            user = users[callee];
        var sesssionIdAndCallee = sessionId + '/' + callee;
        clearMonitorCandidatesQueue(sesssionIdAndCallee);
        //TODO 不同节点、存在pipeline
        //TODO 不同节点、不存在pipeline
        //TODO 同一个节点、存在pipeline

        if (monitor.wsuri === user.wsuri) {
            monitor.pipeline = user.pipeline;
            user.pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    console.log(error);
                    webRtcEndpoint.release();
                    return;
                }

                monitor.view[callee] = {};
                monitor.view[callee].webRtcEndpoint = webRtcEndpoint;


                while (monitorCandidatesQueue[sesssionIdAndCallee] && monitorCandidatesQueue[sesssionIdAndCallee].length > 0) {
                    webRtcEndpoint.addIceCandidate(monitorCandidatesQueue[sesssionIdAndCallee].shift());
                }

                webRtcEndpoint.on('OnIceCandidate', function (event) {
                    var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate,
                        who: callee
                    }));
                });

                webRtcEndpoint.processOffer(sdpoffer, function (error, sdpAnswer) {
                    if (error) {
                        console.log(error);
                        webRtcEndpoint.release();
                        return;
                    }

                    user.webrtcendpont.connect(webRtcEndpoint, function (error) {
                        if (error) {
                            console.log(error);
                            webRtcEndpoint.release();
                            return;
                        }

                        webRtcEndpoint.gatherCandidates(function (error) {
                            if (error) {
                                console.log(error);
                                return;
                            }
                        });

                        ws.send(JSON.stringify({
                            id: 'monitorResponse',
                            response: 'accepted',
                            who: callee,
                            sdpAnswer: sdpAnswer
                        }));

                    });

                });

            });
        } else if (monitor.pipeline && monitor.wsuri !== user.wsuri) {
            monitor.pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                if (error) {
                    console.log(error);
                    webRtcEndpoint.release();
                    return;
                }

                monitor.view[callee] = {};
                monitor.view[callee].webRtcEndpoint = webRtcEndpoint;

                var sesssionIdAndCallee = sessionId + '/' + callee;
                while (monitorCandidatesQueue[sesssionIdAndCallee] && monitorCandidatesQueue[sesssionIdAndCallee].length > 0) {
                    webRtcEndpoint.addIceCandidate(monitorCandidatesQueue[sesssionIdAndCallee].shift());
                }

                webRtcEndpoint.on('OnIceCandidate', function (event) {
                    var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    ws.send(JSON.stringify({
                        id: 'iceCandidate',
                        candidate: candidate,
                        who: callee
                    }));
                });

                webRtcEndpoint.processOffer(sdpoffer, function (error, sdpAnswer) {
                    if (error) {
                        console.log(error);
                        webRtcEndpoint.release();
                        return;
                    }
                    //TODO
                    if (users[callee].pipeline) {

                        users[callee].pipeline.create('RtpEndpoint', function (error, calleeRtpEndpoint) {
                            if (error) {
                                console.log(error);
                                webRtcEndpoint.release();
                                return;
                            }
                            monitor.view[callee].calleeRtpEndpoint = calleeRtpEndpoint;

                            users[callee].webrtcendpont.connect(calleeRtpEndpoint, function (error) {
                                if (error) {
                                    console.log(error);
                                    webRtcEndpoint.release();
                                    return;
                                }

                                //calleeRtpEndpoint 创建 sdp 信息
                                calleeRtpEndpoint.generateOffer(function (error, calleeRtpEndpointSDPOffer) {
                                    if (error) {
                                        console.log(error);
                                        webRtcEndpoint.release();
                                        return;
                                    }

                                    //创建monitor的桥接
                                    monitor.pipeline.create('RtpEndpoint', function (error, RtpEndpoint) {
                                        if (error) {
                                            console.log(error);
                                            webRtcEndpoint.release();
                                            return;
                                        }
                                        monitor.view[callee].RtpEndpoint = RtpEndpoint;

                                        RtpEndpoint.processOffer(calleeRtpEndpointSDPOffer, function (error, RtpEndpointSDPAnswer) {
                                            if (error) {
                                                console.log(error);
                                                webRtcEndpoint.release();
                                                RtpEndpoint.release();
                                                calleeRtpEndpoint.release();
                                                return;
                                            }

                                            //calleeRtpEndpoint 接受返回的 SDP
                                            calleeRtpEndpoint.processAnswer(RtpEndpointSDPAnswer, function (error, sdpupdate) {
                                                if (error) {
                                                    console.log(error);
                                                    webRtcEndpoint.release();
                                                    RtpEndpoint.release();
                                                    calleeRtpEndpoint.release();
                                                    return;
                                                }

                                                //RtpEndpoint 连接 已经创建好的 webRtcEndpoint
                                                RtpEndpoint.connect(webRtcEndpoint, function (error) {
                                                    if (error) {
                                                        console.log(error);
                                                        webRtcEndpoint.release();
                                                        RtpEndpoint.release();
                                                        calleeRtpEndpoint.release();
                                                        return;
                                                    }

                                                    webRtcEndpoint.gatherCandidates(function (error) {
                                                        if (error) {
                                                            return console.log(error);
                                                        }
                                                    });

                                                    ws.send(JSON.stringify({
                                                        id: 'monitorResponse',
                                                        response: 'accepted',
                                                        who: callee,
                                                        sdpAnswer: sdpAnswer
                                                    }));
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
        } else {
            getKurentoClient(monitor.wsuri, function (error, _kurentoClient) {
                if (error) return console.log(error);

                _kurentoClient.create('MediaPipeline', function (error, pipeline) {
                    if (error) {
                        pipeline.release();
                        return console.log(error);
                    }

                    monitor.pipeline = pipeline;

                    pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
                        if (error) {
                            console.log(error);
                            webRtcEndpoint.release();
                        }

                        monitor.view[callee] = {};
                        monitor.view[callee].webRtcEndpoint = webRtcEndpoint;

                        var sesssionIdAndCallee = sessionId + '/' + callee;
                        while (monitorCandidatesQueue[sesssionIdAndCallee].length > 0) {
                            webRtcEndpoint.addIceCandidate(monitorCandidatesQueue[sesssionIdAndCallee].shift());
                        }

                        webRtcEndpoint.on('OnIceCandidate', function (event) {
                            var candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                            ws.send(JSON.stringify({
                                id: 'iceCandidate',
                                candidate: candidate,
                                who: callee
                            }));
                        });

                        webRtcEndpoint.processOffer(sdpoffer, function (error, sdpAnswer) {

                            //TODO
                            if (users[callee].pipeline) {

                                users[callee].pipeline.create('RtpEndpoint', function (error, calleeRtpEndpoint) {
                                    if (error) {
                                        console.log(error);
                                        webRtcEndpoint.release();
                                        return;
                                    }
                                    monitor.view[callee].calleeRtpEndpoint = calleeRtpEndpoint;

                                    users[callee].webrtcendpont.connect(calleeRtpEndpoint, function (error) {
                                        if (error) {
                                            console.log(error);
                                            webRtcEndpoint.release();
                                            return;
                                        }

                                        //calleeRtpEndpoint 创建 sdp 信息
                                        calleeRtpEndpoint.generateOffer(function (error, calleeRtpEndpointSDPOffer) {
                                            if (error) {
                                                console.log(error);
                                                webRtcEndpoint.release();
                                                return;
                                            }

                                            //创建monitor的桥接
                                            monitor.pipeline.create('RtpEndpoint', function (error, RtpEndpoint) {
                                                if (error) {
                                                    console.log(error);
                                                    webRtcEndpoint.release();
                                                    return;
                                                }
                                                monitor.view[callee].RtpEndpoint = RtpEndpoint;

                                                RtpEndpoint.processOffer(calleeRtpEndpointSDPOffer, function (error, RtpEndpointSDPAnswer) {
                                                    if (error) {
                                                        console.log(error);
                                                        webRtcEndpoint.release();
                                                        RtpEndpoint.release();
                                                        calleeRtpEndpoint.release();
                                                        return;
                                                    }

                                                    //calleeRtpEndpoint 接受返回的 SDP
                                                    calleeRtpEndpoint.processAnswer(RtpEndpointSDPAnswer, function (error, sdpupdate) {
                                                        if (error) {
                                                            console.log(error);
                                                            webRtcEndpoint.release();
                                                            RtpEndpoint.release();
                                                            calleeRtpEndpoint.release();
                                                            return;
                                                        }

                                                        //RtpEndpoint 连接 已经创建好的 webRtcEndpoint
                                                        RtpEndpoint.connect(webRtcEndpoint, function (error) {
                                                            if (error) {
                                                                console.log(error);
                                                                webRtcEndpoint.release();
                                                                RtpEndpoint.release();
                                                                calleeRtpEndpoint.release();
                                                                return;
                                                            }

                                                            webRtcEndpoint.gatherCandidates(function (error) {
                                                                if (error) {
                                                                    return console.log(error);
                                                                }
                                                            });

                                                            ws.send(JSON.stringify({
                                                                id: 'monitorResponse',
                                                                response: 'accepted',
                                                                who: callee,
                                                                sdpAnswer: sdpAnswer
                                                            }));
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
            });
        }
    }
}

function onMonitorCandidate(sessionId, callee, _candidate) {
    var candidate = kurento.register.complexTypes.IceCandidate(_candidate);
    if (monitors[sessionId] && monitors[sessionId].view[callee] && monitors[sessionId].view[callee].webRtcEndpoint) {
        monitors[sessionId].view[callee].webRtcEndpoint.addIceCandidate(candidate);
    } else {
        var sesssionIdAndCallee = sessionId + '/' + callee;
        if (!monitorCandidatesQueue[sesssionIdAndCallee]) {
            monitorCandidatesQueue[sesssionIdAndCallee] = [];
        }
        monitorCandidatesQueue[sesssionIdAndCallee].push(candidate);
    }
}

function destroyMonitor(sessionId) {

    if (monitors[sessionId]) {
        var monitor = monitors[sessionId];

        for (var callee in monitor.view) {

            if (monitor.view[callee].webRtcEndpoint) {

                monitor.view[callee].webRtcEndpoint.release();
                if (monitor.view[callee].calleeRtpEndpoint) {
                    monitor.view[callee].calleeRtpEndpoint.release();
                    delete monitor.view[callee].calleeRtpEndpoint;
                }
                if (monitor.view[callee].RtpEndpoint) {
                    monitor.view[callee].RtpEndpoint.release();
                    delete monitor.view[callee].RtpEndpoint;
                }

                delete monitor.view[callee];

            }
        }

        if (classes[monitor.classid].monitors[sessionId]) {
            delete classes[monitor.classid].monitors[sessionId];
        }

        delete monitors[sessionId];
    }

    for (var k in monitorCandidatesQueue) {
        if (k.split('/')[0] === sessionId) {
            clearMonitorCandidatesQueue(k);
        }
    }
}

module.exports.startPresenter = startPresenter;
module.exports.startViewer = startViewer;
module.exports.stop = stop;
module.exports.onIceCandidate = onIceCandidate;
module.exports.OnViewIceCandidate = OnViewIceCandidate;
module.exports.getPresnters = getPresnters;
module.exports.monitorLogin = monitorLogin;
module.exports.monitorOffer = monitorOffer;
module.exports.onMonitorCandidate = onMonitorCandidate;
module.exports.destroyMonitor = destroyMonitor;