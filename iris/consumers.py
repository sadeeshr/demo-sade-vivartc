from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .exceptions import ClientError
from accounts.models import Agent, Team
from iris.models import Message, DirectMessage, Presence
from django.contrib.auth.models import User
from tenant_schemas.utils import schema_context

from channels.db import database_sync_to_async
import json
import logging

from controller.sessions import fetch_schema, fetch_user

@database_sync_to_async
def register(user, channel_name):
    agent = user.agent
    teams = agent.teams.all()
    boards = []

    presence, created = Presence.objects.get_or_create(user=user)
    presence.channel_name = channel_name
    presence.save()
    for team in teams:
        board_name = "{}-board-{}".format(schema, team.id)
        boards.append(board_name)
    # add to the Organization Board
    boards.append("{}-board".format(schema))
    
    return boards

@database_sync_to_async
def deregister(user, channel_name):
    presence = resence.objects.get(user=user)
    presence.channel_name = None
    presence.save()

@database_sync_to_async
def store_message(user, data):
    code   = data["code"]
    team = None
    if code == 101:
        text   = data["message"] 
        board_id = data["id"]
        team = Team.objects.get(id=board_id)
        Message.objects.create(author=user, team=team, content=text)
        return board_id
    elif code == 201:
        text   = data["message"]
        agent_id = data["id"]
        agent = Agent.objects.get(id=agent_id)
        message = Message.objects.create(author=user, content=text)
        DirectMessage.objects.create(to=agent.user, message=message) 
        return agent.user.presence.channel_name
    elif code == 80:
        status = data["status"]
        pres, created = Presence.objects.get_or_create(user=user) 
        pres.status = status
        pres.save()
        key = "{}-board".format(schema)
        return key
    elif code == 81:
        text = data["status_text"]
        status = data["status"]
        pres, created = Presence.objects.get_or_create(user=user) 
        pres.text = text
        pres.save()
        key = "{}-board".format(schema)
        return key
        
    
class TribeConsumer(AsyncJsonWebsocketConsumer):
    
    """
    This chat consumer handles websocket connections for tribe
    clients.

    """
    async def connect(self):
        headers = self.scope.get("headers", [])
        await self.accept()
        self._boards = set()
        boards = await register(user, self.channel_name)
        await self.join_boards(user, boards)
        await self.send_status(schema, user, 1)
        

    async def disconnect(self, key):
        headers = self.scope.get("headers", [])
        for board_id in list(self._boards):
            try:
                await self.leave_board(board_id)
            except ClientError:
                pass         


    async def receive_json(self, content):
        logging.info("Message recieved {}".format(content))
        try:
            headers = self.scope.get("headers", [])
            if content["code"] == 101:
                await self.board_send(user, content, key) 
                await store_message(user, content)
            elif content["code"] == 201:
                key = await store_message(user, content)
                await self.board_send(user, content, key) 
            elif content["code"] == 80 or content["code"] == 81:  
                key = await store_message(user, content)
                await self.board_send(user, content, key) 
            

        except ClientError as e:
            await self.send_json({"error": e.code})

    """
    Methods for joining, leaving & communicating in the room 

    """ 
    async def join_boards(self, user, boards):
        for key in boards:
            print(key)
            #await self.channel_layer.group_send(
            #    key, 
            #    {
            #        "type": "chat.join",
            #        "board": key,
            #        "uid": user.id,
            #        "dn": user.get_full_name(),
            #        "message": "joined the session",
            #    }
            #)
            # add to the room list
            self._boards.add(key)

            await self.channel_layer.group_add(
                key,
                self.channel_name,
            )
            

    async def leave_board(self, user, board_id):
       
        #await self.channel_layer.group_send(
        #    board_name,
        #    {
        #        "type": "chat.leave",
        #        "board": board_id,
        #        "uid": user.id,
        #        "dn": user.get_full_name(),
        #        "message": "left the session",
        #    }
        #)

        self._boards.discard(board_id)

        await self.channel_layer.group_discard(
            board_id,
            self.channel_name,
        )
         
    async def send_status(self, schema, user, status):
        board_name = "{}-board".format(schema)         
 
        await self.channel_layer.group_send(
            board_name,
            {
                "type": "chat.presence",
                "code": 80,
                "room_id": 0,
                "user": user.username,
                "status": status,
                "status_text": "",
            }
        )
        
        
    """
    Send message to the board
    """
    async def board_send(self, user, content, key):
        board_name = key
        message = ""

        if content["code"] == 80 or content["code"] == 81:
            status = content["status"]
            status_text = content["status_text"]
            print("Before sending presence message")
            await self.channel_layer.group_send(
                board_name,
                {
                    "type": "chat.presence",
                    "code": content["code"],
                    "room_id": 0,
                    "user": user.username,
                    "status": status,
                    "status_text": status_text,
                }
            )
        elif content["code"] == 201:
            await self.channel_layer.send(key, {
                "type": "chat.message",
                "code": content["code"],
                "room_id": content["id"],
                "username": user.username,
                "message": content["message"],
            })
 
        else:
            message = content["message"]
            await self.channel_layer.group_send(
                board_name,
                {
                    "type": "chat.message",
                    "code": content["code"],
                    "room_id": content["id"],
                    "username": user.username,
                    "message": message,
                }
            )


    ## Message handler
    """
    Msg code: 0 - Board Notification 
    """
    async def chat_join(self, event):
        """
        Called when someone has joined our chat.
        """
        # Send a message down to the client
        await self.send_json(
            {
                "code": 100,
                "board": event["board"],
                "uid": event["uid"],
                "dn": event["dn"],  #display name
                "message": event["message"],
            },
        )

    async def chat_leave(self, event):
        """
        Called when someone has left our chat.
        """
        await self.send_json(
            {
                "code": 102,
                "board": event["board"],
                "uid": event["uid"],
                "dn": event["dn"],
                "message": event["message"],
            },
        )


    async def chat_presence(self, event):
        """
        Called when someone has messaged our chat.
        """
        print("Inside presence")
        # Send a message down to the client
        await self.send_json(
            {
                "code": event["code"],
                "board": event["room_id"],
                "user": event["user"],
                "status": event["status"],
                "status_text": event["status_text"],
            },
        )

    async def chat_message(self, event):
        """
        Called when someone has messaged our chat.
        """
        # Send a message down to the client
        await self.send_json(
            {
                "code": event["code"],
                "board": event["room_id"],
                "username": event["username"],
                "message": event["message"],
            },
        )

from channels.layers import get_channel_layer

def push_presence(request, presence):
    channel_layer = get_channel_layer()
    user = request.user
    schema_name = request.tenant.schema_name
    board_name = "{}-board".format(schema_name)
    status = presence.status
    
    channel_layer.group_send(
        board_name,
        {"type": "chat.presence", "code": 80, "room_id": 0, "user":user.username, "status":status, "status_text": ""},
    )
