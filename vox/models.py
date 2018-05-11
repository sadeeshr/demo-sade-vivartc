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
    extension  = models.CharField(max_length=20)
    account  = models.CharField(max_length=100, null=True, blank=True)
    pswd  = models.CharField(max_length=100, null=True, blank=True)
    switch = models.ForeignKey(TelSwitch, related_name="tel_profiles")

    # multi tenancy
    account = models.ForeignKey(Enterprise, related_name="tel_profiles")

    def __str__(self):
        return '%s' % self.extension

