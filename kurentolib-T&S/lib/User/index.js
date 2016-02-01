/**
 * Created by Administrator on 2016/1/19.
 * changed by gyc on 2016/1/29 re-define the User construct
 */
var config = require('../../config'),
    Classes = require('../Classes'),
    Users = require('../Users');
/**
 * User
 * @param option
 *              sessionId
 *              [role]
 *              [wsuri]
 *              classid
 * @constructor
 */
function User(option) {

    if(!Classes[option.classid]){
        createClass(option.classid);
    }

    if(option.sessionId){
        if(Users[option.sessionId]) return Users[option.sessionId];
    }

    //like word means
    this.sessionId = option.sessionId;

    //the user's role : student/teacher/monitor/monitorhelper
    this.role = option.role;

    //the teacher/student 's sessionId
    this.view = null;

    // node uri info
    this.wsuri = option.wsuri || config.DEFAULT_WSURI;

    // user's Kurento WebRtcEndpoint
    this.webrtcendpont = null;

    // user's Kurento PipeLine
    this.pipeline = null;

    // user's Class's ID
    this.classid = option.classid || '_default';

    //user's WebSocket
    this.ws = option.ws;

    var thisClass = Classes[option.classid];

    switch (option.role){
        case 'teacher':
            thisClass['teacher'] = this;
            break;
        case 'student':
            thisClass['student'] = this;
            break;
        case 'monitor':
            thisClass['monitors']['monitor'][option.sessionId] = this;
            break;
        case 'monitorhelper':
            thisClass['monitors']['monitorhelper'][option.sessionId] = this;
            break;
        default:
            break;
    }

}

function createClass(classid){
    Classes[classid] = {};
    Classes[classid]['teacher'] = null;
    Classes[classid]['student'] = null;
    Classes[classid]['monitors'] = {
        monitor:{

        },
        monitorhelper:{

        }
    };
}

module.exports = User;