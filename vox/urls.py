from django.conf.urls import url
from vox.views import *

urlpatterns = [
    url(r'^search/$', search, name='search'),
    url(r'^switches/$',TelSwitchViewSet.as_view({'get': 'all',}), name='vox-switches'),
    url(r'^switch/new/$',TelSwitchViewSet.as_view({'post': 'new',}), name='vox-switch-new'),
    url(r'^switch/delete/$',TelSwitchViewSet.as_view({'post': 'delete',}), name='vox-switch-delete'),
    # tel profile
    url(r'^telprofiles/$',TelProfileViewSet.as_view({'get': 'all',}), name='vox-tel-profiles'),
    url(r'^telprofile/new/$',TelProfileViewSet.as_view({'post': 'new',}), name='vox-telprofile-new'),
    url(r'^telprofile/delete/$',TelProfileViewSet.as_view({'post': 'delete',}), name='vox-telprofile-delete'),
]
