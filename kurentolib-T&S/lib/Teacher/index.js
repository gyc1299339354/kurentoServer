/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User');

/**
 * Teacher
 * @param option
 * @constructor
 */
function Teacher(option){

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

    option['role'] = 'teacher';

    User.call(this,option);

}

module.exports = Teacher;