/**
 * Created by Administrator on 2016/2/15.
 */
var _localvideo, localWebRtc;
var KurentoLib = {
    test: function () {
        console.log('test');
        this.test1();
    },
    test1: function () {
        console.log('test1');
    },
    /**
     *
     * @param option
     */
    startPresent: function (option) {
        if (!option || !option.localVideo) return console.warn('error: need option or option.localvideo');

        _localvideo = option.localVideo;

        var options = {
            localVideo: _localvideo,
            onicecandidate: this.onIceCandidate
        };

        localWebRtc = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) return onError(error);

            this.generateOffer(function (error, offerSdp) {
                if (error) return console.warn('error: ', error);

                sendMessage({
                    evName: 'present',
                    option: {
                        sdpOffer: offerSdp
                    }
                });
            });
        });
    },
    /**
     *
     * @param option
     */
    startView: function (option) {

    },
    /**
     *
     * @param candidate
     */
    onIceCandidate: function (candidate) {
        sendMessage({
            evName: 'onIceCandidate',
            option: {
                candidate: candidate,
            }
        });
    },
    /**
     *
     * @param msg
     */
    errorAnswer: function (msg) {
        return console.error('An error ' + msg.evName + ' : ', msg.error);
    },
    /**
     *
     * @param msg
     */
    presentSdpAnswer: function (msg) {
        localWebRtc.processAnswer(msg.sdpAnswer);
    },
    /**
     *
     * @param msg
     */
    viewSdpAnswer: function (msg) {

    },
    /**
     *
     * @param msg
     */
    presentAnswerIceCandidate: function (msg) {
        localWebRtc.addIceCandidate(msg.candidate);
    },
    /**
     *
     * @param msg
     */
    viewAnswerIceCandidate: function (msg) {

    },
    /**
     *
     * @param msg
     */
    coming: function (msg) {

    },
    /**
     *
     * @param msg
     */
    leaving: function (msg) {

    }

};