from django.conf.urls import url
from accounts.views import *

urlpatterns = [
    url(r'^home/$', home, name='home'),
    url(r'^login/$', login, name='login'),
    url(r'^logout/$', logout, name='logout'),
]
