from django.conf.urls import url
from accounts.views import *

urlpatterns = [
    # basic login & logout
    url(r'^home/$', home, name='home'),
    url(r'^login/$', login, name='login'),
    url(r'^logout/$', logout, name='logout'),

    # rest APIs
    url(r'^team/record/$',TeamViewSet.as_view({'get': 'record',}), name='team-record'),
    url(r'^team/new/$',TeamViewSet.as_view({'post': 'new',}), name='team-new'),
    url(r'^team/delete/$',TeamViewSet.as_view({'post': 'delete',}), name='team-delete'),
    # Agent
    url(r'^agent/record/$',AgentViewSet.as_view({'get': 'record',}), name='agent-record'),
    url(r'^agent/new/$',AgentViewSet.as_view({'post': 'new',}), name='agent-new'),
    url(r'^agent/delete/$',AgentViewSet.as_view({'post': 'delete',}), name='agent-delete'),
    # profile
    url(r'^profile/update/$',AgentViewSet.as_view({'post': 'profile_update',}), name='profile-update'),
    url(r'^ws/settings/$',AgentViewSet.as_view({'post': 'ws_settings',}), name='ws-settings'),

]
