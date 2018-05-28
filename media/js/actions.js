(function() {

    window.onresize = function(){
        document.body.height = window.innerHeight;
        var ht = (window.innerHeight - 60);
        $('html body .col-messages').css('height', ht);

        // you can change here what you prefer
      if (/android|webos|iphone|ipad|ipod|blackberry|nokia|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(navigator.userAgent.toLowerCase())) {
          var theminheight = Math.min(document.documentElement.clientHeight, window.screen.height, window.innerHeight);
          //now apply height ... if needed...add html & body ... i need and i use it
          $('html body .col-messages').css('height', theminheight-60);
      }
    }
    window.onresize();

    

    $('body').on('click', '.dial-launcher .btn', function() {
        if(!$(this).closest('.lsbrowser').find('.dialer').hasClass('d-none'))
            $(this).closest('.lsbrowser').find('.display').html('');

        $(this).closest('.lsbrowser').find('.dialer').toggleClass('d-none');
        $(this).closest('.lsbrowser').find('.phbook').toggleClass('d-none');
        $(this).closest('.lsbrowser').find('.contacts').toggleClass('d-none');
        if($(this).closest('.lsbrowser').find('.contacts').hasClass('d-none'))
            $(this).closest('.lsbrowser').find('.contact-list').empty()
    });
    $('body').on('click', '.scribe-heading .link-close', function() {
        $(this).closest('.col-scribe').removeClass('d-md-block');
    });
    $('body').on('click', '.user-panel .btn-link', function() {
        $(this).closest('.menu').find('.user-panel-submenu').toggleClass('d-none');

    });

    $('body').on('click', '.action-item .btn-link.info', function() {
        $(this).closest('.tribe-pad').find('.col-scribe').toggleClass('d-md-block');
    });

 
    /* Team View */
    $('body').on('click', '.teams.viewable .btn-link', function() {
        var menuItem = $(this).closest('.item'); 
        var key = $(this).closest('.item').data("id");
        
        $.ajax({
            type:"GET",
            cache:false,
            url: '/accounts/team/record',
            data:{
                'key': key,
            },
            success:function(result) {
                $('.tribe-pad').data('id', result.id);
                $('.tribe-pad .header-content').find('.title').html(result.name);
                $('.tribe-pad .header-content').find('.desc').html('');
                // $('.tribe-pad .header-content').find('.action-item.phone').data('extn', result.extn);
                //$('.tribe-pad .header-content').find('.action-item.phone').data('server', result.server);
                $('.message-list').find('li.visible').remove();
                $('.lsbrowser').find('.active').removeClass('active');
                menuItem.find('.badge').text('');
                menuItem.addClass('active');

                if($('.col-scribe').length > 0) {
                    $('.scribe-heading .title').text('').text(result.name);
                    $('.scribe-item.info').find('.scribe-item-body').text('').text(result.description);
                    $('.scribe-item.members').find('.badge').text('').text(result.members.length);
                    $('.scribe-item.members').find('ul').empty();
                    $.each(result.members, function(key, item) {
                        var li = "<li class='media item agent px-0 py-2' data-id='"+item.id+"'>\
                                  <img class='mr-3 rounded img-small' src='"+item.photo+"'>\
                                  <div class='media-body'><span><a class='' href='#'>"+item.display_name+"</a></span></div>\
                                  </li>";
                        $('.scribe-item.members').find('ul').append(li);
                    });
                }

                syncTeamMessages(result.id);
               
            },
            error: function(xhr, error) {
                console.log(error);
            }
        });

    });

    /* agent view */
    $('body').on('click', '.agents.viewable .btn-link', function() {
        var menuItem = $(this).closest('.item'); 
        var key = $(this).closest('.item').data("id");
        
        $.ajax({
            type:"GET",
            cache:false,
            url: '/accounts/agent/record',
            data:{
                'key': key,
            },
            success:function(result) {
                $('.tribe-pad').data('id', result.id);
                $('.tribe-pad .header-content').find('.title').html(result.display_name);
                $('.tribe-pad .header-content').find('.desc').html('');
                if (result.tel_profile) {
                    $('.tribe-pad .header-content').find('.action-item.phone').data('extn', result.tel_profile.extn)
                }
                //$('.tribe-pad .header-content').find('.action-item.phone').data('server', result.server);
                $('.message-list').find('li.visible').remove();
                $('.lsbrowser').find('.active').removeClass('active');
                menuItem.find('.badge').text('');
                menuItem.addClass('active');

                $('.scribe-item.members').find('.badge').text('');
                $('.scribe-item.members').find('ul').empty();
                $('.scribe-item.info').find('.scribe-item-body').text('');
                $('.scribe-heading .title').text('').text(result.display_name);
                    
               
            },
            error: function(xhr, error) {
                console.log(error);
            }
        });

    });


   
    $('body').on('click', '.dialer .btn-digit', function() {
        var digit = $(this).attr("data-value");
        var existing = $(this).closest('.dialer').find('.display').text();
        var search = existing+digit;
        $(this).closest('.dialer').find('.display').text(existing+digit);

        $.ajax({
            type:"POST",
            cache:false,
            url: '/vox/search/',
            data:{
                'q': search,
                'csrfmiddlewaretoken': csrf_token
            },
            success:function(result) {
                $('.lsbrowser .contact-list').empty();
                $.each(result, function(key, item){  
                    var node = "<li class='media contact item px-3 py-2'>\
                                <div class='align-middle ' style='padding-top: 0.5em;'><img class='mr-3 rounded img-small' src='/media/images/avatar2.jpg'></div>\
                                <div class='media-body'>\
                                <span><a class='btn-link' href='#'>"+item.first_name+" "+item.last_name +"</a></span>\
                                <p class='mb-0'>"+item.company+"</p>\
                                </div>\
                                </li>";
                    $('.lsbrowser .contact-list').append(node);
                });

            },
            error: function(xhr, error) {
                console.log(error);
            }
        });
    }); 

    $('body').on('click', '.dialer .btn-erase', function() {
        $(this).closest('.dialer').find('.display').text('');
    });

     
/*
    $("body").on('keypress', '.msg-input', function (e) {
        var element = this;

        if ((element.offsetHeight < element.scrollHeight) || (element.offsetWidth < element.scrollWidth)) {
            e.preventDefault();
        } else {
            $('.input-container .btn-attach').height(element.offsetHeight+14);
        }
    });
*/

})();


function syncTeamMessages(teamId) {
    console.log("requesting for messages");

        $.ajax({
            type:"GET",
            cache:false,
            url: '/iris/team/messages',
            data:{
                'team': teamId,
            },
            success:function(result) {
                console.log(result);
                $.each(result, function(key, message) {
                    var li = "<li class='media message visible'>\
                              <img class='mr-3 rounded img-sm' src='"+message.author_photo+"'>\
                              <div class='media-body'>\
                              <span><h5 class='title'>"+message.author+"</h5></span>\
                              <span class='time'>"+message.time+"</span>\
                              <p class='text'>"+message.content+"</p>\
                              </div>\
                              </li>"
                    $('.message-list').append(li);
                });
            },
            error: function(xhr, error) {
                console.log(error);
            }
        });

}
