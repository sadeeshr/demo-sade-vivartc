$(function() {
    console.log(window.location.host);
    var server = "";
    if(window.location.protocol === 'http:')
        server = "ws://" + window.location.host + "/iris/tribe/";
    else
        server = "wss://" + window.location.host + "/iris/tribe/";
    socket = new WebSocket(server);

    socket.onopen = function() {
        console.log("Web Socket connected");
    }

    socket.onmessage = function(e) {
        var message = $.parseJSON(e.data);
        console.log(message);

        if($('.tribe-pad').data("id") == message.board) {
            if (message.code == 100) {
                /*if (message.uid != mykey) {
                    var item = "<li class='notification text-center'> <span class='user pr-2'>"+message.dn+"\
                               </span><span class='text'>"+message.message+"</span></li>";
                    $('.message-list').append(item);
                } */
            } else if (message.code == 102) {
               /* if (message.uid != mykey) {
                    var item = "<li class='notification text-center'> <span class='user pr-2'>"+message.dn+"\
                               </span><span class='text'>"+message.message+"</span></li>";
                    $('.message-list').append(item);
                } */
            } else if(message.code == 101) {
                var msgList = $('.message-list');
                var agent = $('.lsbrowser .agents').find(`[data-user='${message.username}']`);
                var fullName = agent.find('.fullname').text();
                var img = agent.find('img').attr('src');

                var item = "<li class='media message'>\
                            <img class='mr-3 rounded img-sm' src='"+img+"'>\
                            <div class='media-body'>\
                            <span><h5 class='title'>"+fullName+"</h5></span>\
                            <span class='time'></span>\
                            <p class='text'>"+message.message+"</p>\
                            </div>\
                            </li>"
                msgList.append(item);

            } else if(mesasge.code == 201) {

            }
            
            var msgListHt = $('.col-messages').height() - $('.col-messages .footer').outerHeight();
            $('.col-messages .message-list').slimScroll({
                scrollTo: msgListHt
            });
        } else {
            if (message.code == 80) {
                $('.lsbrowser .agents').find(`[data-user='${message.user}']`).find('.status-container').find('.status-icon').html('')
                              .html(getStatusIconHtml(message.status));

            } else if (message.code == 81) {
                
                $('.lsbrowser .agents').find(`[data-user='${message.user}']`).find('.status-container').find('.status-text').text('').text(message.status_text);
                

            } else if (message.code == 100) { 
                

            } else if (message.code == 101) {
                var team = $('.lsbrowser .teams').find(`[data-id='${message.board}']`); 
                var count = parseInt(team.find('.badge').text(), 10) || 0;
                count++;
                team.find('.badge').text(count);

            } else if (message.code == 102) {

            }

        }
           
       
       

    }



    $('.msg-input').keypress(function(event) { 
        if(event.which == 13) {
            event.preventDefault();
            var text = $(this).html();
            var mode = $(this).closest(".tribe-pad").data("mode");
            var id = $(this).closest(".tribe-pad").data("id");
            code = 201;
            if(mode == "0") code = 101; 
            var msg  = {'code':code, 'id': id, 'message': text};  
            socket.send(JSON.stringify(msg));

            $(this).html('');
        }


    });



    /* @ mentions */
    $('.msg-input').atwho({
        at: "@",
        data: '/iris/at/mentions',
        displayTpl: "<li><img class='mr-1 rounded img-xs' src='${photo}'></img>${display_name}</li>",
        insertTpl: "<span class='at-mention'>${atwho-at}${display_name}</span>",
    });


    $('body').on('click', '.sub-menu-container .btn-link.status-text', function() {
        var text = $(this).closest('.inline-editable').find('input').val();
        var status = $('.user-panel-submenu').find('.status').data("value");
        $(this).closest('.inline-editable').addClass('d-none').parent().find('.editable-link').text(text).removeClass('d-none');
        
        // code: 80 stands for presence
        var msg  = {'code': 81, 'status':status, 'status_text': text};
        socket.send(JSON.stringify(msg));

    });


    $('body').on('change', '.sub-menu-container .status-choices', function() {
        var status = $(this).find("option:selected").text()
        var statusText = $('.user-panel-submenu').find('.status-text').text();
        $(this).closest('.inline-editable').addClass('d-none').parent().find('.editable-link').text(status).data('value', $(this).val()).removeClass('d-none');

        var msg  = {'code': 80, 'status':$(this).val(), 'status_text':"" };
        socket.send(JSON.stringify(msg));
    });


    $('body').on('click', '.btn-logout', function() {
        var msg  = {'code': 80, 'status': 0, 'status_text': ""};
        socket.send(JSON.stringify(msg));

    });

});

function getStatusIconHtml(status) {
    if(status == 1)
        return "<i class='fa fa-circle text-online'></i>";
    else if(status == 2)
        return "<i class='fa fa-circle text-busy'></i>"; 
    else if(status == 3)
        return "<i class='fa fa-minus-circle text-busy'></i>"; 
    else if(status == 4)
        return "<i class='fa fa-clock-o text-away'></i>"; 
    else
        return "<i class='fa fa-circle text-offline'></i>"; 
    
}
