(function() {

    $('body').on('click', '.btn-login', function() {
        var obj = $(this);
        var user = $('.login-form input[name=user]').val();
        var pswd = $('.login-form input[name=password]').val();
        $('.status-error').addClass('d-none');
        $(obj).text('Login');

        $.ajax({
            type:"POST",
            cache:false,
            url: login_url,
            data:{'uname':user, 'pswd':pswd },
            beforeSend: function(){

            },
            success: function(result){
                console.log(result.next);
                window.location = result.next;
            },
            error: function(xhr) {
                $('.login-form input[name=user]').val('');
                $('.login-form input[name=password]').val('');
                $('.status-error').removeClass('d-none');
                $('.status-error').html("Username or Password doesn't match");
            }
        });
    });

})();
