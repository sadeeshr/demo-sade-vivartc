$(function() {
    console.log(window.location.host);
    socket = new WebSocket("ws://" + window.location.host + "/iris/tribe/");

    socket.onopen = function() {
        console.log("Web Socket connected");

    }

    socket.onmessage = function(e) {
       var message = $.parseJSON(e.data);
       console.log(message);
      
       if (message.code == 100) {
           var item = "<li class='notification text-center'> <span class='user pr-2'>"+message.username+"</span><span class='text'>"+message.message+"</span></li>";
           $('.message-list').append(item);
       } else if(message.code == 101) {
           var msgList = $('.message-list');
           var item = msgList.find('li:first').clone();
           if(message.username != user) {
               var agent = $('.lsbrowser .agents').find(`[data-user='${message.username}']`);
               var img = agent.find('img').attr('src');
               var fullName = agent.find('.fullname').text();

               item.find('img').attr('src', img);
               item.find('.title').text(fullName);
           }
           item.find('.media-body .text').text("");
           item.find('.media-body .text').text(message.message);
           item.removeClass('d-none');
           msgList.append(item);

       } else if(mesasge.code == 201) {

       }
       

    }



    $('.msg-input').keypress(function(event) { 
        if(event.which == 13) {
            event.preventDefault();
            var text = $(this).text();
            var mode = $(this).closest(".tribe-pad").data("mode");
            var id = $(this).closest(".tribe-pad").data("id");
            code = 201;
            if(mode == "0") code = 101; 
            var msg  = {'code':code, 'id': id, 'message': text};  

            console.log(msg);
            socket.send(JSON.stringify(msg));

            $(this).html('');
        }


    });

});
