/**
 * Created by Administrator on 2016/2/2.
 */

var ws = new WebSocket('wss://' + location.host + '/m2m');
var WS_STATE = false;

function sendMessage(message) {
    if (!WS_STATE) {
        setTimeout(function () {
            sendMessage(message);
        }, 500);
    } else {
        if (!message.id) message.id = 'eventCome';
        var jsonMessage = JSON.stringify(message);
        //console.log('Sending message: ' + jsonMessage);
        ws.send(jsonMessage);
    }
}

ws.onopen = function () {
    WS_STATE = true;
    ws.send(JSON.stringify({
        id: 'aUserLogin',
        option: {
            classid: '_default',
            role: 'student',
            wsuri: 'ws://121.43.108.40:8888/kurento'
        }
    }));
};

ws.onmessage = function (message) {
    var msg = JSON.parse(message.data);
    console.info('Received message: ' + message.data);

    switch (msg.evName) {
        case 'presentError':
            KurentoLib.errorAnswer(msg);
            break;

        case 'presentSdpAnswer':
            KurentoLib.presentSdpAnswer(msg);
            break;

        case 'viewError':
            KurentoLib.errorAnswer(msg);
            break;

        case 'viewSdpAnswer':
            KurentoLib.viewSdpAnswer(msg);
            break;

        case 'presentIceCandidate':
            KurentoLib.presentAnswerIceCandidate(msg);
            break;

        case 'viewIceCandidate':
            KurentoLib.viewAnswerIceCandidate(msg);
            break;

        case 'coming':
            KurentoLib.coming(msg);
            break;

        case 'leaving':
            KurentoLib.leaving(msg);
            break;

        default:
            KurentoLib.errorAnswer('Unrecognized message', msg);
            break;
    }

};

window.onload = function () {
    KurentoLib.startPresent({localVideo: document.getElementById('localvideo')});
};