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
        this.socket.send(JSON.stringify(payload));
        
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

    }

});
