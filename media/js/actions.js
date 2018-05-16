(function() {

    $('body').on('click', '.dial-launcher .btn', function() {
        $(this).closest('.lsbrowser').find('.dialer').toggleClass('d-none');
        $(this).closest('.lsbrowser').find('.phbook').toggleClass('d-none');
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
