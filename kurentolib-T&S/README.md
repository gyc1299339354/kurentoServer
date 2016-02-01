#2016/1/29 split from pre version and just intend to solve Teacher&Student biz....here we go ~~

#2016/1/30 re-think of the framework, divide the bizes and basic kurento functions :
            bizes: 
                    classes: 
                                class begin
                                class over
                                
                    student:
                                user login
                                user logout
                                join the class
                                check the teacher
                                notify teacher&monitor&monitorhelper
                                
                    teacher:
                                user login
                                user logout
                                join the class
                                check the student
                                notify student&monitor&monitorhelper
                                                                
                    monitor:
                                user login
                                user logout
                                join the class
                                check the student&teacher
                                
                    monitor helper:
                                user login
                                user logout
                                join the class
                                check the student&teacher
                                
            kurento functions: 
            
                    create kurento client:  createKurentoClient( wsuri, [option,] callback )
                    
                    create kurento pipeline: createKurentoPipeline( kurentoClient, callback )
                    
                    create kurento webrtcendpoit:　createKurentoWebRtcEndpoint( pipeline, callback )
                    
                    create kurento rtcEndpoint: createKurentoRtcEndpoint( pipeline, callback )
                    
                    endpoint generate offer: endPointGenerateOffer( endpoint, callback )
                    
                    endpoint process offer: endPointProcessOffer( endpoint, sdpOffer, callback )
                    
                    endpoint process answer: endpointPrecessAnswer( endpoint, sdpAnswer, callback )
                    
                    webrtcendpoint add ice candidate: webRtcEndpointAddIceCandidate( webRtcEndpoint, candidate )
                    
                    webrtcendpoint gather candidates: webRtcEndpointGatherCandidates( webRtcEndpoint, callback )
                    
                    add candidate to the 'role' candidate queue: addToIceCandidateQueueByRole( role, sessionId, candidate )
                    
                    connect two cendpoints in same node : connectEndpointsSameNode( caller, callee, callback )
                    
                    connect two cendpoints with different nodes : connectEndpointsDiffNode( caller, callee, callback )
                    
                    
                    
                    
                    
                    