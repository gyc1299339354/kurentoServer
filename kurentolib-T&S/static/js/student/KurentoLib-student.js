/**
 * Created by Administrator on 2016/2/15.
 */
var _localvideo, _remotevideo, localWebRtc, remoteWebRtc;
var KurentoLib = {
    /**
     *  发布本地视频
     * @param option
     */
    startPresent: function (option) {
        if (!option || !option.localVideo) return console.warn('error: need option or option.localvideo');

        _localvideo = option.localVideo;

        var options = {
            localVideo: _localvideo,
            onicecandidate: function (candidate) {
                sendMessage({
                    evName: 'onIceCandidate',
                    option: {
                        candidate: candidate,
                    }
                });
            }
        };

        localWebRtc = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options, function (error) {
            if (error) return console.warn(error);

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
     *  获取远程视频
     * @param option
     */
    startView: function (option) {
        if (!option || !option.remoteVideo) return console.warn('error: need option or option.remoteVideo');

        _remotevideo = option.remoteVideo;
        var who = option.who;

        var options = {
            remoteVideo: _remotevideo,
            onicecandidate: function (candidate) {
                sendMessage({
                    evName: 'onCandidateForView',
                    option: {
                        candidate: candidate,
                        who: who
                    }
                });
            }
        };

        remoteWebRtc = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function (error) {
            if (error) return console.warn(error);

            this.generateOffer(function (error, sdpOffer) {
                sendMessage({
                    evName: 'view',
                    option: {
                        sdpOffer: sdpOffer,
                    }
                });
            });
        });

    },
    /**
     *  服务器返回错误
     * @param msg
     */
    errorAnswer: function (msg) {
        return console.error('An error ' + msg.evName + ' : ', msg.error);
    },
    /**
     *  发布视频返回的sdp
     * @param msg
     */
    presentSdpAnswer: function (msg) {
        localWebRtc.processAnswer(msg.sdpAnswer);
    },
    /**
     *  接收视频返回的sdp
     * @param msg
     */
    viewSdpAnswer: function (msg) {
        remoteWebRtc.processAnswer(msg.sdpAnswer);
    },
    /**
     *  发布视频返回的ice candidate
     * @param msg
     */
    presentAnswerIceCandidate: function (msg) {
        localWebRtc.addIceCandidate(msg.candidate);
    },
    /**
     *  接收视频返回的ice candidate
     * @param msg
     */
    viewAnswerIceCandidate: function (msg) {
        remoteWebRtc.addIceCandidate(msg.candidate);
    },
    /**
     *  新用户
     * @param msg
     */
    coming: function (msg) {
        var who = msg.who;
        this.startView({
            who: who,
            remoteVideo: document.getElementById('remotevideo')
        });
    },
    /**
     *  用户离开
     * @param msg
     */
    leaving: function (msg) {
        if (remoteWebRtc) {
            remoteWebRtc.dispose();
            remoteWebRtc = null;
        }
        if (_remotevideo) {
            _remotevideo.src = '';
            _remotevideo.style.background = '';
        }
    }

};