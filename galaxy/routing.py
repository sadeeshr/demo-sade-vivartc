from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.conf.urls import url

from iris.consumers import TribeConsumer
from vox.consumers import VoxConsumer

application = ProtocolTypeRouter({
    'websocket': AuthMiddlewareStack(
        URLRouter([
            url(r'^iris/tribe/$', TribeConsumer),
            url(r'^vox/board/$', VoxConsumer),
        ])
    ),
})

