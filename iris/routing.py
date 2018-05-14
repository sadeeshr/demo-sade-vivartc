from django.conf.urls import url

from iris.consumers import *

ws_urlpatterns = [
    url(r'^iris/tribe/$', TribeConsumer),
]
