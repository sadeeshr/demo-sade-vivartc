(function() {
    /* LS MENU ITEMS*/
    $('body').on('click', '.btn-menu-item.settings', function() {
        $('.modal-bkdrop').removeClass('d-none');
    });
    /* BK DROP deactive */
    $('body').on('click', '.modal-bkdrop>.actions .btn-close', function() {
        $(this).closest('.modal-bkdrop').addClass('d-none');
    });

    $('body').on('click', '.settings-container .item', function() {
        var target = $(this).data('target');
        $(this).closest('.item-list').addClass('d-none').siblings('#'+target).removeClass('d-none');

    });

    $('body').on('click', '.item-list .btn-back', function() {
        $(this).closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none');
    });

    $('body').on('click', '#newSwitchForm .btn-save', function(event) {
        event.preventDefault();
        var obj = $(this); 
        var data = new FormData();
        data.append('name',$('#newSwitchForm #name').val());
        data.append('domain', $('#newSwitchForm #domain').val());
        data.append('address', $('#newSwitchForm #address').val());
        data.append('model', $('#newSwitchForm #switchModel').val());
        data.append('csrfmiddlewaretoken', csrf_token);

        console.log($('#newSwitchForm #address').val()+"-"+$('#newSwitchForm #switchModel').val());
        $.ajax({
            type:"POST",
            cache:false,
            data: data,
            contentType: false,
            processData: false,
            url: '/vox/switch/new/',
            beforeSend:function(){

            },
            success:function(resp) {
                console.log(resp);
                var record = "<div class='switch record row py-3' data-target=''>\
                    <div class='col-sm-4'>"+resp.name+"</div>\
                    <div class='col-sm-3'>"+resp.domain+"</div>\
                    <div class='col-sm-3'>"+resp.address+"</div>\
                    <div class='col-sm-2'><span><i class='fa fa-trash text-danger pr-4'></i></span><span><i class='fa fa-edit text-info'></i></span></div></div>";
                              
                obj.closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none')
                                                                                            .find('.title').after(record);

                var option = "<option value='"+resp.id+"'>"+resp.name+"</option>";
                obj.closest('#switch-profiles').siblings('#tel-profiles').find('form #switchProfile').append(option);
                $('#newSwitchForm')[0].reset();
            },
            error:function(resp) {
                $('#newSwitchForm')[0].reset();

            }
        });       

    });
     
    $('body').on('click', '#newTelProfileForm .btn-save', function(event) {
       console.log("Entering trigger");
        event.preventDefault();
        var obj = $(this); 
        var data = new FormData();
        data.append('extn',$('#newTelProfileForm #extn').val());
        data.append('account', $('#newTelProfileForm #account').val());
        data.append('pswd', $('#newTelProfileForm #pswd').val());
        data.append('switch', $('#newTelProfileForm #switchProfile').val());
        data.append('csrfmiddlewaretoken', csrf_token);

        $.ajax({
            type:"POST",
            cache:false,
            data: data,
            contentType: false,
            processData: false,
            url: '/vox/telprofile/new/',
            beforeSend:function(){

            },
            success:function(resp) {
                console.log(resp);
                var record = "<div class='tel-profile record row py-3' data-target=''>\
                    <div class='col-sm-2'>"+resp.extn+"</div>\
                    <div class='col-sm-3'>"+resp.user+"</div>\
                    <div class='col-sm-4'>"+resp.switch+"</div>\
                    <div class='col-sm-2'><span><i class='fa fa-trash text-danger pr-4'></i></span><span><i class='fa fa-edit text-info'></i></span></div></div>";
                              
                obj.closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none')
                                                                                            .find('.title').after(record);
                $('#newTelProfileForm')[0].reset();
            },
            error:function(resp) {
                $('#newTelProfileForm')[0].reset();

            }
        });       

    });
     

})();
