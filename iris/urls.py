from django.conf.urls import url
from iris.views import *

urlpatterns = [
    url(r'^at/mentions$', MentionInputViewSet.as_view({'get': 'all',}), name='at-mentions'),
    url(r'^team/messages$', MessageViewSet.as_view({'get': 'all',}), name='message-all'),
    url(r'^agent/messages$', MessageViewSet.as_view({'get': 'direct_messages',}), name='message-dm'),
]

