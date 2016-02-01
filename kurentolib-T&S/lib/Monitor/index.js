/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User');

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

    this.teacher = null;
    this.student = null;

}

module.exports = Monitor;