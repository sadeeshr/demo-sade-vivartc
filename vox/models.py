from django.db import models
from accounts.models import Enterprise 

# Create your models here.

# generic model
# pre-populated  
class SwitchModel(models.Model):
    name  = models.CharField(max_length=200)
    desc = models.TextField(null=True, blank=True)

    def __str__(self):
        return '%s' % self.name

class TelSwitch(models.Model):
    name  = models.CharField(max_length=100)
    domain = models.CharField(max_length=100, null=True, blank=True)
    address = models.CharField(max_length=100, null=True, blank=True)
    make = models.ForeignKey(SwitchModel, related_name="tel_exchanges")
 
    # multi tenancy
    account = models.ForeignKey(Enterprise, related_name="tel_exchanges")

    def __str__(self):
        return '%s' % self.name

class TelProfile(models.Model):
    extn  = models.CharField(max_length=20)
    user  = models.CharField(max_length=100, null=True, blank=True)
    pswd  = models.CharField(max_length=100, null=True, blank=True)
    switch = models.ForeignKey(TelSwitch, related_name="tel_profiles")
    # Voice Mail infomation

    # multi tenancy
    account = models.ForeignKey(Enterprise, related_name="tel_profiles")

    def __str__(self):
        return '%s' % self.extn

class ConfProfile(models.Model):
    bridge_id =  models.CharField(max_length=20)
    password = models.CharField(max_length=100, null=True, blank=True)
    switch = models.ForeignKey(TelSwitch, related_name="conf_profiles") 
   
    
    def __str__(self):
        return '%s' % self.bridge_id
 
class Contact(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    mobile = models.CharField(max_length=20, null=True, blank=True)
    work = models.CharField(max_length=20, null=True, blank=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    company = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=100, null=True, blank=True)
    photo = models.ImageField(upload_to='photo', null=True, blank=True)

    # add source later
    
    def __str__(self):
        return '%s' % self.first_name

    def full_name(self):
        return '{} {}'.format(self.first_name, self.last_name)
