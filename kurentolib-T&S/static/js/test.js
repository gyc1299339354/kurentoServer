/**
 * Created by Administrator on 2016/2/2.
 */

var ws = new WebSocket('wss://' + location.host + '/m2m');

ws.onopen = function () {
    ws.send(JSON.stringify({
        id:'aUserLogin',
        option:{
            classid:'_default',
            role:'student'
        }
    }));
}