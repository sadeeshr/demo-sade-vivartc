from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.contrib import auth
from accounts.models import *

import json

import logging

# Create your views here.
@login_required
def authenticated_view(request):

    teams = Team.objects.all()
    agents = Agent.objects.all()

    return render(request, 'accounts/home.html', context={ 'teams':teams, 'agents':agents })

@login_required(login_url='/account/login/')
def home(request):
    try:
        return authenticated_view(request)
    except Exception as err:
        logging.error("Account home error %s", str(err))
        return HttpResponse('dashboard Error')


@csrf_exempt
def login(request):
    if not request.POST:
        if request.user.is_authenticated():
            return authenticated_view(request)
        else:
            return render(request, 'base/index.html', {})
    else:
        try:
            username = request.POST.get('uname')
            pswd = request.POST.get('pswd')
            cek_auth = auth.authenticate(username=username, password=pswd)
            auth.login(request, cek_auth)

            logging.info("login details {} {} ".format(username,pswd))
            url = request.POST.get('next')
            if url is None:
                url = '/account/dashboard/'
            resp = {'next':url}
            return HttpResponse(json.dumps(resp), content_type='application/json')

        except Exception as err:
            logging.warning("Error in login {}".format(str(err)))
            return HttpResponse(status=404, reason=str(err))

@login_required
def logout(request):
    if request.user.is_authenticated():
        auth.logout(request)

    return HttpResponseRedirect(reverse('index'))


def index(request):
    if request.user.is_authenticated():
        return authenticated_view(request)

    return render(request, 'base/index.html', locals())



