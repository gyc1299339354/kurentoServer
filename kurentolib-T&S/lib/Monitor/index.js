/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User'),
    Classes = require('../Classes');

/**
 * Monitor
 * @param option
 * @constructor
 */
function Monitor(option){

    //判断option
    if(!option){
        return new Error('need param "option" !')
    }

    if(!option.sessionId){
        return new Error('option need param "sessionId" !')
    }

    if(!option.classid){
        return new Error('option need param "classid" !')
    }

    option['role'] = option.role || 'monitor';

    User.call(this,option);

    //this class 's teacher 's sessionId
    this.teacher = null;

    //this class 's student 's sessionId
    this.student = null;

    var thisClass = Classes[option.classid];

    if(thisClass['teacher']) this.teacher = thisClass['teacher'].sessionId;
    if(thisClass['student']) this.student = thisClass['student'].sessionId;

}

module.exports = Monitor;