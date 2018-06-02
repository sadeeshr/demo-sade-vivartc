from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .exceptions import ClientError
from accounts.models import Agent, Team
from iris.models import Message, Presence
from django.contrib.auth.models import User

from channels.db import database_sync_to_async
import json
import logging


@database_sync_to_async
def get_boards(user):
    agent = user.agent
    teams = agent.teams.all()
    boards = []
    for team in teams:
        boards.append(team.id)
    
    # add to the Organization Board
    boards.append("account-{}".format(agent.account.id))
    
    return boards

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
    elif code == 80:
        text = data["status-text"]
        status = data["status"]
        pres, created = Presence.objects.get_or_create(user=user) 
        pres.status = status
        pres.text = text
        pres.save()
        key = "account-{}".format(user.agent.account.id)
        return key
        
    

class TribeConsumer(AsyncJsonWebsocketConsumer):
    
    """
    This chat consumer handles websocket connections for tribe
    clients.

    """
    async def connect(self):
        # accept only authenticated clients
        if self.scope["user"].is_anonymous:
            # user is not looged in 
            await self.close()
        else:
            await self.accept()

        self._boards = set()
        boards = await get_boards(self.scope["user"])
        await self.join_boards(boards)

    async def disconnect(self, key):
        print("Entering Disconnect")
        for board_id in list(self._boards):
            try:
                print("Leave board %s", board_id)
                await self.leave_board(board_id)
            except ClientError:
                pass         


    async def receive_json(self, content):
        logging.info("Message recieved {}".format(content))

        try:
            if content["code"] == 101:
                await self.board_send(content, content["id"]) 
                await store_message(self.scope["user"], content)
            elif content["code"] == 80:  
                key = await store_message(self.scope["user"], content)
                await self.board_send(content, key) 
            

        except ClientError as e:
            await self.send_json({"error": e.code})

    """
    Methods for joining, leaving & communicating in the room 

    """ 
    async def join_boards(self, boards):
        for key in boards:
            board_name = "board-{}".format(key)

            await self.channel_layer.group_send(
                board_name, 
                {
                    "type": "chat.join",
                    "board": key,
                    "uid": self.scope["user"].id,
                    "dn": self.scope["user"].get_full_name(),
                    "message": "joined the session",
                }
            )
            # add to the room list
            self._boards.add(key)

            await self.channel_layer.group_add(
                board_name,
                self.channel_name,
            )
            

    async def leave_board(self, board_id):
       
        board_name = "board-{}".format(board_id) 

        await self.channel_layer.group_send(
            board_name,
            {
                "type": "chat.leave",
                "board": board_id,
                "uid": self.scope["user"].id,
                "dn": self.scope["user"].get_full_name(),
                "message": "left the session",
            }
        )

        self._boards.discard(board_id)

        await self.channel_layer.group_discard(
            board_name,
            self.channel_name,
        )
         
            
        
    """
    Send message to the board
    """
    async def board_send(self, content, key):
        board_name = "board-{}".format(key)
        message = ""
        status = ""
        status_text = ""

        if "message" in content:
            message = content["message"]
            mode = "chat.message" 
        if "status" in content:
            status = content["status"]
            mode = "chat.presence" 
        if "status-text" in content:
            status_text = content["status-text"]

        logging.info("Board Send {}".format(key))

        await self.channel_layer.group_send(
            board_name,
            {
                "type": mode,
                "code": content["code"],
                "room_id": key,
                "username": self.scope["user"].username,
                "message": message,
                "status": status,
                "status-text": status_text,
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
                "username": event["username"],
                "status": event["status"],
                "status-text": event["status-text"],
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
