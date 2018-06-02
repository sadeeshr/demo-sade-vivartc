from django.db import models
from accounts.models import *

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
