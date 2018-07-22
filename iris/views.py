from django.shortcuts import render
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import TemplateHTMLRenderer

from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .serializers import *

# Create your views here.
class MentionInputViewSet(viewsets.ViewSet):
    serializer_class = MentionInputSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        queryset = Agent.objects.all()
        serialized = MentionInputSerializer(queryset, many=True) 
        return Response(serialized.data)

class MessageViewSet(viewsets.ViewSet):
    renderer_classes = [TemplateHTMLRenderer]
    template_name = 'iris/message_list.html'
    permission_classes = [IsAuthenticated]

    def all(self, request):
        try:
            t = request.GET.get('team','')
            team = Team.objects.get(id=t)
            messages = team.messages.all()
            return Response({'messages':messages})

        except Exception as err:
            logging.error("Error in Message all {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)
        

    def direct_messages(self, request):
        try:
            pk = request.GET.get('key','')            
            agent = Agent.objects.get(id=pk)
            messages = []
            direct_messages =  DirectMessage.objects.filter(Q(to=request.user) | Q(message__author=request.user), 
                                                            Q(message__author=agent.user)| Q(to=agent.user))
            for dm in direct_messages:
                messages.append(dm.message)
            #serialized = DirectMesssageSerializer(direct_messages, many=True)
            #print(serialized.data)
            #return Response("Succesful")
            return Response({'messages':messages})

        except Exception as err:
            logging.error("Direct Messages {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)
