/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User'),
    Classes = require('../Classes'),
    EventUtil = require('../EventUtil'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * Monitor
 * @param option
 * @constructor
 */
function Monitor(option) {

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

    option['role'] = option.role || 'monitor';

    User.call(this, option);

    //this class 's teacher [Teacher]
    this.teacher = null;

    //this class 's student [Student]
    this.student = null;

    var thisClass = Classes[option.classid];

    if (thisClass['teacher']) this.teacher = thisClass['teacher'];
    if (thisClass['student']) this.student = thisClass['student'];

    this.s_viewwebrtcendpoint = null;

    this.t_viewwebrtcendpoint = null;

    this.rtcendpoints = {
        teacher: {},
        student: {}
    };

    EventUtil(this);
}

util.inherits(Monitor, EventEmitter);

module.exports = Monitor;