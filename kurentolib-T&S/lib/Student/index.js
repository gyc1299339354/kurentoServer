/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User'),
    EventUtil = require('../EventUtil');

/**
 * Student
 * @param option
 * @constructor
 */
function Student(option) {

    //判断option
    if (!option) {
        return new Error('need param "option" !')
    }

    if (!option.sessionId) {
        return new Error('option need param "sessionId" !')
    }

    if (!option.classid) {
        return new Error('option need param "classid" !')
    }

    option['role'] = 'student';

    User.call(this, option);

    //endpoint in same pipeline to record
    this.recordrtpendpoint = null;

    //the guy 's rtpendpoint to send out if in diff server node
    this.outrtpendpoint = {};

    //this guy 's rtpendpoint to receive teacher if in diff server node
    this.recvrtpendpoint = null;

    //a webrtcendpoint to view teacher
    this.viewwebrtcendpoint = null;

}

Student.prototype = new EventUtil();

module.exports = Student;