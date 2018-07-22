"""
Celery task scheduler for News module
"""
from __future__ import absolute_import, unicode_literals
from celery import task
import logging

from hub.models import *
from hub.suitecrm import suitecrm
from django.utils import timezone
from tenant_schemas.utils import schema_context
from controller.models import *



"""
celery task routine for synchronizing external sources
"""
@task
def sync_all():
    print("sync started")
    try:
        clients = Client.objects.filter(is_active=True)
        for client in clients:
            with schema_context(client.schema_name):
                channels = Channel.objects.filter(type='1')
                for channel in channels:
                    sc = suitecrm()
                    sc.connect(channel)
                    sc.sync_contacts()
                    sc.sync_leads()
                    sc.sync_meetings()
                    channel.last_sync = timezone.now() 
                    channel.save()
                    print("sync completed")

    except Exception as err:
        logging.warning("Hub Sync all {}".format(str(err)))
    
