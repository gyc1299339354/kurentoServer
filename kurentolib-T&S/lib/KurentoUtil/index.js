/**
 * Created by Administrator on 2016/1/30.
 */
var kurento = require('kurento-client'),
    Users = require('../Users');

/**
 *  define some managers
 */
var KurentoClients = {},
    studentCandidatesQueue = {},
    teacherCandidatesQueue = {},
    monitorhelperCandidateQueue = {},
    studentViewCandidatesQueue = {},
    teacherViewCandidatesQueue = {},
    monitorStuViewCandidatesQueue = {},
    monitorTeaViewCandidatesQueue = {},
    monitorhelperStuViewCandidatesQueue = {},
    monitorhelperTeaViewCandidatesQueue = {};

module.exports = {

    /**
     * create kurento client
     * @param wsuri
     * @param option
     * @param callback
     */
    createKurentoClient: function (wsuri, option, callback) {
        if (arguments.length < 1) return console.warn('need at least 1 param : wsuri');

        var _wsuri, _option, _callback;
        if (arguments.length === 1) _wsuri = wsuri;
        if (arguments.length === 2) _wsuri = wsuri, _callback = option;
        if (arguments.length === 3) _wsuri = wsuri, _option = option, _callback = callback;

        if (typeof _callback !== 'function') return console.warn('param callback: callback is not a function');

        if (KurentoClients[_wsuri]) {
            return _callback(null, KurentoClients[_wsuri]);
        }

        kurento(_wsuri, function (error, kurentoClient) {
            if (error) {
                console.warn("Could not find media server at address " + argv.ws_uri);
                return _callback("Could not find media server at address" + argv.ws_uri + ". Exiting with error " + error);
            }

            KurentoClients[_wsuri] = kurentoClient;
            return _callback(null, kurentoClient);
        });

    },

    /**
     * create kurento pipeline
     * @param kurentoClient
     * @param callback
     */
    createKurentoPipeline: function (kurentoClient, callback) {
        if (arguments.length !== 2) return console.warn('need 2 param : kurentoClient & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');


        kurentoClient.create('MediaPipeline', function (error, pipeline) {
            if (error) return callback(error);
            return callback(null, pipeline);
        });
    },

    /**
     * create kurento webrtcendpoit
     * @param pipeline
     * @param callback
     */
    createKurentoWebRtcEndpoint: function (pipeline, callback) {
        if (arguments.length !== 2) return console.warn('need 2 param : pipeline & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
            if (error) return callback(error);
            return callback(null, webRtcEndpoint);
        });
    },

    /**
     * create kurento rtcEndpoint
     * @param pipeline
     * @param callback
     */
    createKurentoRtcEndpoint: function (pipeline, callback) {
        if (arguments.length !== 2) return console.warn('need 2 param : pipeline & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        pipeline.create('RtpEndpoint', function (error, rtpEndpoint) {
            if (error) return callback(error);
            return callback(null, rtpEndpoint);
        });

    },

    /**
     * endpoint generate offer
     * @param endpoint
     * @param callback
     */
    endPointGenerateOffer: function (endpoint, callback) {
        if (arguments.length !== 2) return console.warn('need 2 param : endpoint & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.generateOffer(function (error, sdpOffer) {
            if (error) return callback(error);
            return callback(null, sdpOffer);
        });
    },

    /**
     * endpoint process offer
     * @param endpoint
     * @param sdpOffer
     * @param callback
     */
    endPointProcessOffer: function (endpoint, sdpOffer, callback) {
        if (arguments.length !== 3) return console.warn('need 3 param : endpoint & sdpOffer & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
            if (error) return callback(error);
            return callback(null, sdpAnswer);
        });
    },

    /**
     * endpoint process answer
     * @param endpoint
     * @param sdpAnswer
     * @param callback
     */
    endpointPrecessAnswer: function (endpoint, sdpAnswer, callback) {
        if (arguments.length !== 3) return console.warn('need at least 3 param : endpoint & sdpAnswer & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.processAnswer(sdpAnswer, function (error, sdpUpdate) {
            if (error) return callback(error);
            return callback(null);
        });
    },

    /**
     * aUser add ice candidate
     * @param aUser
     */
    webRtcEndpointAddIceCandidate: function (aUser) {
        if (arguments.length !== 1) return console.warn('need 1 param : aUser');

        var webRtcEndpoint = aUser.webrtcendpont,
            role = aUser.role,
            sessionId = aUser.sessionId,
            candicateList;

        switch (role) {
            case 'student':
                candicateList = studentCandidatesQueue[sessionId];
                break;

            case 'teacher':
                candicateList = teacherCandidatesQueue[sessionId];
                break;

            case 'monitorhelper':
                candicateList = monitorhelperCandidateQueue[sessionId];
                break;

            default:
                break;
        }

        if (candicateList) {
            while (candicateList.length) {
                var candidate = candicateList.shift();
                webRtcEndpoint.addIceCandidate(candidate);
            }
        }

    },

    /**
     * aUser to add ice candidate for view
     * @param aUser
     * @param who
     */
    webRtcEndpointAddIceCandidateForView: function (aUser, who) {
        if (arguments.length < 1) return console.warn('need at least 1 param : aUser & [who] ');

        var webRtcEndpointView,
            role = aUser.role,
            sessionId = aUser.sessionId,
            candicateList = [];

        if (who === 'teacher') {
            webRtcEndpointView = aUser.t_viewwebrtcendpoint;
        } else if (who === 'student') {
            webRtcEndpointView = aUser.s_viewwebrtcendpoint;
        } else {
            webRtcEndpointView = aUser.viewwebrtcendpoint;
        }

        switch (role) {
            case 'student':
                candicateList = studentViewCandidatesQueue[sessionId];
                break;

            case 'teacher':
                candicateList = teacherViewCandidatesQueue[sessionId];
                break;

            case 'monitor':
                candicateList = (who === 'teacher') ? monitorTeaViewCandidatesQueue[sessionId] : monitorStuViewCandidatesQueue[sessionId];
                break;

            case 'monitorhelper':
                candicateList = (who === 'teacher') ? monitorhelperTeaViewCandidatesQueue[sessionId] : monitorhelperStuViewCandidatesQueue[sessionId];
                break;

            default:
                break;
        }

        if (candicateList) {
            while (candicateList.length) {
                var candidate = candicateList.shift();
                webRtcEndpointView.addIceCandidate(candidate);
            }
        }

        return;
    },

    /**
     * webrtcendpoint gather candidates
     * @param webRtcEndpoint
     * @param callback
     */
    webRtcEndpointGatherCandidates: function (webRtcEndpoint, callback) {
        if (arguments.length !== 2) return console.warn('need 2 param : webRtcEndpoint');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        webRtcEndpoint.gatherCandidates(function (error) {
            if (error) return callback(error);
            return callback(null);
        });
    },

    /**
     * add candidate to the 'role' candidate queue
     * @param role
     * @param candidate
     */
    addToIceCandidateQueueByRole: function (role, sessionId, _candidate) {
        if (arguments.length !== 3) return console.warn('need 3 params : role & sessionId & candidate');

        if (role && typeof role !== 'string') return console.warn('param role : not string');

        if (sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');

        var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

        if (Users[sessionId] && Users[sessionId].webrtcendpont) {
            Users[sessionId].webrtcendpont.addIceCandidate(candidate);
        } else {

            switch (role) {
                case 'student':
                    if (!studentCandidatesQueue[sessionId]) studentCandidatesQueue[sessionId] = [];
                    studentCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'teacher':
                    if (!teacherCandidatesQueue[sessionId]) teacherCandidatesQueue[sessionId] = [];
                    teacherCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'monitorhelper':
                    if (!monitorhelperCandidateQueue[sessionId]) monitorhelperCandidateQueue[sessionId] = [];
                    monitorhelperCandidateQueue[sessionId].push(candidate);
                    break;
                default :
                    return console.warn('error : invalid role');
                    break;
            }

        }
    },

    /**
     * add candidate to the 'role' candidate queue for view
     * @param role
     * @param sessionId
     * @param candidate
     * @param who
     */
    addToIceCandidateQueueByRoleForView: function (role, sessionId, _candidate, who) {
        if (arguments.length < 3) return console.warn('need at least 3 params : role & sessionId & candidate & [who]');

        if (role && typeof role !== 'string') return console.warn('param role : not string');

        if (sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');

        var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

        if (!who && Users[sessionId].viewwebrtcendpoint) {
            //when user is a student/teacher and view webrtcendpoint is already exit
            Users[sessionId].viewwebrtcendpoint.addIceCandidate(candidate);
        } else if (who && who === 'student' && Users[sessionId].s_viewwebrtcendpoint) {
            //when user is a monitor/monitorhelper and student view webrtcendpoint is already exit
            Users[sessionId].s_viewwebrtcendpoint.addIceCandidate(candidate);
        } else if (who && who === 'teacher' && Users[sessionId].t_viewwebrtcendpoint) {
            //when user is a monitor/monitorhelper and teacher view webrtcendpoint is already exit
            Users[sessionId].t_viewwebrtcendpoint.addIceCandidate(candidate);
        } else {

            switch (role) {
                case 'student':
                    if (!studentViewCandidatesQueue[sessionId]) studentViewCandidatesQueue[sessionId] = [];
                    studentViewCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'teacher':
                    if (!teacherViewCandidatesQueue[sessionId]) teacherViewCandidatesQueue[sessionId] = [];
                    teacherViewCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'monitor':
                    if (who === 'teacher') {
                        if (!monitorTeaViewCandidatesQueue[sessionId])monitorTeaViewCandidatesQueue[sessionId] = [];
                        monitorTeaViewCandidatesQueue[sessionId].push(candidate);
                    } else {
                        if (!monitorStuViewCandidatesQueue[sessionId])monitorStuViewCandidatesQueue[sessionId] = [];
                        monitorStuViewCandidatesQueue[sessionId].push(candidate);
                    }
                    break;
                case 'monitorhelper':
                    if (who === 'teacher') {
                        if (!monitorhelperTeaViewCandidatesQueue[sessionId])monitorhelperTeaViewCandidatesQueue[sessionId] = [];
                        monitorhelperTeaViewCandidatesQueue[sessionId].push(candidate);
                    } else {
                        if (!monitorhelperStuViewCandidatesQueue[sessionId])monitorhelperStuViewCandidatesQueue[sessionId] = [];
                        monitorhelperStuViewCandidatesQueue[sessionId].push(candidate);
                    }
                    break;
                default :
                    return console.warn('error : invalid role');
                    break;
            }

        }
    },

    /**
     * clear ice candidate by role & sessionId
     * @param role
     * @param sessionId
     */
    clearIceCandidateByRole: function (role, sessionId) {
        if (arguments.length !== 2) return console.warn('need 2 params : role & sessionId');

        if (role && typeof role !== 'string') return console.warn('param role : not string');

        if (sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');

        switch (role) {
            case 'student':
                if (studentCandidatesQueue[sessionId]) delete studentCandidatesQueue[sessionId];
                break;
            case 'teacher':
                if (teacherCandidatesQueue[sessionId]) delete teacherCandidatesQueue[sessionId];
                break;
            case 'monitorhelper':
                if (monitorhelperCandidateQueue[sessionId]) delete monitorhelperCandidateQueue[sessionId];
                break;
            default :
                return console.warn('error : invalid role');
                break;
        }

    },

    /**
     * clear ice candidate by role & sessionId for view
     * @param role
     * @param sessionId
     * @param who
     */
    clearIceCandidateByRoleForView: function (role, sessionId, who) {
        if (arguments.length < 2) return console.warn('need 2 params : role & sessionId & [who]');

        if (role && typeof role !== 'string') return console.warn('param role : not string');

        if (sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');


        switch (role) {
            case 'student':
                if (studentViewCandidatesQueue[sessionId]) delete studentViewCandidatesQueue[sessionId];
                break;
            case 'teacher':
                if (teacherViewCandidatesQueue[sessionId]) delete teacherViewCandidatesQueue[sessionId];
                break;
            case 'monitor':
                if (who && who === 'teacher') {
                    if (monitorTeaViewCandidatesQueue[sessionId]) delete monitorTeaViewCandidatesQueue[sessionId];
                } else {
                    if (monitorStuViewCandidatesQueue[sessionId]) delete monitorStuViewCandidatesQueue[sessionId];
                }
                break;
            case 'monitorhelper':
                if (who && who === 'teacher') {
                    if (monitorhelperTeaViewCandidatesQueue[sessionId]) delete monitorhelperTeaViewCandidatesQueue[sessionId];
                } else {
                    if (monitorhelperStuViewCandidatesQueue[sessionId]) delete monitorhelperStuViewCandidatesQueue[sessionId];
                }
                break;
            default :
                return console.warn('error : invalid role');
                break;
        }

    },

    /**
     * connect two endpoints
     * @param caller
     * @param callee
     * @param callback
     */
    connectEndpoints: function (callerEndpoint, calleeEndpoint, callback) {
        if (arguments.length !== 3) return console.warn('need 3 params : callerWebRtcEndpoint & calleeWebRtcEndpoint & callback');

        if (typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        callerEndpoint.connect(callerEndpoint, function (error) {
            if (error) return callback(error);
            return callback(null);
        });
    },

    /**
     *
     * @param aClass
     * @param msg
     */
    notifyInClass: function (aClass, msg, except) {
        //loop users in class
        var _msg = JSON.stringify(msg);
        if (aClass && aClass.student && aClass.student.ws && except !== 'student') aClass.student.ws.send(_msg);
        if (aClass && aClass.teacher && aClass.teacher.ws && except !== 'teacher') aClass.teacher.ws.send(_msg);
        if (aClass && aClass.monitor) {
            var monitors = aClass.monitor;
            for (var keyname in monitors) {
                if (monitors[keyname] && monitors[keyname].ws)  monitors[keyname].ws.send(_msg);
            }
        }
        if (aClass && aClass.monitorhelper) {
            var monitorhelpers = aClass.monitorhelper;
            for (var keyname in monitorhelpers) {
                if (monitorhelpers[keyname] && monitorhelpers[keyname].ws)  monitorhelpers[keyname].ws.send(_msg);
            }
        }
    }
};