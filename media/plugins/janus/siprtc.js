var server = null;
if(window.location.protocol === 'http:')
    server = "http://" + window.location.hostname + ":8088/janus";
else
    server = "https://" + window.location.hostname + ":8089/janus";

var janus = null;
var sipcall = null;
var opaqueId = "siptest-"+Janus.randomString(12);

var started = false;
var spinner = null;

var selectedApproach = null;
var registered = false;

var incoming = null;
var localJsep = null;


VoxPhone.calls = [];

VoxPhone.dial = function(calleeName, calleeNumber, calleePic) {
    $('.vox-container').find('.peer-image > img').attr('src', calleePic);
    $('.vox-container').find('.peer-name > span').html(calleeName);
    $('.vox-container').find('.peer-number > span').html(calleeNumber);
    $('.vox-modal').removeClass('hide');
}
VoxPhone.ringing = function() {
    
}
VoxPhone.incoming = function(callerNumber) {
    $('<audio id="chatAudio"> <source src="/media/audio/iphone.mp3" type="audio/mpeg"></audio>').appendTo('body');
    $('#chatAudio')[0].play();

    $('.vox-container').find('.peer-number > span').html(callerNumber);
    $('.vox-modal').removeClass('hide');
}
VoxPhone.connected = function() {
    alert('connected');

    if($('#chatAudio').length > 0) {
        $('#chatAudio')[0].pause();
        $('#chatAudio').remove();
    }
    $('.vox-container').find('.sp-actions .btn-action').removeClass('disabled');
    $('.vox-container').find('.sp-footer .btn-action').removeClass('disabled');
    // $('.vox-container').find('.sp-actions .btn-action.transfer').removeClass('disabled');
}
VoxPhone.hold = function() {
    
}
VoxPhone.transfer = function() {

}

VoxPhone.hangUp = function() {
    $('.vox-container').find('.peer-image > img').attr('src', '');
    $('.vox-container').find('.peer-name > span').html('');
    $('.vox-container').find('.peer-number > span').html('');
    $('.vox-modal').addClass('hide');

    if($('#chatAudio').length > 0) {
        $('#chatAudio')[0].pause();
        $('#chatAudio').remove();
    }
}



function VoxPhone() {
    console.log("vox phone initialized");
};

$(document).ready(function() {

    // Initialize the library (all console debuggers enabled)
    Janus.init({debug: "all", callback: function() {

        if(started) {
            return;
        }
        started = true;
        if(!Janus.isWebrtcSupported()) {
            console.log("No WebRTC support... ");
            return;
        }
        console.log("Webrtc supported")
        // Create session
        janus = new Janus({
                    server: server,
                    success: function() {
                        // Attach to sip plugin
                        janus.attach({
                            plugin: "janus.plugin.sip",
                            opaqueId: opaqueId,
                            success: function(pluginHandle) {
                                sipcall = pluginHandle;
                                Janus.log("Plugin attached! (" + sipcall.getPlugin() + ", id=" + sipcall.getId() + ")");
                                registerUser();

                            },
                            error: function(error) {
                                Janus.error("  -- Error attaching plugin...", error);
                            },
                            consentDialog: function(on) {
                                Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                                if(on) {
                                    $.blockUI({
                                            message: '<div><img src="up_arrow.png"/></div>',
                                            css: {
                                                border: 'none',
                                                padding: '15px',
                                                backgroundColor: 'transparent',
                                                color: '#aaa',
                                                top: '10px',
                                                left: (navigator.mozGetUserMedia ? '-100px' : '300px')
                                            } });
                                } else {
                                    // Restore screen
                                    $.unblockUI();       
                                }

                            },
                            onmessage: function(msg, jsep) {
                                Janus.debug(" ::: Got a message :::");
                                Janus.debug(msg);
                                console.log("message recieed");
                                console.log(msg);
                                var error = msg["error"]; 

                                if(error != null && error != undefined) {
                                     console.log("Server error !! shuting down")
                                     if(!registered) {

                                     } else {
                                         console.log("Before Hangup ");
                                         sipcall.hangup();
                                     }
                                     return;
                                } 
                                var result = msg["result"];
                                if(result !== null && result !== undefined && result["event"] !== undefined && result["event"] !== null) {

                                    var event = result["event"];
                                    if(event === 'registration_failed') {
                                        Janus.warn("Registration failed: " + result["code"] + " " + result["reason"]);
                                        return;
                                    } 
                                    if(event === 'registered') {
                                        Janus.log("Successfully registered as " + result["username"] + "!");
                                        if(!registered) {
                                            registered = true;
                                        }
                                    } else if(event === 'calling') {
                                        Janus.log("Waiting for the peer to answer...");
                                        
                                    } else if(event === 'incomingcall') {
                                        Janus.log("Incoming call from " + result["username"] + "!");
                                        VoxPhone.incoming(result["username"]);
                                        var doAudio = true, doVideo = true;
                                        var offerlessInvite = false;
                                        if(jsep !== null && jsep !== undefined) {
                                            doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                            doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                                            Janus.debug("Audio " + (doAudio ? "has" : "has NOT") + " been negotiated");
                                            Janus.debug("Video " + (doVideo ? "has" : "has NOT") + " been negotiated");
                                        } else {
                                            Janus.log("This call doesn't contain an offer... we'll need to provide one ourselves");
                                            offerlessInvite = true;
                                            doVideo = false;
                                        }
                                        // Any security offered? A missing "srtp" attribute means plain RTP
                                        var rtpType = "";
                                        var srtp = result["srtp"];
                                        if(srtp === "sdes_optional")
                                            rtpType = " (SDES-SRTP offered)";
                                        else if(srtp === "sdes_mandatory")
                                            rtpType = " (SDES-SRTP mandatory)";
                                        var extra = "";
                                        if(offerlessInvite)
                                            extra = " (no SDP offer provided)"

                                        var sipcallAction = (offerlessInvite ? sipcall.createOffer : sipcall.createAnswer);
                                        sipcallAction({
                                            jsep: jsep,
                                            media: { audio: doAudio, video: doVideo },
                                            // trickle:false,
                                            success: function(jsep) {
                                                Janus.debug("Got SDP " + jsep.type + "! audio=" + doAudio + ", video=" + doVideo);
                                                Janus.debug(jsep);
                                                var body = { request: "accept", line: 0 };
                                                // Note: as with "call", you can add a "srtp" attribute to
                                                // negotiate/mandate SDES support for this incoming call.
                                                // The default behaviour is to automatically use it if
                                                // the caller negotiated it, but you may choose to require
                                                // SDES support by setting "srtp" to "sdes_mandatory", e.g.:
                                                //      var body = { request: "accept", srtp: "sdes_mandatory" };
                                                // This way you'll tell the plugin to accept the call, but ONLY
                                                // if SDES is available, and you don't want plain RTP. If it
                                                // is not available, you'll get an error (452) back.
                                                sipcall.send({"message": body, "jsep": jsep});
                                                localJsep = jsep;
                                            },
                                            error: function(error) {
                                                Janus.error("WebRTC error:", error);

                                                var body = { "request": "decline", "code": 480, "line": 0 };
                                                sipcall.send({"message": body});
                                                VoxPhone.hangUp();
                                            }

                                        });
                                                                                        
                                    } else if(event === 'accepting') {
                                        // Response to an offerless INVITE, let's wait for an 'accepted'
                                    } else if(event === 'progress') {
                                        Janus.log("There's early media from " + result["username"] + ", wairing for the call!");
                                        Janus.log(jsep);
                                        // Call can start already: handle the remote answer
                                        if(jsep !== null && jsep !== undefined) {
                                            console.log("Handling the remote JSEP");
                                            sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                        } else {
                                            console.log("Error, progress -- Handling the remote JSEP");

                                        }
                                    } else if(event === 'accepted') {
                                        Janus.log(result["username"] + " accepted the call!");
                                        Janus.log(jsep);
                                        // Call can start, now: handle the remote answer
                                        if(jsep !== null && jsep !== undefined) {
                                            console.log("Handling the remote Jsep ")
                                            sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                        } else {
                                            console.log("Error, accepted -- Handling the remote JSEP");

                                        }
                                        VoxPhone.connected();

                                    } else if(event === 'hangup') {
                                        Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                                        // Reset status
                                        sipcall.hangup();
                                        VoxPhone.hangUp();
                                    }

                                } 
                            },
                            onlocalstream: function(stream) {
                                Janus.debug(" ::: Got a local stream :::");
                                Janus.debug(stream);
                            },
                            onremotestream: function(stream) {
                                Janus.debug(" ::: Got a remote stream :::");
                                Janus.debug(stream);
                            },
                            oncleanup: function() {
                                Janus.log(" ::: Got a cleanup notification :::");
                            }
                            

                        });

                   },
                   error: function(error) {
                        Janus.error(error);
                    },
                    destroyed: function() {
                        // window.location.reload();
                    }
               });

    }});

    $('body').on('click', '.klip .card-action', function() {
        var user = $(this).closest('.klip-card.agent');

        var pic = user.data('pic');
        var name = user.data('name');
        var extn = user.data('extn');
        var server = user.data('server');

        VoxPhone.dial(name, extn, pic, server);
        var callee = 'sip:'+extn+'@'+server;
        makeCall(callee);
         
        
    });

    $('body').on('click', '.vox-container .hangup', function() {
        endCall();        
        VoxPhone.hangUp();
    });

    $('body').on('click', '.vox-container .hold', function() {
        holdCall();
        VoxPhone.hold();
    });

    $('body').on('click', '.vox-container .transfer', function() {
        alert('transfer'); 

        var target = 'sip:3000@'+vox_server;
        transferCall(target);
        VoxPhone.transfer();

    });

    $('body').on('click', '.vox-container .reinvite', function() {
        alert('multi line');

        var target = 'sip:3000@'+vox_server;
        makeCall(target);

    });

    $('body').on('click', '.vox-container .attended-transfer', function() {
        alert('attended transfer');

        var transfereeLine = 0;
        var targetLine = 1;
        attendedTransfer(transfereeLine, targetLine);

    });

});


function registerUser() {
    // Let's see if the user provided a server address
    //      NOTE WELL! Even though the attribute we set in the request is called "proxy",
    //      this is actually the _registrar_. If you want to set an outbound proxy (for this
    //      REGISTER request and for all INVITEs that will follow), you'll need to set the
    //      "outbound_proxy" property in the request instead. The two are of course not
    //      mutually exclusive. If you set neither, the domain part of the user identity
    //      will be used as the target of the REGISTER request the plugin might send.
    var sipserver = 'sip:'+vox_server+':5060';
    if(sipserver !== "" && sipserver.indexOf("sip:") != 0 && sipserver.indexOf("sips:") !=0) {
        return;
    }
    var username = 'sip:'+vox_extn+'@'+vox_server;
    if(username === "" || username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
       return;
    } 
    var password = 'abcd';
    var register = {
        "request" : "register",
        "username" : username
    };
    register["secret"] = vox_pswd;
    var authuser = vox_account;
    if(authuser !== "") {
        register.authuser = authuser;
    }
    var displayname = agentName;
    if(displayname !== "") {
        register.display_name = displayname;
    }

    if(sipserver === "") {
        sipcall.send({"message": register});
    } else {
        register["proxy"] = sipserver;
        // Uncomment this if you want to see an outbound proxy too
        //~ register["outbound_proxy"] = "sip:outbound.example.com";
        sipcall.send({"message": register});
    }
    
}

function makeCall(user) {
    // Call someone
    if(user === "") {
        console.log('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
        return;
    }
    if(user.indexOf("sip:") != 0 || user.indexOf("@") < 0) {
        console.log('Please insert a valid SIP address (e.g., sip:pluto@example.com)');
        return;
    }

    if(localJsep != null) {
        alert("jsep not null");
        var body = { request: "call", uri: user };
        sipcall.send({"message": body, "jsep": localJsep});
        return;
    }

    // Call this URI
    sipcall.createOffer(
        {
            // trickle:false,
            media: {
                audioSend: true, audioRecv: true,       // We DO want audio
                videoSend: false, videoRecv: false  // We MAY want video
            },
            success: function(jsep) {
                Janus.debug("Got SDP!");
                Janus.debug(jsep);
                // By default, you only pass the SIP URI to call as an
                // argument to a "call" request. Should you want the
                // SIP stack to add some custom headers to the INVITE,
                // you can do so by adding an additional "headers" object,
                // containing each of the headers as key-value, e.g.:
                //      var body = { request: "call", uri: $('#peer').val(),
                //          headers: {
                //              "My-Header": "value",
                //              "AnotherHeader": "another string"
                //          }
                //      };
                var body = { request: "call", uri: user };
                // Note: you can also ask the plugin to negotiate SDES-SRTP, instead of the
                // default plain RTP, by adding a "srtp" attribute to the request. Valid
                // values are "sdes_optional" and "sdes_mandatory", e.g.:
                //      var body = { request: "call", uri: $('#peer').val(), srtp: "sdes_optional" };
                // "sdes_optional" will negotiate RTP/AVP and add a crypto line,
                // "sdes_mandatory" will set the protocol to RTP/SAVP instead.
                // Just beware that some endpoints will NOT accept an INVITE
                // with a crypto line in it if the protocol is not RTP/SAVP,
                // so if you want SDES use "sdes_optional" with care.
                // jsep['trickle'] = false; 
                // store the jsep.
                sipcall.send({"message": body, "jsep": jsep});
                localJsep = jsep;
            },
            error: function(error) {
                Janus.error("WebRTC error...", error);
                console.log("WebRTC error... " + JSON.stringify(error));
            }
        });
}


function endCall() {
    // Hangup a call
    var hangup = { "request": "hangup", "line": 0};
    sipcall.send({"message": hangup});
    sipcall.hangup();
}

function holdCall() {
    // Hangup a call
    var msg = { "request": "hold", "line": 0};
    sipcall.send({"message": msg});
}

function transferCall(target) {
    // Hangup a call
    var msg = { "request": "transfer", "target": target};
    sipcall.send({"message": msg});
}

function attendedTransfer(transferee, target) {
    var msg = { "request": "transfer", "mode": 2, "line": 0, "target_line": 1};
    sipcall.send({"message": msg});

}
