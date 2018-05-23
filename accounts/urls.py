from django.conf.urls import url
from accounts.views import *

urlpatterns = [
    # basic login & logout
    url(r'^home/$', home, name='home'),
    url(r'^login/$', login, name='login'),
    url(r'^logout/$', logout, name='logout'),

    # Tribe pad/board
    url(r'^tribe/pad/$', tribe_pad, name='tribe-pad'),

    url(r'^team/record/$',TeamViewSet.as_view({'get': 'record',}), name='team-record'),

]
