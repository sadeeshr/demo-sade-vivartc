from django.conf.urls import url
from vox.views import *

urlpatterns = [
    url(r'^search/$', search, name='search'),
]
