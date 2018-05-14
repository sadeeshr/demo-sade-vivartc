$(function() {
    console.log(window.location.host);
    socket = new WebSocket("ws://" + window.location.host + "/iris/tribe/");

    socket.onopen = function() {
        console.log("Web Socket connected");

    }


    socket.onmessage = function(e) {
       var message = $.parseJSON(e.data);
       console.log(message);

       var msgList = $('.message-list');
       var item = msgList.find('li:first').clone();
       item.find('.media-body .text').text("");
       item.find('.media-body .text').text(message.message);
       item.removeClass('d-none');
       
       msgList.append(item);

    }



    $('.msg-input').keypress(function(event) { 
        if(event.which == 13) {
            event.preventDefault();
            var text = $(this).text();
            console.log(text);

            socket.send(JSON.stringify({'message':text}));
            
        }


    });

});
