from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.contrib import auth
from accounts.models import *
from django.core.urlresolvers import reverse
from django.http import JsonResponse
from django.core import serializers
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework import status
from .serializers import *

import json

import logging

# Create your views here.
@login_required
def authenticated_view(request):

    agent = request.user.agent;
    agents = Agent.objects.all()
    if request.user.is_superuser:
        teams = Team.objects.all()
    else:
        teams = agent.teams.all()

    active_board = teams.first()

    return render(request, 'accounts/home.html', context={ 'me': agent, 'teams':teams, 'agents':agents, 'active_board':active_board })

@login_required(login_url='/accounts/login/')
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

            url = request.POST.get('next')
            if url is None:
                url = '/accounts/home/'
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

@login_required
def tribe_pad(request):
    try:
        if request.POST:
            mode = request.POST.get("mode")
            key  = request.POST.get("key")

            if mode == '0':
                agent = Agent.objects.get(id=key)
                data = {'id':agent.id, 'title': agent.user.get_full_name(), 'extn': agent.tel_profile.extn, 'server': agent.tel_profile.switch.domain}
                return JsonResponse(data, safe=False)
            elif mode == '1':
                team = Team.objects.get(id=key)
                data = {'id':team.id, 'title': team.name, 'extn':'', 'server':''}
                return JsonResponse(data, safe=False)

            serialized_object = serializers.serialize('json', [data,])
            return JsonResponse(serialized_object, safe=False)

    except Exception as err:
        logging.warning("Error in login {}".format(str(err)))
        return HttpResponse(status=404, reason=str(err))

#DRF views
class TeamViewSet(viewsets.ViewSet):    
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        queryset = Team.objects.all()
        serialized = TeamSerializer(queryset, many=True)
        return Response(serialized.data)

    def record(self, request):
        try:
            key = request.GET.get("key",'')  
            team = Team.objects.get(id=key)
            serialized = TeamSerializer(team)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in Team detail {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

