var Monitor = require('./lib/Monitor'),
    MonitorHelper = require('./lib/MonitorHelper'),
    Student = require('./lib/Student'),
    Teacher = require('./lib/Teacher');

function aUserLogin(option) {

    if (arguments.length !== 1) {
        console.warn('need a param : option!');
        return undefined;
    }

    if (typeof option !== 'object') {
        console.warn('error param : option is not object!');
        return undefined;
    }

    if (!option.classid || !option.sessionId || !option.role || !option.ws) {
        console.warn('error param : option { classid / sessionId / role } !');
        return undefined;
    }

    var userOption = {
        classid: option.classid,
        sessionId: option.sessionId,
        ws: option.ws
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

module.exports.aUserLogin = aUserLogin;