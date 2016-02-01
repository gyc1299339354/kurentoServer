var ws = new WebSocket('wss://' + location.host + '/m2m');
var Monitors = {};
var monitorList = [];

window.onload = function () {
    document.getElementById('monitor').addEventListener('click', function () {
        startMonitor();
        $('#monitor').css('display', 'none');
    });
}

window.onbeforeunload = function () {
    //TODO stop something
    stop();
    ws.close();
}
ws.onopen = function () {
    sendMessage({
        id: 'monitorLogin',
        option: {
            classid: '_default'
        }
    });
}
ws.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);
    if (parsedMessage.id.indexOf('Candidate') < 0) {
        console.info('Received message: ' + message.data);
    }

    switch (parsedMessage.id) {
        case 'monitorLoginResponse':
            monitorLoginResponse(parsedMessage.userlist);
            break;
        case 'monitorResponse':
            monitorResponse(parsedMessage.who, parsedMessage.sdpAnswer);
            break;
        case 'iceCandidate':
            iceCandidate(parsedMessage.who, parsedMessage.candidate);
            break;
        case 'comingCallee':
            comingCallee(parsedMessage.who);
            break;
        case 'leaveView':
            leaveView(parsedMessage.who);
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
}

/**
 * ********************************
 *      ws 函数区                 *
 * ********************************
 */
function monitorLoginResponse(userlist) {
    console.log('monitorLoginResponse:', userlist);
    if (userlist.length > 0) {
        monitorList = userlist;
    }
}

function monitorResponse(who, sdpAnswer) {
    Monitors[who].processAnswer(sdpAnswer);
}

function iceCandidate(who, candidate) {
    Monitors[who].addIceCandidate(candidate);
}

function comingCallee(who) {
    monitor(who, function () {
        return;
    });
}

function leaveView(who) {
    destroy(who);
}

/*
 * ****************************
 *
 * ****************************
 * */

function startMonitor() {
    if (monitorList.length > 0) {
        monitor(monitorList.shift(), startMonitor);
    } else {
        return;
    }
}

function monitor(who, callback) {
    if (Monitors[who]) {
        return callback();
    } else {
        Monitors[who] = null;
        //TODO create a video tag

        var aVideoTag = createVideoTag(who);

        var options = {
            remoteVideo: aVideoTag,
            onicecandidate: OnIceCandidate(who)
        }

        Monitors[who] = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) return onError(error);

            this.generateOffer(onOfferMonitor(who));
            callback();
        });

    }
}

/*
 *
 * */
function onError(error) {
    console.warn(error);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function createVideoTag(who) {
    var id = 'remotevideo_' + who;
    var parentElement = document.getElementById('container');

    var tempvideotag = document.createElement('video');
    tempvideotag.id = id;
    tempvideotag.autoplay = true;
    tempvideotag.width = 320;
    tempvideotag.height = 240;

    parentElement.appendChild(tempvideotag);

    return document.getElementById(id);

}

function OnIceCandidate(callee) {

    return function (candidate) {

        console.log('Local monitor ' + callee + ' candidate' + JSON.stringify(candidate));

        var message = {
            id: 'onMonitorIceCandidate',
            callee: callee,
            candidate: candidate
        }

        sendMessage(message);
    };

}

function onOfferMonitor(callee) {

    return function (error, offerSdp) {

        if (error) return onError(error);

        var message = {
            id: 'monitorOffer',
            callee: callee,
            sdpOffer: offerSdp
        };

        sendMessage(message);
    }

}

function stop() {
    sendMessage({
        id: 'destroyMonitor'
    });
    destroy();
}

function destroy(who) {

    if (who) {
        kill(who);
    } else {

        for (var i in Monitors) {
            kill(Monitors[i]);
        }
    }

    function kill(_who) {
        //TODO 销毁 一个 监控
        Monitors[_who] = null;
        delete Monitors[_who];
        //销毁 video tag
        $('#remotevideo_' + _who).remove();
    }

}