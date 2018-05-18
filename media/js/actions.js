(function() {

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
        $(this).closest('.col-scribe').remove();
    });
    $('body').on('click', '.user-panel .btn-link', function() {
        $(this).closest('.menu').find('.user-panel-submenu').toggleClass('d-none');

    });

    $('body').on('click', '.agent .btn-link', function() {
        var menuItem = $(this).closest('.item'); 
        var key = $(this).closest('.item').data("id");
        console.log(key);
        
        $.ajax({
            type:"POST",
            cache:false,
            url: '/accounts/tribe/pad/',
            data:{
                'mode': 0,
                'key': key,
                'csrfmiddlewaretoken': csrf_token
            },
            success:function(result) {
                console.log(result);

                $('.tribe-pad .header-content').find('.title').html(result.title);
                $('.tribe-pad .header-content').find('.desc').html('');

                $('.tribe-pad .header-content').find('.action-item.phone').data('extn', result.extn);
                $('.tribe-pad .header-content').find('.action-item.phone').data('server', result.server);
                $('.lsbrowser').find('.active').removeClass('active');
                menuItem.addClass('active');
               
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
