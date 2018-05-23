from rest_framework import serializers
from accounts.models import *

# serializer for @mentions
class MentionInputSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = ('id', 'display_name', 'photo') 


    def get_display_name(self, obj):
        return obj.user.get_full_name()
