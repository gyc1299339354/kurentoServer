/**
 * Created by Administrator on 2016/1/29.
 */
var User = require('../User');

/**
 * Student
 * @param option
 * @constructor
 */
function Student(option){

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

    option['role'] = 'student';

    User.call(this,option);

}

module.exports = Student;