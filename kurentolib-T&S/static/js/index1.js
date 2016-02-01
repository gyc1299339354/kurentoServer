/*
 * (C) Copyright 2014-2015 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */

var ws = new WebSocket('wss://' + location.host + '/m2m');
var localvideo;
var remotevideo;
var webRtcPresent;
var webRtcView = {};
var viewList = [];

window.onload = function () {
    localvideo = document.getElementById('localvideo');
    remotevideo = document.getElementById('remotevideo');

    document.getElementById('call').addEventListener('click', function () {
        presenter();
        $('#call').css('display', 'none');
    });
    //document.getElementById('viewer').addEventListener('click', function () {
    //    return;
    //});
    //document.getElementById('terminate').addEventListener('click', function () {
    //    stop();
    //});
}

window.onbeforeunload = function () {
    stop();
    ws.close();
}

ws.onmessage = function (message) {
    var parsedMessage = JSON.parse(message.data);

    if (parsedMessage.id.indexOf('Candidate') < 0) {
        console.info('Received message: ' + message.data);
    }

    switch (parsedMessage.id) {
        case 'presenterResponse':
            presenterResponse(parsedMessage);
            break;
        case 'viewerResponse':
            viewerResponse(parsedMessage);
            break;
        case 'stopCommunication':
            dispose();
            break;
        case 'iceCandidate':
            webRtcPresent.addIceCandidate(parsedMessage.candidate);
            break;
        case 'viewIceCandidate':
            viewIceCandidate(parsedMessage.who, parsedMessage.candidate);
            break;
        case 'pushViewList':
            pushViewList(parsedMessage.addviewlist);
            break;
        case 'leaveView':
            leaveView(parsedMessage.callee);
            break;
        case 'comingCallee':
            comingCallee(parsedMessage.callee);
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
    }
}

function presenterResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.warn('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcPresent.processAnswer(message.sdpAnswer);
        if (viewList.length > 0) {
            viewer(viewList[0]);
        }
    }
}

function viewerResponse(message) {
    if (message.response != 'accepted') {
        var errorMsg = message.message ? message.message : 'Unknow error';
        console.warn('Call not accepted for the following reason: ' + errorMsg);
        dispose();
    } else {
        webRtcView[message.who].processAnswer(message.sdpAnswer);
    }
}

function presenter() {
    if (!webRtcPresent) {
        showSpinner(localvideo);

        var options = {
            localVideo: localvideo,
            onicecandidate: onIceCandidate
        }

        webRtcPresent = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) return onError(error);

            this.generateOffer(onOfferPresenter);
        });
    }
}

function onOfferPresenter(error, offerSdp) {
    if (error) return onError(error);

    var message = {
        id: 'presenter',
        role: 'student',
        option: {
            sdpOffer: offerSdp,
            wsuri: 'ws://121.43.108.40:8888/kurento'
            //wsuri: 'ws://47.88.10.123:8888/kurento'
            //wsuri: 'ws://52.62.44.7:8888/kurento'
            //wsuri: 'ws://52.79.80.195:8888/kurento'
        }

    };
    sendMessage(message);
}

function viewer(who) {
    if (!webRtcView[who]) {
        webRtcView[who] = null;
        showSpinner(remotevideo);

        var options = {
            remoteVideo: remotevideo,
            onicecandidate: OnViewIceCandidate(who)
        }

        webRtcView[who] = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) return onError(error);

            this.generateOffer(onOfferViewer(who));
        });
    }
}

function onOfferViewer(callee) {
    return function (error, offerSdp) {
        if (error) return onError(error);

        var message = {
            id: 'viewer',
            option: {
                callee: callee,
                sdpOffer: offerSdp
            }
        };
        sendMessage(message);
    }
}

function onIceCandidate(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));

    var message = {
        id: 'onIceCandidate',
        candidate: candidate
    }
    sendMessage(message);
}

function OnViewIceCandidate(callee) {
    return function (candidate) {
        console.log('Local view ' + callee + ' candidate' + JSON.stringify(candidate));

        var message = {
            id: 'onViewIceCandidate',
            callee: callee,
            candidate: candidate
        }
        sendMessage(message);
    };
}

function viewIceCandidate(who, candidate) {
    webRtcView[who].addIceCandidate(candidate);
}

function stop() {
    if (webRtcPresent) {
        var message = {
            id: 'stop'
        }
        sendMessage(message);
        dispose();
    }
}

function dispose() {
    if (webRtcPresent) {
        webRtcPresent.dispose();
        webRtcPresent = null;
        $('#call').css('display', 'block');
    }
    hideSpinner(localvideo);
}

function pushViewList(addviewlist) {
    if (addviewlist && addviewlist.length > 0) {
        for (var i in addviewlist) {
            if (viewList.indexOf(addviewlist[i]) > -1) {
                continue;
            } else {
                viewList.push(addviewlist[i]);
            }
        }
    }
}

function leaveView(callee) {
    if (webRtcView[callee]) {
        webRtcView[callee].dispose();
        delete webRtcView[callee];
    }

    var i = viewList.indexOf(callee);
    if (i > -1) {
        viewList.splice(i, 1);
    }
    hideSpinner(remotevideo);
}

function comingCallee(callee) {
    viewList.push(callee);
    viewer(callee);
}

function sendMessage(message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    ws.send(jsonMessage);
}

function showSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].poster = './img/transparent-1px.png';
        arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
    }
}

function hideSpinner() {
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].src = '';
        arguments[i].poster = './img/webrtc.png';
        arguments[i].style.background = '';
    }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function (event) {
    event.preventDefault();
    $(this).ekkoLightbox();
});

/*
 *
 * */
function onError(error) {
    console.warn(error);
}
