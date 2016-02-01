/**
 * Created by Administrator on 2016/1/29.
 */
var Monitor = require('../Monitor'),
    Classes = require('../Classes');

/**
 * MonitorHelper
 * @param option
 * @constructor
 */
function MonitorHelper(option){

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

    //
    option['role'] = 'monitorhelper';

    //助教监听，从student处取 wsuri
    option['wsuri'] = Classes[option.classid].student.wsuri;

    Monitor.call(this,option);

}

module.exports = MonitorHelper;