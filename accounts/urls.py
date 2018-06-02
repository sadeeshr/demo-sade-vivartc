from django.conf.urls import url
from accounts.views import *

urlpatterns = [
    # basic login & logout
    url(r'^home/$', home, name='home'),
    url(r'^login/$', login, name='login'),
    url(r'^logout/$', logout, name='logout'),

    # rest APIs
    url(r'^team/record/$',TeamViewSet.as_view({'get': 'record',}), name='team-record'),
    url(r'^agent/record/$',AgentViewSet.as_view({'get': 'record',}), name='agent-record'),
    url(r'^ws/settings/$',AgentViewSet.as_view({'post': 'ws_settings',}), name='ws-settings'),

]
