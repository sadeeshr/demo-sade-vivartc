from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect, Http404
#drf
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework import status
from .serializers import *

from django.db.models import Q
from vox.models import *
import json
import logging


# Create your views here.
@login_required
def search(request):
    try:
        if request.POST:
            q = request.POST.get("q")
            logging.info("Value-{}".format(q))
            contacts = Contact.objects.filter(Q(mobile__contains=q)|Q(work__contains=q)).values('first_name','last_name','mobile','work','title','company')
            data = list(contacts)
            logging.info("{}".format(data))
            return JsonResponse(data, safe=False)
            
    except Exception as err:
        logging.warning("Error in search {}".format(str(err)))
        return HttpResponse(status=404, reason=str(err))

class TelSwitchViewSet(viewsets.ViewSet):
   
    serializer_class = TelSwitchSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        try:
            agent = request.user.agent
            queryset = TelSwitch.objects.filter(account=agent.account)
            serialized = TelSwitchSerializer(queryset, many=True)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in TelSwitch all {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def new(self, request):
        try:
            agent = request.user.agent
            model = request.POST.get('model','')
            name  = request.POST.get('name','')
            domain = request.POST.get('domain','')
            address = request.POST.get('address','')
            switch_model = SwitchModel.objects.get(id=model)
            switch = TelSwitch.objects.create(name=name,
                                              domain=domain,
                                              address=address,
                                              make=switch_model,
                                              account=agent.account)
            serialized = TelSwitchSerializer(switch)
            return Response(serialized.data)                             

        except Exception as err:
            logging.error("Error in TelSwitch New {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

class TelProfileViewSet(viewsets.ViewSet):
   
    serializer_class = TelProfileSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        try:
            agent = request.user.agent
            queryset = TelProfile.objects.filter(account=agent.account)
            serialized = TelProfileSerializer(queryset, many=True)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in TelProfile all {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)

    def new(self, request):
        try:
            agent = request.user.agent
            extn = request.POST.get('extn','')
            account  = request.POST.get('account','')
            pswd = request.POST.get('pswd','')
            s = request.POST.get('switch','')
            switch = TelSwitch.objects.get(id=s)
            tel_profile = TelProfile.objects.create(extn=extn,
                                               user=account,
                                               pswd=pswd,
                                               switch=switch,
                                               account=agent.account)
            serialized = TelProfileSerializer(tel_profile)
            return Response(serialized.data)

        except Exception as err:
            logging.error("Error in TelProfile New {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)
