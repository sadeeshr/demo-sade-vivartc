"""
Celery task scheduler for News module
"""
from __future__ import absolute_import, unicode_literals
from celery import task
import logging

from hub.models import *
from hub.suitecrm import suitecrm
from django.utils import timezone


"""
celery task routine for synchronizing external sources
"""
@task
def sync_all():
    print("sync started")
    try:
        channels = Channel.objects.filter(type='1')
        for channel in channels:
            sc = suitecrm()
            sc.connect(channel.name)
            sc.sync_contacts()
            sc.sync_leads()
            sc.sync_meetings()
            channel.last_sync = timezone.now() 
            channel.save()
            print("sync completed")

    except Exception as err:
        logging.warning("Hub Sync all {}".format(str(err)))
    
