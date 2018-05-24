from django.shortcuts import render
from rest_framework import permissions, viewsets
from rest_framework.permissions import IsAuthenticated

from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from rest_framework import status

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
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def all(self, request):
        try:
            t = request.GET.get('team','')
            team = Team.objects.get(id=t)
            messages = team.messages.all()
            serialized = MessageSerializer(messages, many=True)
            return Response(serialized.data)
        except Exception as err:
            logging.error("Error in Message all {}".format(str(err)))
            return Response(status=status.HTTP_404_NOT_FOUND)
        

