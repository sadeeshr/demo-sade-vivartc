from rest_framework import serializers
from accounts.models import *
from .models import *

# serializer for @mentions
class MentionInputSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = ('id', 'display_name', 'photo') 


    def get_display_name(self, obj):
        return obj.user.get_full_name()

class MessageSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    author_photo = serializers.SerializerMethodField()
    date = serializers.DateTimeField(source='timestamp', format='%a %d %B')
    time = serializers.DateTimeField(source='timestamp', format='%I:%M %p')

    class Meta:
        model = Message
        fields = ('author', 'author_photo', 'content', 'date', 'time')

    def get_author(self, message):
        return message.author.get_full_name()

    def get_author_photo(self, message):
        if message.author.agent is not None:
            return message.author.agent.photo.url
        else:
            return '' 
        
