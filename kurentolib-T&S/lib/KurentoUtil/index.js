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
    monitorCandidatesQueue = {},
    monitorhelperCandidateQueue = {};

/**
 * clear ice candidate by role & sessionId
 * @param role
 * @param sessionId
 */
function clearIceCandidateByRole( role, sessionId ){
    if(arguments.length !== 2) return console.warn('need 2 params : role & sessionId');

    if(role &&　typeof role !== 'string') return console.warn('param role : not string');

    if(sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');

    switch (role){
        case 'student':
            if(studentCandidatesQueue[sessionId]) delete studentCandidatesQueue[sessionId];
            break;
        case 'teacher':
            if(teacherCandidatesQueue[sessionId]) delete teacherCandidatesQueue[sessionId];
            break;
        case 'monitor':
            if(monitorCandidatesQueue[sessionId]) delete monitorCandidatesQueue[sessionId];
            break;
        case 'monitorhelper':
            if(monitorhelperCandidateQueue[sessionId]) delete monitorhelperCandidateQueue[sessionId];
            break;
        default :
            return console.warn('error : invalid role');
            break;
    }

}

module.exports = {

    /**
     * create kurento client
     * @param wsuri
     * @param option
     * @param callback
     */
    createKurentoClient: function (wsuri, option, callback) {
        if(arguments.length < 1) return console.warn('need at least 1 param : wsuri');

        var _wsuri,_option,_callback;
        if(arguments.length === 1) _wsuri = wsuri;
        if(arguments.length === 2) _wsuri = wsuri, _callback = option;
        if(arguments.length === 3) _wsuri = wsuri, _option=option, _callback = callback;

        if(typeof _callback !== 'function') return console.warn('param callback: callback is not a function');

        if (KurentoClients[_wsuri]) {
            return callback(null, KurentoClients[_wsuri]);
        }

        kurento(_wsuri, function (error, kurentoClient) {
            if (error) {
                console.warn("Could not find media server at address " + argv.ws_uri);
                return callback("Could not find media server at address" + argv.ws_uri + ". Exiting with error " + error);
            }

            KurentoClients[_wsuri] = kurentoClient;
            return callback(null, kurentoClient);
        });

    },

    /**
     * create kurento pipeline
     * @param kurentoClient
     * @param callback
     */
    createKurentoPipeline: function( kurentoClient, callback ){
        if(arguments.length !== 2) return console.warn('need 2 param : kurentoClient & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');


        kurentoClient.create('MediaPipeline', function (error, pipeline) {
            if(error) return callback(error);
            return callback(null,pipeline);
        });
    },

    /**
     * create kurento webrtcendpoit
     * @param pipeline
     * @param callback
     */
    createKurentoWebRtcEndpoint:function( pipeline, callback ){
        if(arguments.length !== 2) return console.warn('need 2 param : pipeline & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        pipeline.create('WebRtcEndpoint', function (error, webRtcEndpoint) {
            if(error) return callback(error);
            return callback(null,webRtcEndpoint);
        });
    },

    /**
     * create kurento rtcEndpoint
     * @param pipeline
     * @param callback
     */
    createKurentoRtcEndpoint:function( pipeline, callback ){
        if(arguments.length !== 2) return console.warn('need 2 param : pipeline & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        pipeline.create('RtpEndpoint', function (error, rtpEndpoint) {
            if(error) return callback(error);
            return callback(null,rtpEndpoint);
        });

    },

    /**
     * endpoint generate offer
     * @param endpoint
     * @param callback
     */
    endPointGenerateOffer: function( endpoint, callback ){
        if(arguments.length !== 2) return console.warn('need 2 param : endpoint & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.generateOffer(function (error, sdpOffer) {
            if(error) return callback(error);
            return callback(null,sdpOffer);
        });
    },

    /**
     * endpoint process offer
     * @param endpoint
     * @param sdpOffer
     * @param callback
     */
    endPointProcessOffer: function( endpoint, sdpOffer, callback ){
        if(arguments.length !== 3) return console.warn('need 3 param : endpoint & sdpOffer & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
            if(error) return callback(error);
            return callback(null);
        });
    },

    /**
     * endpoint process answer
     * @param endpoint
     * @param sdpAnswer
     * @param callback
     */
    endpointPrecessAnswer: function( endpoint, sdpAnswer, callback ){
        if(arguments.length !== 3) return console.warn('need at least 3 param : endpoint & sdpAnswer & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        endpoint.processAnswer(sdpAnswer, function (error, sdpUpdate) {
            if(error) return callback(error);
            return callback(null);
        });
    },

    /**
     * webrtcendpoint add ice candidate
     * @param webRtcEndpoint
     * @param candidate
     */
    webRtcEndpointAddIceCandidate: function( webRtcEndpoint, candidate ){
        if(arguments.length !== 2) return console.warn('need 2 param : webRtcEndpoint & candidate');
        webRtcEndpoint.addIceCandidate(candidate);
    },

    /**
     * webrtcendpoint gather candidates
     * @param webRtcEndpoint
     * @param callback
     */
    webRtcEndpointGatherCandidates: function( webRtcEndpoint, callback ){
        if(arguments.length !== 2) return console.warn('need 2 param : webRtcEndpoint');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        webRtcEndpoint.gatherCandidates(function (error) {
            if(error) return callback(error);
            return callback(null);
        });
    },

    /**
     * add candidate to the 'role' candidate queue
     * @param role
     * @param candidate
     */
    addToIceCandidateQueueByRole: function ( role, sessionId, _candidate ) {
        if(arguments.length !== 3) return console.warn('need 3 params : role & sessionId & candidate');

        if(role &&　typeof role !== 'string') return console.warn('param role : not string');

        if(sessionId && typeof sessionId !== 'string' && sessionId !== 'number') return console.warn('param sessionId : not string or number');

        var candidate = kurento.register.complexTypes.IceCandidate(_candidate);

        if(Users[sessionId].webrtcendpont){
            Users[sessionId].webrtcendpont.addIceCandidate(candidate);
        }else{

            switch (role){
                case 'student':
                    if(!studentCandidatesQueue[sessionId]) studentCandidatesQueue[sessionId] = [];
                    studentCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'teacher':
                    if(teacherCandidatesQueue[sessionId]) teacherCandidatesQueue[sessionId] = [];
                    teacherCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'monitor':
                    if(monitorCandidatesQueue[sessionId]) monitorCandidatesQueue[sessionId] = [];
                    monitorCandidatesQueue[sessionId].push(candidate);
                    break;
                case 'monitorhelper':
                    if(monitorhelperCandidateQueue[sessionId]) monitorhelperCandidateQueue[sessionId] = [];
                    monitorhelperCandidateQueue[sessionId].push(candidate);
                    break;
                default :
                    return console.warn('error : invalid role');
                    break;
            }

        }
    },

    /**
     * connect two cendpoints in same node
     * @param caller
     * @param callee
     * @param callback
     */
    connectEndpointsSameNode: function( callerWebRtcEndpoint, calleeWebRtcEndpoint, callback ){
        if(arguments.length !== 3) return console.warn('need 3 params : callerWebRtcEndpoint & calleeWebRtcEndpoint & callback');

        if(typeof callback !== 'function') return console.warn('param callback: callback is not a function');

        callerWebRtcEndpoint.connect(calleeWebRtcEndpoint, function (error) {
            if(error) return callback(error);
            return callback(null);
        });

    },

    /**
     * connect two cendpoints with different nodes
     * @param callerSessionId
     * @param calleeSessionId
     * @param callback
     */
    connectEndpointsDiffNode: function( callerSessionId, calleeSessionId, callback ){

    }

};