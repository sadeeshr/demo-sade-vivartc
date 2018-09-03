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
import os
import json
from iris.models import Presence
from vox.models  import SwitchModel, TelSwitch,TelProfile, Contact
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
    path = "media/images/pixabay/"
    bkimages=os.listdir(path)

    contacts = Contact.objects.all()

    switch_models = SwitchModel.objects.all() 
    switches = TelSwitch.objects.filter(account=agent.account)
    tel_profiles = TelProfile.objects.filter(account=agent.account)
    return render(request, 'accounts/home.html', context={ 'me': agent, 
                                                           'teams':teams, 
                                                           'agents':agents, 
                                                           'contacts':contacts,
                                                           'active_board':active_board,
                                                           'switch_models': switch_models,
                                                           'switches':switches,
                                                           'tel_profiles':tel_profiles,
                                                           'bkimages':bkimages })

@login_required(login_url='/accounts/login/')
def home(request):
    try:
        return authenticated_view(request)
    except Exception as err:
        logging.error("Account home error %s", str(err))
        return HttpResponse('dashboard Error')


from iris.consumers import push_presence

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
            try:
                presence = request.user.presence
            except Presence.DoesNotExist:
                presence = Presence.objects.create(user=request.user)

            presence.status = '1'
            presence.save()
            push_presence(request, presence)

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
        try:
            presence = request.user.presence
            presence.status = '0'
            presence.save()
            agent = request.user.agent
            calls = agent.calls.filter(status__in=('1','2','5')) 
            print(calls)
            for call in calls:
                call.status = '4'
                call.save()

            auth.logout(request)

        except Presence.DoesNotExist:
            auth.logout(request)

    resp = {'redirect':'/'}
    return HttpResponse(json.dumps(resp), content_type='application/json')


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
class AgentViewSet(viewsets.ViewSet):    
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]

    def record(self, request):
        try:
            key = request.GET.get("key",'')
            agent = Agent.objects.get(id=key)
            serialized = AgentSerializer(agent)
            return Response(serialized.data) 
        except Exception as err:
            logging.error("Error in Agent Record {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def new(self, request):
        try:
            uname = request.POST.get("uname",'')
            email = request.POST.get("email",'')
            fname = request.POST.get("fname", '')
            lname = request.POST.get("lname", '')
            tp = request.POST.get("telprofile", '')
            tel_profile = TelProfile.objects.get(id=tp)

            account = request.user.agent.account
            # Temeperorary
            tmp_pswd = 'v1var0cks'
            user = User.objects.create_user(username=uname, email=email, password=tmp_pswd, first_name = fname, last_name=lname)
            # create agent
            agent = Agent.objects.create(user=user, tel_profile=tel_profile, account=account)
            settings = {'background': {'mode': 1, 'url': "/media/images/pixabay/italy-2080072_1920.jpg"}}
            agent.photo = '/images/avatar2.jpg'
            agent.settings = settings
            agent.save()
            serialized = AgentSerializer(agent)
            return Response(serialized.data)

        except Exception as err:
            logging.error("Error in creating New agent {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):
        try:
            key = request.POST.get("key",'')
            agent = Agent.objects.get(id=key)
            agent.user.delete()
            return Response("Successful")

        except Exception as err:
            logging.error("Error in Agent delete {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def profile_update(self, request):
        try:
            field = request.POST.get("field",'')            
            value = request.POST.get("value",'')
            user = request.user
            agent = user.agent

            if 'fname' in field:
                user.first_name = value 
            elif 'lname' in field:
                user.last_name  = value
            elif 'pswd' in field:
                user.set_password(value)
            elif 'title' in field:
                agent.title = value 
            elif 'photo' in field:
                photo = request.FILES.get('photo')
                agent.photo = photo

            user.save()
            agent.save()
            serialized = AgentSerializer(agent)
            return Response(serialized.data)

        except Exception as err:
            logging.error("Error in creating New agent {}".format(str(err)))

    def ws_settings(self, request):
        try:
            mode = request.POST.get('mode')
            skin = request.POST.get('skin')
            if 'photos' in mode:
                bk = {'mode': 1, 'url': skin}
            else:
                bk = {'mode': 0, 'code': skin}
            settings = {'background': bk}
            agent = request.user.agent
            agent.settings = settings
            agent.save()

            return Response("Success")

        except Exception as err:
            logging.error("Error in WS Skin {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)
        

class TeamViewSet(viewsets.ViewSet):    
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        queryset = Team.objects.all()
        serialized = TeamSerializer(queryset, many=True)
        return Response(serialized.data)

    def new(self, request):
        try:
            name = request.POST.get('name')
            desc = request.POST.get('desc')
            members = request.POST.get('members')
            agent = request.user.agent
            team = Team.objects.create(name=name, description=desc, account=agent.account)
            for member in json.loads(members):
                agent = Agent.objects.get(id=member)
                TeamMembership.objects.create(user=agent, team=team)

            serialized = TeamSerializer(team)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in team new {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request):
        try:
            key = request.POST.get("key",'')
            team = Team.objects.get(id=key)
            team.delete()
            return Response("Successful")

        except Exception as err:
            logging.error("Error in Team delete {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def record(self, request):
        try:
            key = request.GET.get("key",'')  
            team = Team.objects.get(id=key)
            serialized = TeamSerializer(team)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in Team detail {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

