from rest_framework import serializers
from .models import *

class TelSwitchSerializer(serializers.ModelSerializer):

    class Meta:
        model = TelSwitch
        fields = ('id','name','domain','address','make')


class TelProfileSerializer(serializers.ModelSerializer):

    switch = serializers.CharField(source='switch.name')

    class Meta:
        model = TelProfile
        fields = ('id','extn','user','pswd','switch')
