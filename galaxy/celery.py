from __future__ import absolute_import, unicode_literals
from celery import Celery

import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'galaxy.settings')
app = Celery('galaxy')

# Using a string here means the worker don't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')
#auto discover tasks
app.autodiscover_tasks()

