/**
 * Created by Administrator on 2016/1/29.
 */
var Classes = require('../lib/Classes'),
    Monitor = require('../lib/Monitor'),
    MonitorHelper = require('../lib/MonitorHelper'),
    Student = require('../lib/Student'),
    Teacher = require('../lib/Teacher'),
    KurentoUtil = require('../lib/KurentoUtil');

var Monitor_option, MonitorHelper_option, Student_option, Teacher_option,
    Monitor_option = {
        classid: 'test_classid'
    },
    MonitorHelper_option = {
        classid: 'test_classid'
    },
    Student_option = {
        classid: 'test_classid'
    },
    Teacher_option = {
        classid: 'test_classid'
    };
Monitor_option['sessionId'] = 'test_Monitor_seesionId',
    MonitorHelper_option['sessionId'] = 'test_MonitorHelper_seesionId',
    Student_option['sessionId'] = 'test_Student_seesionId',
    Teacher_option['sessionId'] = 'test_Teacher_seesionId';

/**
 * create a
 */
var test_student = new Student(Student_option),
    test_teacher = new Teacher(Teacher_option),
    test_monitor = new Monitor(Monitor_option),
    test_monitor_help = new MonitorHelper(MonitorHelper_option);

//console.log(KurentoUtil.test());
//console.log(Classes);
console.log(test_student.emit('test'));