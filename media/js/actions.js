var Dialer = {
    number: "",
    selector: "#dialer",
    init: function(selector) {
        this.number = "";
        this.selector = selector;
        $(this.selector).find('.display').text('');
    },
    press: function(digit) {
        var newNum = this.number+""+digit;
        this.number = newNum;
        $(this.selector).find('.display').text('')
                                     .text(this.number);
        fetchContacts(this.number);
    },
    backspace: function() {
        var newNum = this.number.slice(0, -1);
        this.number = newNum;
        $(this.selector).find('.display').text('')
                                     .text(this.number);
        fetchContacts(this.number);
    }, 
    clear: function() {
        this.number = "";
        $(this.selector).find('.display').text('');
    },
    dial: function() {
        if(this.number == "") {
            return;
        }
        $(this.selector).find('.btn-dial').trigger('click'); 
    } 

}



$(function() {

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
        Dialer.init('#dialer'); 
        $('.lsbrowser .dialer').focus();
    });
    $('body').on('click', '.scribe-heading .link-close', function() {
        $(this).closest('.col-scribe').addClass('d-none');

    });
    $('body').on('click', '.user-panel .btn-link', function() {
        $(this).closest('.menu').find('.user-panel-submenu').toggleClass('d-none');

    });

    $('body').on('click', '.action-item .btn-link.info', function() {
        $(this).closest('.tribe-pad').find('.col-scribe').removeClass('d-none')
                                                         .removeClass('sm-hide');
    });

    $('body').on('click', '.btn-transfer', function() {
        $(this).closest('.scribe-incall').find('.callid-container').toggleClass('d-none')
                                         .siblings('.transfer-input').toggleClass('d-none')
                                         .find('.editable').html('');
    });

    $('body').on('click', '.btn-digits', function() {
        $(this).closest('.incall-widget').find('.features-container').toggleClass('d-none')
                                         .siblings('.digits-container').toggleClass('d-none');
        $(this).closest('.scribe-incall').find('.callid-container').toggleClass('d-none')
                                         .siblings('.digits-input').toggleClass('d-none');

    });

    $('body').on('click', '.editable-link', function() {
        $(this).addClass('d-none').closest('.editable-container').find('.inline-editable').removeClass('d-none');

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
                if(result.conf_profile)
                    $('.tribe-pad').data('extn', result.conf_profile.bridge);
                $('.tribe-pad .header-content').find('.title').html(result.name);
                $('.tribe-pad .header-content').find('.desc').html(result.description);
                // $('.tribe-pad .header-content').find('.action-item.phone').data('extn', result.extn);
                //$('.tribe-pad .header-content').find('.action-item.phone').data('server', result.server);
                $('.message-list').empty();
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
        $('.tribe-pad').data('mode', "1")
                       .data('uname', $(this).closest('.item').data('user'));
        
        $.ajax({
            type:"GET",
            cache:false,
            url: '/accounts/agent/record',
            data:{
                'key': key,
            },
            success:function(result) {
                $('.tribe-pad').data('id', result.id);
                $('.tribe-pad').data('extn', result.tel_profile.extn);
                $('.tribe-pad .header-content').find('.title').html(result.display_name);
                $('.tribe-pad .header-content').find('.desc').html('');

                $('.message-list').find('li.visible').remove();
                $('.lsbrowser').find('.active').removeClass('active');
                menuItem.find('.badge').text('');
                menuItem.addClass('active');

                $('.scribe-item.members').find('.badge').text('');
                $('.scribe-item.members').find('ul').empty();
                $('.scribe-item.info').find('.scribe-item-body').text('');
                $('.scribe-heading .title').text('').text(result.display_name);
                    
               
                syncAgentMessages(result.id);
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
        // $(this).closest('.dialer').find('.display').text(existing+digit);
        Dialer.press(digit);

        /*
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
        */
    }); 
 
    $('body').on('keyup', '.dialer', function(event) {
        event.preventDefault();
        var charCode = (event.which) ? event.which : event.keyCode;
        if ( charCode >= 48 && charCode <= 57 ) {
            Dialer.press(String.fromCharCode(charCode));
        } else if(charCode >= 96 && charCode <= 105) {
            charCode -= 48;
            Dialer.press(String.fromCharCode(charCode));
        } else if (charCode == 8) {
            Dialer.backspace();
        } else if (charCode == 13) {
            Dialer.dial();
        }

    });




    $('body').on('click', '.dialer .btn-erase', function() {
        Dialer.backspace();
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

    /* SETTINGS */
    /* Change Skin */
    $('body').on('click', '.type-tile .snap', function() {
        var selected = $(this).data('value');
        var mode = $(this).closest('.skins').attr('id');

        $.ajax({
             type:"POST",
             cache:false,
             data:{
                 'csrfmiddlewaretoken': csrf_token,
                 'mode': mode,
                 'skin': selected
             },
             url: '/accounts/ws/settings/',
             success:function(resp) {
                 console.log(resp);
                 if(mode=='photos') {
                     $('body').css('background','');
                     $('body').css('background-image', "url('"+selected+"')");
                 } else {
                     $('body').css('background-image','');
                     $('body').css('background',selected);
                 }
            },
            error:function(resp) {

            }
        });
    });


});


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
                /*$.each(result, function(key, message) {
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
                */
                $('.message-list').html(result);
                var msgListHt = $('.col-messages').height() - $('.col-messages .footer').outerHeight();
                $('.col-messages .message-list').slimScroll({
                    scrollTo: msgListHt+"px"
                });
            },
            error: function(xhr, error) {
                console.log(error);
            }
        });

}


function fetchContacts(key) {

        $.ajax({
            type:"POST",
            cache:false,
            url: '/vox/search/',
            data:{
                'q': key,
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


}

function syncAgentMessages(agentId) {
    console.log("requesting for messages");

        $.ajax({
            type:"GET",
            cache:false,
            url: '/iris/agent/messages',
            data:{
                'key': agentId,
            },
            success:function(result) {
                console.log(result);
                /*$.each(result, function(key, message) {
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
                */
                $('.message-list').html(result);
                var msgListHt = $('.col-messages').height() - $('.col-messages .footer').outerHeight();
                $('.col-messages .message-list').slimScroll({
                    scrollTo: msgListHt+"px"
                });
            },
            error: function(xhr, error) {
                console.log(error);
            }
        });

}

