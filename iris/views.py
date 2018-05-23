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

