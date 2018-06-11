from rest_framework import serializers
from accounts.models import *


class TelProfileSerializer(serializers.ModelSerializer):
    domain = serializers.CharField(source='switch.domain', read_only=True)
    address = serializers.CharField(source='switch.address', read_only=True)

    class Meta:
        model = TelProfile
        fields = ('extn', 'domain', 'address')


class AgentSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    tel_profile = TelProfileSerializer(read_only=True)

    class Meta:
        model = Agent
        fields = ('id', 'display_name', 'title', 'photo', 'tel_profile')

    def get_display_name(self, obj):
        return obj.user.get_full_name()

class ConfProfileSerializer(serializers.ModelSerializer):
    bridge = serializers.CharField(source='bridge_id', read_only=True)
    domain = serializers.CharField(source='switch.domain', read_only=True) 
    address = serializers.CharField(source='switch.address', read_only=True) 

    class Meta:
        model = ConfProfile
        fields = ('bridge', 'password', 'domain', 'address')

class TeamSerializer(serializers.ModelSerializer):
    conf_profile = ConfProfileSerializer(read_only=True)
    members = AgentSerializer(many=True) 
    
    class Meta:
        model  = Team
        fields = ('id', 'name', 'description', 'conf_profile', 'members')
