from django.db import models
from django.contrib.auth.models import User
from jsonfield import JSONField


# Create your models here.

# Subscription Plans
class Enterprise(models.Model):
 
    SECTOR_CHOICES = (
        ('1', 'Retail'),
        ('2', 'Technology'),
        ('3', 'Travel'),
    )
   
    # Account name
    # eg: Name of the Orgainization
    name = models.CharField(max_length=100)
    # Email associated with the account
    email = models.EmailField(max_length=100, unique=True)
    phone = models.CharField(max_length=20, null=True)
    logo = models.ImageField(upload_to='logo', null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    website = models.CharField(max_length=200)
    active = models.BooleanField(default = False)
    
    # sector
    sector = models.CharField(choices=SECTOR_CHOICES, default='2', max_length=2)

    def __str__(self):
        return '%s' % self.name 
 
from vox.models import TelProfile, ConfProfile

class Agent(models.Model):

    ROLE_CHOICE = (
        ('1', 'Admin'), #Administrator
        ('2', 'Supervisor'),
        ('3', 'Crew'),
    )

    user = models.OneToOneField(User)
    title = models.CharField(max_length=100, null=True)

    # profile information
    phone   = models.CharField(max_length=20, null=True)
    address = models.TextField(null=True, blank=True)
    photo = models.ImageField(upload_to='photo', null=True, blank=True)
     
    tel_profile = models.ForeignKey(TelProfile, null=True, blank=True, related_name='agents')
    account = models.ForeignKey(Enterprise, related_name='agents')
    
    role = models.CharField(choices=ROLE_CHOICE, default='3', max_length=1)

    settings = JSONField(default={})

    def __str__(self):
        return '%s' % self.user
    
    def is_tel_busy(self):
        calls = self.calls.filter(status__in=('1','2','5'))  
        if len(calls) > 0:
            return True
        return False


class Team(models.Model):
    
    name = models.CharField(max_length=40, unique=True)   
    description = models.TextField(null=True, blank=True) 
    members = models.ManyToManyField(Agent, through='TeamMembership', related_name='teams')

    conf_profile = models.ForeignKey(ConfProfile, null=True, blank=True, related_name='teams')
    account = models.ForeignKey(Enterprise, related_name='teams')

    def __str__(self):
        return '%s' % self.name 


class TeamMembership(models.Model):
    ROLE_CHOICE = (
        ('1', 'Lead'), #moderator, admin
        ('2', 'Member'),
    )
    user = models.ForeignKey(Agent)
    team = models.ForeignKey(Team)
    role = models.CharField(choices=ROLE_CHOICE, default='2', max_length=1)

