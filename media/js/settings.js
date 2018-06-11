(function() {
    /* LS MENU ITEMS*/
    $('body').on('click', '.btn-menu-item.settings', function(e) {
        e.preventDefault();
        $('.modal-bkdrop').removeClass('d-none')
                          .find('.settings-container').removeClass('d-none')
                                                      .siblings('.agent-settings-container').addClass('d-none');
                                                 
    });
    $('body').on('click', '.btn-menu-item.agent-settings', function(e) {
        e.preventDefault();
        $('.modal-bkdrop').removeClass('d-none')
                          .find('.settings-container').addClass('d-none')
                                                      .siblings('.agent-settings-container').removeClass('d-none');
                                                 
    });
    /* BK DROP deactive */
    $('body').on('click', '.modal-bkdrop>.actions .btn-close', function() {
        $(this).closest('.modal-bkdrop').addClass('d-none');
    });

    $('body').on('click', '.nested-settings .item', function() {
        var target = $(this).data('target');
        $(this).closest('.item-list').addClass('d-none').siblings('#'+target).removeClass('d-none');

    });

    $('body').on('click', '.item-list .btn-back', function() {
        $(this).closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none');
    });
    $('body').on('click', '.inline-actions .link-close', function() {
        $(this).closest('.inline-editable').addClass('d-none')
                                           .siblings('.editable-info').find('.editable-link').removeClass('d-none');
    });
    $('body').on('change', '#newTeamForm .members', function() {
        var agentId = $(this).val();
        var agentName = $(this).find("option:selected").text();
        var item = "<li class='py-2' data-id='"+agentId+"'>"+agentName+"</li>";

        $(this).find("option:selected").remove();
        $(this).closest('form').find('.member-list').append(item);
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


    $('body').on('click', '#newAgentForm .btn-save', function(event) {
        event.preventDefault();
        var obj = $(this);
        var data = new FormData();
        data.append('fname',$('#newAgentForm #fname').val());
        data.append('lname',$('#newAgentForm #lname').val());
        data.append('uname',$('#newAgentForm #uname').val());
        data.append('email',$('#newAgentForm #agentEmail').val());
        data.append('telprofile', $('#newAgentForm #telProfile').val());
        data.append('csrfmiddlewaretoken', csrf_token);
        

        $.ajax({
            type:"POST",
            cache:false,
            data: data,
            contentType: false,
            processData: false,
            url: '/accounts/agent/new/',
            beforeSend:function(){

            },
            success:function(resp) {
                console.log(resp);
                var record = "<div class='record row py-3' data-target=''>\
                    <div class='col-sm-4'>"+resp.display_name+"</div>\
                    <div class='col-sm-3'>"+resp.title+"</div>\
                    <div class='col-sm-3'>"+resp.tel_profile.extn+"</div>\
                    <div class='col-sm-2'><span><i class='fa fa-trash text-danger pr-4'></i></span><span><i class='fa fa-edit text-info'></i></span></div></div>";

                obj.closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none')
                                                                                            .find('.title').after(record);
                $('#newAgentForm')[0].reset();
            },
            error:function(resp) {
                $('#newAgentForm')[0].reset();

            }
        });

    });
    
    $('body').on('click', '.inline-actions .link-tick', function() {
        var obj = $(this); 
        var value = obj.closest('.inline-editable').find('.field').val();
        var field = obj.closest('.editable-container').data('field');       
        var data = new FormData();
        data.append('field', field);
        data.append('value', value);
        data.append('csrfmiddlewaretoken', csrf_token);
         
        $.ajax({
            type:"POST",
            cache:false,
            data: data,
            contentType: false,
            processData: false,
            url: '/accounts/profile/update/',
            beforeSend:function(){

            },
            success:function(resp) {
                console.log(resp);
                obj.closest('.inline-editable').addClass('d-none')
                                               .siblings('.editable-info').find('.editable-link').removeClass('d-none')
                                                                                                 .text('')
                                                                                                 .text(value);
            },
            error:function(resp) {

            }
        }); 


    });

    
    $('body').on('click', '#newTeamForm .btn-save', function(e) {
        e.preventDefault();
        var obj = $(this); 
        var members = [];
        $('.member-list').find('li').each(function(){
            members.push($(this).data("id"));
        });
        
        var name = $('#newTeamForm').find('input[name=name]').val();
        var desc = $('#newTeamForm').find('textarea[name=desc]').val();
        console.log(name);
        console.log('desc');
       
        $.ajax({
            type:"POST",
            cache:false,
            data: {
                'csrfmiddlewaretoken': csrf_token,
                'name': name,
                'desc':desc,
                'members': JSON.stringify(members),
            },
            url: '/accounts/team/new/',
            beforeSend:function(){

            },
            success:function(resp) {
                console.log(resp);
                var record = "<div class='record row py-3'>\
                             <div class='col-sm-4'>"+resp.name+"</div>\
                             <div class='col-sm-3'></div>\
                             <div class='col-sm-3'></div>\
                             <div class='col-sm-2'><span><i class='fa fa-trash text-danger pr-4'></i></span>\
                             <span><i class='fa fa-edit text-info'></i></span></div></div>";
                obj.closest('.item-list').parent().addClass('d-none').siblings('.item-list').removeClass('d-none')
                                                                                            .find('.title').after(record);
            },
            error:function(resp) {

            }
        });

        
    });

     

})();

function triggerImageChange()
{
        var fileuploader = $("#fileInput");
        fileuploader.on('click',function(){
            console.log("File upload triggered programatically");
        });
        fileuploader.on('change', function(e) {
            var reader = new FileReader();
            reader.onload = function () {
                document.getElementById('editimg').src = reader.result;
                
                var fd = new FormData();
                fd.append('field', 'photo');
                fd.append('photo', fileuploader[0].files[0]); 
                fd.append('csrfmiddlewaretoken', csrf_token);
                
                $.ajax({
                    type:"POST",
                    cache:false,
                    data: fd,
                    contentType: false,
                    processData: false,
                    url: '/accounts/profile/update/',
                    beforeSend:function(){

                    },
                    success:function(resp) {
                        console.log(resp);
                        $('.tribe-pad .header-content').find('.profile').find('img').attr('src', resp.photo);
                    },
                    error:function(resp) {

                    }
                }); 


            }
            var files = fileuploader[0].files;
            reader.readAsDataURL(files[0]);

        });
        fileuploader.trigger('click')
}

