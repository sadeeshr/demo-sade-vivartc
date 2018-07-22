from django.db import models
from accounts.models import *
from hub.models import Channel

# Create your models here.
class Presence(models.Model):
    STATUS_CHOICES = (
        ('0', 'Offline'),
        ('1', 'Online'),
        ('2', 'Busy'),
        ('3', 'Do not Disturb'),
        ('4', 'Away'),
    )    

    user = models.OneToOneField(User)    
    status = models.CharField(choices=STATUS_CHOICES, default='0', max_length=2)
    text = models.CharField(max_length=200, null=True, blank=True)
    channel_name = models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return '{}'.format(self.get_status_display())


class Message(models.Model):

    author  = models.ForeignKey(User, related_name="own_messages") 
    team    = models.ForeignKey(Team, null=True, blank=True, related_name="messages")

    content = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return '{} ..'.format(self.content[:20])

class DirectMessage(models.Model):
    to = models.ForeignKey(User, related_name="direct_messages") 
    message = models.ForeignKey(Message, related_name="direct_messages")

    def __str__(self):
        return '{}'.format(self.message)

    
class MessageAttachment(models.Model):
    name = models.FileField(upload_to='uploads/')
    message = models.ForeignKey(Message, related_name="attachments")

    def __str__(self):
        return '{}'.format(self.name)


class Call(models.Model):
    DIRECTION_CHOICES = (
        ('1', 'Incoming'),
        ('2', 'Outgoing'),
    )

    STATUS_CHOICES = (
        (0, 'Idle'),
        (1, 'Ringing'),
        (2, 'Dialing'),
        (3, 'Missed'),
        (4, 'Failed'),
        (5, 'In Call'),
        (9, 'Completed'),    
    )

    agent =  models.ForeignKey(Agent, related_name="calls")    
    peer  = models.CharField(max_length=40)
    start   = models.DateTimeField(auto_now_add=True)
    end     = models.DateTimeField(null=True, blank=True)
    line  = models.IntegerField(default=-1)
    direction = models.CharField(choices=DIRECTION_CHOICES, default='1', max_length=1)
    status = models.IntegerField(choices=STATUS_CHOICES, default=0)

    class Meta:
        ordering = ['-start'] 

    def __str__(self):
        return '{} >> {}'.format(self.agent, self.peer)    
    

class CallActivity(models.Model):
    subject = models.TextField()
    call = models.ForeignKey(Call, related_name="activities") 
    timestamp = models.DateTimeField(auto_now_add=True) 

    def __str__(self):
        return '{}'.format(self.subject)    


class Meeting(models.Model):
    TYPE_CHOICES = (
        ('0', 'Tele'),
        ('1', 'Direct'),
    )    

    subject = models.CharField(max_length=200)
    start   = models.DateTimeField()
    end     = models.DateTimeField()
    description = models.TextField(null=True, blank=True)

    type = models.CharField(choices=TYPE_CHOICES, default='1', max_length=2)    
    conf_profile = models.ForeignKey(ConfProfile, null=True, blank=True, related_name="conferences")

    # Source
    channel = models.ForeignKey(Channel, null=True, blank=True, related_name="meetings")
    source_id =  models.CharField(max_length=200, null=True, blank=True)

    def __str__(self):
        return '{}'.format(self.subject)

