var voxBoard = {
    socket: null,
    /* send an event to the server */
    /*
     * 1 - Incoming call
     * 2 - Dialing
     * 3 - Connected
     * 4 - Hold
     * 9 - Terminated	
     *
     */
    sendEvent: function(peer, eventId, line) {
        var payload = { 'event' : eventId, 
                        'line': line, 
                        'peer': peer
                      };
        if(this.socket != null) {
            this.socket.send(JSON.stringify(payload));
        }
        
    },
    sendActivity: function() {

    }

}

$(function() {
    var appUrl = "";

    if(window.location.protocol === 'http:')
        appUrl = "ws://" + window.location.host + "/vox/board/";
    else
        appUrl = "wss://" + window.location.host + "/vox/board/";

    var voxSocket = new WebSocket(appUrl);
    voxSocket.onopen = function() {
        console.log("Vox Socket connected");
        voxBoard.socket = voxSocket;
    }

    // implement message handler
    voxSocket.onmessage = function(e) {
        var message = $.parseJSON(e.data);
        console.log(message);
        if (message.code == 10) {
            if (message.status == 1) {
                $('.lsbrowser .agents').find(`[data-id='${message.user}']`).find('.actions').find('.btn-call').addClass('busy');
            } else {
                $('.lsbrowser .agents').find(`[data-id='${message.user}']`).find('.actions').find('.btn-call').removeClass('busy');
            }
        }

    }

});
