(function() {

    $('body').on('click', '.dial-launcher .btn', function() {
        $(this).closest('.lsbrowser').find('.dialer').toggleClass('d-none');
        $(this).closest('.lsbrowser').find('.phbook').toggleClass('d-none');
    });

    $("body").on('keypress', '.msg-input', function (e) {
        var element = this;
        $('.input-container .btn-attach').height($('.input-container .msg-input').height())
        if ((element.offsetHeight < element.scrollHeight) || (element.offsetWidth < element.scrollWidth)) {
            e.preventDefault();
        }
    });


})();
