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
var UUID = require('uuid');
var index = require('./index');

var argv = minimist(process.argv.slice(2), {
    default: {
        as_uri: 'https://localhost:8443/',
    }
});

var options =
{
    key: fs.readFileSync('keys/2_rtcs.dadaabc.com.key'),
    cert: fs.readFileSync('keys/1_rtcs.dadaabc.com_bundle.crt')
};

var app = express();

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

/*
 * Management of WebSocket messages
 */
wss.on('connection', function (ws) {

    var sessionId = UUID.v4(),
        aUser;
    console.log('Connection come with sessionId ' + sessionId);

    ws.on('error', function (error) {
        console.log('Connection ' + sessionId + ' error');
        //index.stop(sessionId);
    });

    ws.on('close', function () {
        console.log('Connection ' + sessionId + ' closed');
        //index.stop(sessionId);
    });

    ws.on('message', function (_message) {
        var message = JSON.parse(_message);


        switch (message.id) {
            case 'aUserLogin':
                var _option = message.option || {};
                _option['sessionId'] = sessionId;
                _option['ws'] = ws;
                aUser = index.aUserLogin(_option);
                break;

            case 'eventCome':
                if (aUser) aUser.emit(message.evName, message.option);
                break;

            case 'stop':
                if (aUser) index.stop(aUser);
                break;
            default:
                break;
        }

    });
});


app.use(express.static(path.join(__dirname, 'static')));
