/*
 * Janus interface 
 */
var server = null;
if(window.location.protocol === 'http:')
    server = "http://139.162.57.32:8088/janus";
else
    server = "https://" + window.location.hostname + ":8089/janus";

var janus = null;
var sipcall = null;
var opaqueId = "siptest-"+Janus.randomString(12);

var started = false;
var spinner = null;

var selectedApproach = null;
ar registered = false;

var incoming = null;
var localJsep = null;
var hold = false;

var calls = [];
var in_call = false;


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
            bootbox.alert("No WebRTC support... ");
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
                        bootbox.alert("  -- Error attaching plugin... " + error);
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
                            bootbox.alert(error);
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
                                bootbox.alert(result["code"] + " " + result["reason"]);
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
                                $('#call').removeAttr('disabled').html('Hangup')
                                          .removeClass("btn-success").addClass("btn-danger")
                                          .unbind('click').click(doHangup);
                            } else if(event === 'incomingcall') {
                                Janus.log("Incoming call from " + result["username"] + "!");
                                VoxPhone.incoming(result["username"], result['line']);
                                var doAudio = true, doVideo = false;
                                var offerlessInvite = false;
                                if(jsep !== null && jsep !== undefined) {
                                    // What has been negotiated?
                                    doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                    doVideo = (jsep.sdp.indexOf("m=video ") > -1);
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
                                                $('#peer').val(result["username"]).attr('disabled', true);
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
                                                        $('#call').removeAttr('disabled').html('Hangup')
                                                                  .removeClass("btn-success").addClass("btn-danger")
                                                                  .unbind('click').click(doHangup);
                                                    },
                                                    error: function(error) {
                                                        Janus.error("WebRTC error:", error);
                                                        bootbox.alert("WebRTC error... " + JSON.stringify(error));
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
                                    sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                }
                                toastr.success("Call accepted!");
                                VoxPhone.connected(result['line']);
                                in_call = true;
                            } else if(event === 'media_update') {
                                console.log("Media Update");
                                sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                            } else if(event === 'hangup') {
                                if(incoming != null) {
                                    incoming.modal('hide');
                                    incoming = null;
                                }
                                Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!");
                                bootbox.alert(result["code"] + " " + result["reason"]);
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
                        $('#videos').removeClass('hide').show();
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
                            $('#myvideo').hide();
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
                                    $('#remotevideo').show();
                            }
                            return;
                        }
                        $('#videoright').parent().find('h3').html(
                                        'Send DTMF: <span id="dtmf" class="btn-group btn-group-xs"></span>');
                        $('#videoright').append(
                                        '<video class="rounded centered hide" id="remotevideo" width=320 height=240 autoplay/>');
                        for(var i=0; i<12; i++) {
                            if(i<10)
                                $('#dtmf').append('<button class="btn btn-info dtmf">' + i + '</button>');
                            else if(i == 10)
                                $('#dtmf').append('<button class="btn btn-info dtmf">#</button>');
                            else if(i == 11)
                                $('#dtmf').append('<button class="btn btn-info dtmf">*</button>');
                        }
                        $('.dtmf').click(function() {
                            if(Janus.webRTCAdapter.browserDetails.browser === 'chrome') {
                                // Send DTMF tone (inband)
                                sipcall.dtmf({dtmf: { tones: $(this).text()}});
                            } else {
                                // Try sending the DTMF tone using SIP INFO
                                sipcall.send({message: {request: "dtmf_info", digit: $(this).text()}});
                            }
                        });
                        // Show the peer and hide the spinner when we get a playing event
                        $("#remotevideo").bind("playing", function () {
                            $('#waitingvideo').remove();
                            if(this.videoWidth)
                                $('#remotevideo').removeClass('hide').show();
                            if(spinner !== null && spinner !== undefined)
                                spinner.stop();
                            spinner = null;
                        });
                        Janus.attachMediaStream($('#remotevideo').get(0), stream);
                        var videoTracks = stream.getVideoTracks();
                        if(videoTracks === null || videoTracks === undefined || videoTracks.length === 0 || videoTracks[0].muted) {
                            // No remote video
                            $('#remotevideo').hide();
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
                bootbox.alert(error, function() {
                    window.location.reload();
                });
            },
            destroyed: function() {
                window.location.reload();
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
        doCall(callee);

    });

    $('body').on('click', '.vox-container .hangup', function() {
        endCall();
    });

    $('body').on('click', '.vox-container .hold', function() {
        holdCall();
        VoxPhone.hold();
    });

    $('body').on('click', '.vox-container .transfer', function() {
        var target = 'sip:44012345230@'+vox_server;
        // var target = 'sip:44012345111@'+vox_server;
        transferCall(target);
        VoxPhone.transfer();

    });

    $('body').on('click', '.vox-container .reinvite', function() {

        var target = 'sip:44012345230@'+vox_server;
        // var target = 'sip:44012345111@'+vox_server;
        doCall(target);

    });


    $('body').on('click', '.vox-container .attended-transfer', function() {

        var transfereeLine = 0;
        var targetLine = 1;
        attendedTransfer(transfereeLine, targetLine);

    });

});







