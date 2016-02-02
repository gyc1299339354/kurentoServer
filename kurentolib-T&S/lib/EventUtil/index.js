/**
 * Created by Administrator on 2016/2/2.
 */

var EventEmitter = require('events').EventEmitter,
    KurentoUtil = require('../KurentoUtil');

function EventUtil(){
    this.on('test', function () {
        console.log('test');
    });

    //

}

EventUtil.prototype = new EventEmitter();

module.exports = EventUtil;