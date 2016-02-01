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

var path = require('path');
var url = require('url');
var express = require('express');
var minimist = require('minimist');
var ws = require('ws');
var fs = require('fs');
var https = require('https');
var index = require('./index');

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
    }
});

var options =
{
    key: fs.readFileSync('keys/server.key'),
    cert: fs.readFileSync('keys/server.crt')
};

var app = express();

/*
 * Definition of global variables.
 */
var idCounter = 0;


/*
 * Server startup
 */
var asUrl = url.parse(argv.as_uri);
var port = asUrl.port;
var server = https.createServer(options, app).listen(port, function () {
    console.log('Kurento Tutorial started');
    console.log('Open ' + url.format(asUrl) + ' with a WebRTC capable browser');
});

var wss = new ws.Server({
    server: server,
    path: '/m2m'
});

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Management of WebSocket messages
 */
wss.on('connection', function (ws) {

    var sessionId = nextUniqueId();
    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        index.stop(sessionId);
    });

    ws.on('close', function () {
        console.log('Connection ' + sessionId + ' closed');
        //index.stop(sessionId);
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message);
        if (message.id.indexOf('Candidate') < 0) {
            console.log('Connection ' + sessionId + ' received message ', message);
        }

        switch (message.id) {
            case 'presenter':
                index.startPresenter(sessionId, ws, message.option, function (error, sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id: 'presenterResponse',
                            response: 'rejected',
                            message: error
                        }));
                    }
                    ws.send(JSON.stringify({
                        id: 'presenterResponse',
                        response: 'accepted',
                        sdpAnswer: sdpAnswer
                    }));
                });
                break;

            case 'viewer':
                index.startViewer(sessionId, ws, message.option, function (error, callee, sdpAnswer) {
                    if (error) {
                        return ws.send(JSON.stringify({
                            id: 'viewerResponse',
                            response: 'rejected',
                            message: error
                        }));
                    }

                    ws.send(JSON.stringify({
                        id: 'viewerResponse',
                        response: 'accepted',
                        who: callee,
                        sdpAnswer: sdpAnswer
                    }));
                });
                break;

            case 'monitorLogin':
                index.monitorLogin(sessionId, message.option, ws);
                break;

            case 'monitorOffer':
                index.monitorOffer(sessionId, ws, message.callee, message.sdpOffer);
                break;

            case 'stop':
                index.stop(sessionId);
                break;

            case 'onIceCandidate':
                index.onIceCandidate(sessionId, message.candidate);
                break;

            case 'onViewIceCandidate':
                index.OnViewIceCandidate(sessionId, message.callee, message.candidate);
                break;

            case 'onMonitorIceCandidate':
                index.onMonitorCandidate(sessionId, message.callee, message.candidate);
                break;

            case 'destroyMonitor':
                index.destroyMonitor(sessionId);
                break;

            case 'getPresnters':
                index.getPresnters(sessionId, ws);
                break;
            default:
                ws.send(JSON.stringify({
                    id: 'error',
                    message: 'Invalid message ' + message
                }));
                break;
        }
    });
});


app.use(express.static(path.join(__dirname, 'static')));
