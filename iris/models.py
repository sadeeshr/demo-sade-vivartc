from django.db import models
from accounts.models import *

# Create your models here.
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
