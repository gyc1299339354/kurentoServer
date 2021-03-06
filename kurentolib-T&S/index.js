var Monitor = require('./lib/Monitor'),
    MonitorHelper = require('./lib/MonitorHelper'),
    Student = require('./lib/Student'),
    Teacher = require('./lib/Teacher'),
    Classes = require('./lib/Classes');

function aUserLogin(option) {

    if (arguments.length !== 1) {
        return console.warn('need a param : option!');
    }

    if (typeof option !== 'object') {
        return console.warn('error param : option is not object!');
    }

    if (!option.classid || !option.sessionId || !option.role || !option.ws) {
        return console.warn('error param : option { classid / sessionId / role } !');
    }

    var userOption = {
        classid: option.classid,
        sessionId: option.sessionId,
        ws: option.ws,
        wsuri: option.wsuri || null
    };

    switch (option.role) {
        case 'student':
            return new Student(userOption);
            break;

        case 'teacher':
            return new Teacher(userOption);
            break;

        case 'monitor':
            return new Monitor(userOption);
            break;

        case 'monitorhelper':
            return new MonitorHelper(userOption);
            break;

        default:
            return undefined;
            break;
    }

}

function stop(aUser) {
    var aClass = Classes[aUser.classid];

    //销毁收视者们的endpoint
    if (aUser.role === 'student' || aUser.role === 'teacher') {
        if (aUser.role === 'student' && !!aClass.teacher && aClass.teacher.viewwebrtcendpoint) {

        }
        if (aUser.role === 'teacher' && !!aClass.student && aClass.student.viewwebrtcendpoint) {

        }
    } else {


    }

    //销毁user
    if (aUser.webrtcendpont) {
        aUser.webrtcendpont.release();
    }

}

module.exports.aUserLogin = aUserLogin;
module.exports.stop = stop;