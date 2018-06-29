from django.db import models
from jsonfield import JSONField

# Create your models here.

"""
Supported integrations
"""
class Channel(models.Model):
    TYPE_CHOICES = (
        ('1', 'Suite CRM'),
        ('2', 'Vtiger'),
        ('3', 'Salesforce'),
        ('4', 'Freshdesk'),
    )

    CATEGORY_CHOICES = (
        ('1', 'CRM'),
        ('2', 'Support'),

    )
   
    # name of the channel
    name = models.CharField(max_length=120, unique=True)
    type = models.CharField(choices=TYPE_CHOICES, default='1', max_length=2)
    category = models.CharField(choices=CATEGORY_CHOICES, default='1', max_length=2)
    address = models.URLField()
     
    # last synchronize time 
    last_sync = models.DateTimeField(blank=True, null=True)


    def __str__(self):
        return '%s' % self.name


class SuiteCrm(models.Model):

    # domain or ipaddres
    client_id = models.CharField(max_length=200)
    client_secret = models.CharField(max_length=200)
    channel = models.OneToOneField(Channel, related_name='suitecrm')
    auth_expires  = models.DateTimeField(blank=True, null=True)
    auth_response = JSONField(null=True, blank=True) 

    class Meta:
        db_table = 'hub_suitecrm'

    def __str__(self):
        return '%s' % self.channel
