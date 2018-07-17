/*
 * Janus interface
 */
var server = null;
if(window.location.protocol === 'http:')
    server = "http://"+window.location.hostname+":8088/janus";
else
    server = "https://"+window.location.hostname+":8089/janus";

var janus = null;
var sipcall = null;
var opaqueId = "siptest-"+Janus.randomString(12);

var started = false;
var spinner = null;

var selectedApproach = null;
var registered = false;

var incoming = null;
var localJsep = null;
var hold = false;

var calls = [];
var active_calls = [];

var in_call = false;

VoxPhone.dial = function(peer) {
    voxBoard.sendEvent(peer, 2, calls.length);
    return calls.length; 
}
VoxPhone.progress = function(line) {

}
VoxPhone.incoming = function(callerNumber, line) {
    $('<audio id="chatAudio"> <source src="/media/audio/iphone.mp3" type="audio/mpeg"></audio>').appendTo('body');
    $('#chatAudio')[0].play();
    $('.vox-container').find('.peer-number > span').html(callerNumber);
    $('.vox-modal').removeClass('hide');
    voxBoard.sendEvent(callerNumber, 1, line); 

}
VoxPhone.connected = function(line) {

    if($('#chatAudio').length > 0) {
        $('#chatAudio')[0].pause();
        $('#chatAudio').remove();
    }

    // $('.vox-container').find('.sp-actions .btn-action.transfer').removeClass('disabled');
    console.log("Recieved Connect Notification");
    $('.tribe-pad').find('.action-item.audio').addClass('connected');
    calls.push(line);
    active_calls.push(line);
    voxBoard.sendEvent("", 3, line);
}

VoxPhone.hold = function(line) {
    active_calls = jQuery.grep(active_calls, function(value) {
        return value != line;
    });
}
VoxPhone.unHold = function(line) {
    active_calls.push(line);
}

VoxPhone.transfer = function(line) {

}

VoxPhone.hangUp = function(line) {
    calls = jQuery.grep(calls, function(value) {
        return value != line;
    });
    active_calls = jQuery.grep(active_calls, function(value) {
        return value != line;
    });
    
    if($('#chatAudio').length > 0) {
        $('#chatAudio')[0].pause();
        $('#chatAudio').remove();
    }
    voxBoard.sendEvent("", 9, line);

    console.log(calls);
    if(calls.length > 0)
        return;

    $('#callList').find('.active-call').addClass('d-none');
    $('#callList').find('.inactive-calls').addClass('d-none');


}

function VoxPhone() {
    console.log("vox phone initialized");
}

$(document).ready(function() {
    // Initialize the library (all console debuggers enabled)
    Janus.init({debug: "all", callback: function() {
        // Use a button to start the demo
        if(started)
            return;

        started = true;
        $(this).attr('disabled', true).unbind('click');
        // Make sure the browser supports WebRTC
        if(!Janus.isWebrtcSupported()) {
            // bootbox.alert("No WebRTC support... ");
            return;
        }
        janus = new Janus({
            server: server,
            success: function() {
                // Attach to echo test plugin
                janus.attach({
                    plugin: "janus.plugin.sip",
                    opaqueId: opaqueId,
                    success: function(pluginHandle) {
                        $('#details').remove();
                        sipcall = pluginHandle;
                        Janus.log("Plugin attached! (" + sipcall.getPlugin() + ", id=" + sipcall.getId() + ")");
                        // Prepare the username registration
                        registerUser();
                    },
                    error: function(error) {
                        Janus.error("  -- Error attaching plugin...", error);
                        // bootbox.alert("  -- Error attaching plugin... " + error);
                    },
                    consentDialog: function(on) {
                        Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now");
                        if(on) {
                            // Darken screen and show hint
                            $.blockUI({
                                message: '<div><img src="up_arrow.png"/></div>',
                                css: {
                                    border: 'none',
                                    padding: '15px',
                                    backgroundColor: 'transparent',
                                    color: '#aaa',
                                    top: '10px',
                                    left: (navigator.mozGetUserMedia ? '-100px' : '300px')
                                }
                            });
                        } else {
                            // Restore screen
                            $.unblockUI();
                        }
                    },
                    onmessage: function(msg, jsep) {
                        Janus.debug(" ::: Got a message :::");
                        Janus.debug(msg);
                        // Any error?
                        var error = msg["error"];
                        if(error != null && error != undefined) {
                            if(!registered) {
                                // TBD: Set status offline
                            } else {
                                if(calls.length == 0 ) {
                                    // Reset status
                                    sipcall.hangup();
                                    $('#dovideo').removeAttr('disabled').val('');
                                    $('#peer').removeAttr('disabled').val('');
                                    localJsep = null;
                                }
                            }
                            // bootbox.alert(error);
                            return;
                        }
                        var result = msg["result"];
                        if(result !== null && result !== undefined && result["event"] !== undefined && result["event"] !== null) {
                            var event = result["event"];
                            if(event === 'registration_failed') {
                                Janus.warn("Registration failed: " + result["code"] + " " + result["reason"]);
                                $('#server').removeAttr('disabled');
                                $('#username').removeAttr('disabled');
                                $('#authuser').removeAttr('disabled');
                                $('#displayname').removeAttr('disabled');
                                $('#password').removeAttr('disabled');
                                $('#register').removeAttr('disabled').click(registerUsername);
                                $('#registerset').removeAttr('disabled');
                                // bootbox.alert(result["code"] + " " + result["reason"]);
                                return;
                            }
                            if(event === 'registered') {
                                Janus.log("Successfully registered as " + result["username"] + "!");
                                $('#you').removeClass('hide').show().text("Registered as '" + result["username"] + "'");
                                // TODO Enable buttons to call now
                                if(!registered) {
                                    registered = true;
                                    $('#phone').removeClass('hide').show();
                                    $('#peer').focus();
                                }
                            } else if(event === 'calling') {
                                Janus.log("Waiting for the peer to answer...");
                                // TODO Any ringtone?
                            } else if(event === 'incomingcall') {
                                Janus.log("Incoming call from " + result["username"] + "!");
                                VoxPhone.incoming(result["username"], result['line']);
                                var doAudio = true, doVideo = false;
                                var offerlessInvite = false;
                                if(jsep !== null && jsep !== undefined) {
                                    // What has been negotiated?
                                    doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                    // doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                                    Janus.debug("Audio " + (doAudio ? "has" : "has NOT") + " been negotiated");
                                    Janus.debug("Video " + (doVideo ? "has" : "has NOT") + " been negotiated");
                                } else {
                                    Janus.log("This call doesn't contain an offer... we'll need to provide one ourselves");
                                    offerlessInvite = true;
                                    // In case you want to offer video when reacting to an offerless call, set this to true
                                    doVideo = false;
                                }
                                // Any security offered? A missing "srtp" attribute means plain RTP
                                var rtpType = "";
                                var srtp = result["srtp"];
                                if(srtp === "sdes_optional")
                                    rtpType = " (SDES-SRTP offered)";
                                else if(srtp === "sdes_mandatory")
                                    rtpType = " (SDES-SRTP mandatory)";
                                // Notify user
                                bootbox.hideAll();
                                var extra = "";
                                if(offerlessInvite)
                                    extra = " (no SDP offer provided)"

                                incoming = bootbox.dialog({
                                    message: "Incoming call from " + result["username"] + "!" + rtpType + extra,
                                    title: "Incoming call",
                                    closeButton: false,
                                    buttons: {
                                        success: {
                                            label: "Answer",
                                            className: "btn-success",
                                            callback: function() {
                                                incoming = null;
                                                if (doVideo) {
                                                    $('.tribe-pad').find('.col-messages').addClass('d-none')
                                                                                         .siblings('.col-videos').removeClass('d-none'); 
                                                }
                                                if(active_calls.length > 0) {
                                                    triggerHold();
                                                }
                                                var lineId = result['line'];
                                                $('#callList').find('.active-call').data('line',lineId);
                                                $('#callList').find('.active-call').removeClass('d-none')
                                                                                   .find('.number').text(result["username"]);

                                                console.log(jsep); 
                                                console.log("Incoming call accepted");
                                                // Notice that we can only answer if we got an offer: if this was
                                                // an offerless call, we'll need to create an offer ourselves
                                                var sipcallAction = (offerlessInvite ? sipcall.createOffer : sipcall.createAnswer);
                                                sipcallAction({
                                                    jsep: jsep,
                                                    media: { audio: doAudio, video: doVideo },
                                                    success: function(jsep) {
                                                        Janus.debug("Got SDP " + jsep.type + "! audio=" + doAudio + ", video=" + doVideo);
                                                        Janus.debug(jsep);
                                                        var body = { request: "accept" };
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
                                                    },
                                                    error: function(error) {
                                                        console.log("Error - hangup the call");
                                                        Janus.error("WebRTC error:", error);
                                                        // bootbox.alert("WebRTC error... " + JSON.stringify(error));
                                                        // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
                                                        var body = { "request": "decline", "code": 480 };
                                                            sipcall.send({"message": body});
                                                            VoxPhone.hangUp(result['line']);
                                                    }
                                                });
                                            }
                                        },
                                        danger: {
                                            label: "Decline",
                                            className: "btn-danger",
                                            callback: function() {
                                                incoming = null;
                                                var body = { "request": "decline" };
                                                sipcall.send({"message": body});
                                            }
                                        }
                                    }
                                });
                            } else if(event === 'accepting') {
                                // Response to an offerless INVITE, let's wait for an 'accepted'
                            } else if(event === 'progress') {
                                Janus.log("There's early media from " + result["username"] + ", wairing for the call!");
                                Janus.log(jsep);
                                // Call can start already: handle the remote answer
                                if(jsep !== null && jsep !== undefined && !in_call) {
                                    sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                }
                                toastr.info("Early media...");
                                VoxPhone.progress(result['line']);
                            } else if(event === 'accepted') {
                                Janus.log(result["username"] + " accepted the call!");
                                Janus.log(jsep);
                                // Call can start, now: handle the remote answer
                                if(jsep !== null && jsep !== undefined && !in_call) {
                                    console.log("Inside Remote jsep");
                                    sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                }
                                toastr.success("Call accepted!");
                                VoxPhone.connected(result['line']);
                                in_call = true;
                            } else if(event === 'media_update') {
                                console.log("Media Update");
                                sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                            } else if(event === 'hangup') {
                                console.log("Incoming event - hangup the call");
                                if(incoming != null) {
                                    incoming.modal('hide');
                                    incoming = null;
                                }
                                Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                                // bootbox.alert(result["code"] + " " + result["reason"]);
                                VoxPhone.hangUp(result['line']);
                                if(calls.length == 0 ) {
                                    // Reset status
                                    sipcall.hangup();
                                    $('#dovideo').removeAttr('disabled').val('');
                                    $('#peer').removeAttr('disabled').val('');
                                    in_call = false;
                                    localJsep = null;
                                }
                            }
                        }
                    },
                    onlocalstream: function(stream) {
                        Janus.debug(" ::: Got a local stream :::");
                        Janus.debug(stream);
                        $('#videos').removeClass('d-none').show();
                        // check if video container is already present or not
                        if($('#myvideo').length === 0)
                            $('#videoleft').append('<video class="rounded centered" id="myvideo" width=320 height=240 autoplay muted="muted"/>');
                        Janus.attachMediaStream($('#myvideo').get(0), stream);
                        $("#myvideo").get(0).muted = "muted";
                        // No remote video yet
                        $('#videoright').append('<video class="rounded centered" id="waitingvideo" width=320 height=240 />');
                        if(spinner == null) {
                            var target = document.getElementById('videoright');
                            spinner = new Spinner({top:100}).spin(target);
                        } else {
                            spinner.spin();
                        }
                        var videoTracks = stream.getVideoTracks();
                        if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                            // No webcam
                            $('#myvideo').addClass('d-none');
                            $('#videoleft').append('<div class="no-video-container">' +
                                                   '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                                                   '<span class="no-video-text">No webcam available</span>' +
                                                   '</div>');
                        }
                    },
                    onremotestream: function(stream) {
                        Janus.debug(" ::: Got a remote stream :::");
                        Janus.debug(stream);
                        if($('#remotevideo').length > 0) {
                            // Been here already: let's see if anything changed
                            var videoTracks = stream.getVideoTracks();
                            if(videoTracks && videoTracks.length > 0 && !videoTracks[0].muted) {
                                $('#novideo').remove();
                                if($("#remotevideo").get(0).videoWidth)
                                    $('#remotevideo').removeClass('d-none');
                            }
                            return;
                        }
                        $('#videoright').parent().find('h3').html(
                                        'Send DTMF: <span id="dtmf" class="btn-group btn-group-xs"></span>');
                        $('#videoright').append(
                                        '<video class="rounded centered d-none" id="remotevideo" width=320 height=240 autoplay/>');
                        // Show the peer and hide the spinner when we get a playing event
                        $("#remotevideo").bind("playing", function () {
                            $('#waitingvideo').remove();
                            if(this.videoWidth)
                                $('#remotevideo').removeClass('d-none').show();
                            if(spinner !== null && spinner !== undefined)
                                spinner.stop();
                            spinner = null;
                        });
                        Janus.attachMediaStream($('#remotevideo').get(0), stream);
                        var videoTracks = stream.getVideoTracks();
                        if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0 || videoTracks[0].muted) {
                            // No remote video
                            $('#remotevideo').addClass('d-none');
                            $('#videoright').append('<div id="novideo" class="no-video-container">' +
                                                    '<i class="fa fa-video-camera fa-5 no-video-icon"></i>' +
                                                    '<span class="no-video-text">No remote video available</span>' +
                                                    '</div>');
                        }
                    },
                    oncleanup: function() {
                        Janus.log(" ::: Got a cleanup notification :::");
                        $('#myvideo').remove();
                        $('#waitingvideo').remove();
                        $('#remotevideo').remove();
                        $('.no-video-container').remove();
                        $('#videos').hide();
                        $('#dtmf').parent().html("Remote UA");
                    }
                });
            },
            error: function(error) {
                Janus.error(error);
                /*
                bootbox.alert(error, function() {
                    window.location.reload();
                });
                */
            },
            destroyed: function() {
                window.location.reload();
            }

        });
    }});

    $('body').on('click', '.btn-dtmf', function() {
        var digit = $(this).data('value');
        if(Janus.webRTCAdapter.browserDetails.browser === 'chrome') {
            // Send DTMF tone (inband)
            sipcall.dtmf({dtmf: { tones: digit }});
        } else {
            // Try sending the DTMF tone using SIP INFO
            sipcall.send({message: {request: "dtmf_info", digit: digit}});
        }

        var existing = $(this).closest('.active-call').children('.scribe-item-heading').find('.digits').text();
        $(this).closest('.active-call').children('.scribe-item-heading').find('.digits').text(existing+digit);

    });

    $('body').on('click', '.btn-hold', function() {
        // send the hold request
        var lineId = $(this).closest('.active-call').data('line');
        var callId = $(this).closest('.active-call').find('.number').text();
        console.log("Hold: "+lineId);
        holdCall(Number(lineId));
        VoxPhone.hold(Number(lineId));

        var inactiveCont = $(this).closest('#callList').find('.inactive-calls');
        var card = inactiveCont.find('.call-card:first-child').clone();
        card.removeClass('d-none')
            .data('line', lineId)
            .find('.callid').text(callId);
        inactiveCont.append(card);
        inactiveCont.removeClass('d-none');

        $(this).closest('.active-call').addClass('d-none')
                                       .data('line',"")
                                       .find('.number').text('');
    });

    $('body').on('click', '.btn-link.transfer', function() {
        var tranferTo = $(this).closest('.transfer-input').find('.editable').html(); 
        var voxServer = $('.lsmenu .user-panel').data('domain');
        var target = 'sip:'+tranferTo+'@'+voxServer;
        var lineId = $(this).closest('.active-call').data('line');
        console.log("Transfering the call to :-"+target); 
        transferCall(lineId, target);
        VoxPhone.transfer();
    });

    $('body').on('click', '.vox-container .reinvite', function() {
        var target = 'sip:44012345230@'+vox_server;
        // var target = 'sip:44012345111@'+vox_server;
        doCall(target, false);
    });

    $('body').on('click', '.vox-container .attended-transfer', function() {

        var transfereeLine = 0;
        var targetLine = 1;
        attendedTransfer(transfereeLine, targetLine);

    });

    $('body').on('click', '.tribe-pad .new-call', function() {
        var voxServer = $('.lsmenu .user-panel').data('domain');
        var isVideoCall = false;
        if ($(this).closest('.action-item').data('action') == 'video') {
            isVideoCall = true;
        }


        if($(this).closest('.action-item').hasClass('connected')) {
            endCall();
            $('.scribe-incall').addClass('d-none');

        } else {
            //var pic = user.data('pic');
            //var name = user.data('name');
            var extn = $(this).closest('.tribe-pad').data('extn');
            // VoxPhone.dial(name, extn, pic, server);
            var callee = 'sip:'+extn+'@'+voxServer;
            doCall(callee, isVideoCall);
            /*
            if(isVideoCall)
                $('.tribe-pad').find('.col-messages').addClass('d-none')
                                                     .siblings('.col-videos').removeClass('d-none');
            */
                                    
            $('#callList').find('.active-call').data('line','0')
                                               .removeClass('d-none')
                                               .find('.number').text(extn);
        }

    });

    /* Dialing from phone book */
    $('body').on('click', '#phBook .btn-call', function() {
         var number = $(this).closest('.media').data('extn');
         var vox_server = $('.lsmenu .user-panel').data('domain');
         var callee = 'sip:'+number+'@'+vox_server;
         var lineId = VoxPhone.dial(number);
         if(active_calls.length > 0) {
            return;
        }
        doCall(callee, false);
        $('#callList').find('.active-call').data('line',lineId);
        $('#callList').find('.active-call').removeClass('d-none')
                                           .find('.number').text(number);
    });
    /* Dialing from dialpad */
    $('body').on('click', '.dialer .btn-dial', function() {
        var number = $(this).closest('.dialer').find('.display').text();
        var vox_server = $('.lsmenu .user-panel').data('domain');  
        var callee = 'sip:'+number+'@'+vox_server;
        var lineId = VoxPhone.dial(number);

        if(active_calls.length > 0) {
            return;
        }
            
        doCall(callee, false);

        $('#callList').find('.active-call').data('line',lineId);
        $('#callList').find('.active-call').removeClass('d-none')
                                           .find('.number').text(number);

        $('.lsbrowser').find('.display').html('');
        $('.lsbrowser').find('.dialer').toggleClass('d-none');
        $('.lsbrowser').find('.phbook').toggleClass('d-none');
        $('.lsbrowser').find('.contacts').toggleClass('d-none');
        $('.lsbrowser').find('.contact-list').empty()
    });

    $('body').on('click', '.call-card .btn-hangup', function() {
        var obj = $(this).closest('.call-card');
        var lineId = obj.data('line');
        endCall(Number(lineId));
        obj.remove();
    });

    $('body').on('click', '.active-call .btn-hangup', function() {
        var activeObj = $(this).closest('.active-call');
        var lineId = activeObj.data('line');
        endCall(Number(lineId));
        activeObj.data('line', "")
                 .addClass('d-none');
    });

    $('body').on('click', '.btn-unhold', function() {
        var lineId = $(this).closest('.call-card').data('line'); 
        var callId = $(this).closest('.call-card').find('.callid').text();
        if(active_calls.length > 0) {
            bootbox.alert("Active call present")
            return;
        }
        unHoldCall(Number(lineId));
        VoxPhone.unHold(Number(lineId));
        $(this).closest('.inactive-calls').parent().find('.active-call').removeClass('d-none')
                                                                        .data('line', lineId)
                                                                        .find('.number').text(callId);
        $(this).closest('.call-card').remove();
         

    });

});


function triggerHold() {
    var lineId = $('#callList').find('.active-call').data('line');
    var callId = $('#callList').find('.active-call').find('.number').text();
    console.log("Hold: "+lineId);
    holdCall(Number(lineId));
    VoxPhone.hold(Number(lineId));

    var inactiveCont = $('#callList').find('.inactive-calls');
    var card = inactiveCont.find('.call-card:first-child').clone();
    card.removeClass('d-none')
        .data('line', lineId)
        .find('.callid').text(callId);
    inactiveCont.append(card);
    inactiveCont.removeClass('d-none');

    $('#callList').find('.active-call').addClass('d-none')
                                       .data('line',"")
                                       .find('.number').text('');
}

function registerUser() {
    // Let's see if the user provided a server address
    //      NOTE WELL! Even though the attribute we set in the request is called "proxy",
    //      this is actually the _registrar_. If you want to set an outbound proxy (for this
    //      REGISTER request and for all INVITEs that will follow), you'll need to set the
    //      "outbound_proxy" property in the request instead. The two are of course not
    //      mutually exclusive. If you set neither, the domain part of the user identity
    //      will be used as the target of the REGISTER request the plugin might send.
    var vox_extn = $('.lsmenu .user-panel').data('extn');
    var vox_account = $('.lsmenu .user-panel').attr('data-account');
    var vox_pswd = $('.lsmenu .user-panel').data('pswd');
    var vox_server = $('.lsmenu .user-panel').data('domain');
    var agentName = $('.lsmenu .user-panel').data('name');

    console.log(vox_extn);
    console.log(vox_server);

    var sipserver = 'sip:'+vox_server+':5060';
    if(sipserver !== "" && sipserver.indexOf("sip:") != 0 && sipserver.indexOf("sips:") !=0) {
        return;
    }
    var username = 'sip:'+vox_extn+'@'+vox_server;
    if(username === "" || username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
       return;
    }

    var register = {
        "request" : "register",
        "username" : username
    };
    register["secret"] = vox_pswd;
    var authuser = vox_account;
    if(authuser !== "") {
        register.authuser = authuser;
    }
    console.log(authuser);

    var displayname = agentName;
    if(displayname !== "") {
        register.display_name = displayname;
    }

    if(sipserver === "") {
        sipcall.send({"message": register});
    } else {
        register["proxy"] = sipserver;
        register["outbound_proxy"] = sipserver;
        // Uncomment this if you want to see an outbound proxy too
        //~ register["outbound_proxy"] = "sip:outbound.example.com";
        sipcall.send({"message": register});
    }
}

function doCall(callee, isVideoCall) {
    // Call someone
    var username = callee;
    if(username === "") {
        $('#peer').removeAttr('disabled');
        $('#dovideo').removeAttr('disabled');
        return;
    }
    if(username.indexOf("sip:") != 0 || username.indexOf("@") < 0) {
        $('#peer').removeAttr('disabled').val("");
        $('#dovideo').removeAttr('disabled').val("");
        return;
    }


    if(localJsep != null) {
        // alert("jsep not null");
        var body = { request: "call", uri: username };
        localJsep["dtls-reset"] = true;
        sipcall.send({"message": body, "jsep": localJsep});
        return;
    }
    // Call this URI
    Janus.log("This is a SIP " + (isVideoCall ? "video" : "audio") + " call (dovideo=" + isVideoCall + ")");
    sipcall.createOffer(
        {
            update: false,
            media: {
                audioSend: true, audioRecv: true,       // We DO want audio
                videoSend: isVideoCall, videoRecv: isVideoCall  // We MAY want video
            },
            success: function(jsep) {
                Janus.log("Got SDP!");
                Janus.log(jsep);
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
                var body = { request: "call", uri: username};
                // jsep["dtls-reset"] = true;
                // Note: you can also ask the plugin to negotiate SDES-SRTP, instead of the
                // default plain RTP, by adding a "srtp" attribute to the request. Valid
                // values are "sdes_optional" and "sdes_mandatory", e.g.:
                //      var body = { request: "call", uri: $('#peer').val(), srtp: "sdes_optional" };
                // "sdes_optional" will negotiate RTP/AVP and add a crypto line,
                // "sdes_mandatory" will set the protocol to RTP/SAVP instead.
                // Just beware that some endpoints will NOT accept an INVITE
                // with a crypto line in it if the protocol is not RTP/SAVP,
                // so if you want SDES use "sdes_optional" with care.
                sipcall.send({"message": body, "jsep": jsep});
                localJsep = jsep;
            },
            error: function(error) {
                Janus.error("WebRTC error...", error);
                // bootbox.alert("WebRTC error... " + JSON.stringify(error));
            }
        });
}

function doHangup() {
    console.log("Inside doHangup");
    VoxPhone.hangUp();
    // Hangup a call
    var hangup = { "request": "hangup","line": 0 };
    sipcall.send({"message": hangup});
    if(calls.length == 0) {
        sipcall.hangup();
        in_call = false;
        localJsep = null;
    }
}

function endCall(lineId) {
    console.log("Inside endcall");
    // Hangup a call
    VoxPhone.hangUp(lineId, 9);
    var hangup = { "request": "hangup", "line": lineId};
    sipcall.send({"message": hangup});
/*    if(calls.length == 0) {
        console.log("Before hangup");
        sipcall.hangup();
        in_call = false;
        localJsep = null;
    }
*/
}

function holdCall(lineId) {
    var msg = { "request": "hold", "line": lineId};
    sipcall.send({"message": msg});
}

function unHoldCall(lineId) {
    var msg = { "request": "unhold", "line": lineId};
    sipcall.send({"message": msg});
}

function transferCall(lineId, target) {
    // Hangup a call
    var msg = { "request": "transfer", "line": lineId, "target": target};
    sipcall.send({"message": msg});
}

function attendedTransfer(transferee, target) {
    var msg = { "request": "transfer", "mode": 2, "line": 0, "target_line": 1};
    sipcall.send({"message": msg});

}

