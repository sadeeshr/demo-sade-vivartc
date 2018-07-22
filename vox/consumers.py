from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from iris.exceptions import ClientError
from iris.models import Call

from hub.models import Channel
from hub.suitecrm import suitecrm
from controller.sessions import fetch_schema, fetch_user
from tenant_schemas.utils import schema_context

import json
import logging
from django.utils import timezone

@database_sync_to_async
def store_event(schema, user, content):
    try:
        with schema_context(schema):
            agent = user.agent
            status = content["event"]
            peer   = content["peer"]
            line = content["line"] 

            # Ringing (1) / Dialing (2)
            if status == 1 or status == 2:
                direction = '1' if status == 1 else '2'
                Call.objects.create(agent=agent, 
                                    peer=peer, 
                                    direction=direction,
                                    status=status, 
                                    line=line)

            # Connected (3)
            elif status == 3:
                call = Call.objects.filter(agent=agent, line=line).first()
                call.status = 5
                call.save()
            # Terminated (9)
            elif status == 9:
                call = Call.objects.filter(agent=agent, line=line).first()
                call.end = timezone.now()
                call.line = -1
                if call.status == 1:
                    call.status = 3
                    call.save()
                elif call.status == 2:
                    call.status = 4
                    call.save()
                elif call.status == 5:
                    call.status = 9
                    call.save()
                    # store it in suite crm     
                    channel = Channel.objects.get(type='1')
                    sc = suitecrm()
                    sc.connect(channel)
                    sc.log_call(call)
            
    except Exception as err:
        logging.warning("Store Vox event {}".format(str(err)))


class VoxConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        headers = self.scope.get("headers", [])
        schema = await fetch_schema(headers)
        user   = await fetch_user(schema, headers)
        # accept only authenticated clients
        if user is None:
            await self.close()
            return

        await self.accept()

    
    async def disconnect(self, key):
        pass

    
    """
    Recieve JSON Message
    Messages:-
    """
    async def receive_json(self, content):
        try:
            headers = self.scope.get("headers", [])
            schema = await fetch_schema(headers)
            user   = await fetch_user(schema, headers)
            await store_event(schema, user, content)

        except ClientError as e:
            await self.send_json({"error": e.code})
