from channels.generic.websocket import AsyncJsonWebsocketConsumer
from .exceptions import ClientError
from accounts.models import Agent

from channels.db import database_sync_to_async
import json
import logging


@database_sync_to_async
def get_boards(user):
    agent = Agent.objects.get(user__username=user)
    teams = agent.teams.all()
    boards = []
    for team in teams:
        boards.append(team.id)
    return boards


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

        self._boards = await get_boards(self.scope["user"])
        await self.join_boards()


    async def disconnect(self, key):
        pass

    async def receive_json(self, content):
        logging.info("Message recieved {}".format(content))

        try:
            if content["code"] == 101:
                await self.board_send(content) 

        except ClientError as e:
            await self.send_json({"error": e.code})

    """
    Methods for joining, leaving & communicating in the room 

    """ 
    async def join_boards(self):
        for key in self._boards:
            board_name = "board-{}".format(key)
            
            await self.channel_layer.group_add(
                board_name,
                self.channel_name,
            )

            await self.channel_layer.group_send(
                board_name, 
                {
                    "type": "chat.join",
                    "room_id": key,
                    "username": self.scope["user"].username,
                }
            )
        
    """
    Send message to the board
    """
    async def board_send(self, content):
        board_name = "board-{}".format(content["id"])

        await self.channel_layer.group_send(
            board_name,
            {
                "type": "chat.message",
                "room_id": content["id"],
                "username": self.scope["user"].username,
                "message": content["message"],
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
                "board": event["room_id"],
                "username": event["username"],
                "message": "joined the session",
            },
        )


    async def chat_message(self, event):
        """
        Called when someone has messaged our chat.
        """
        # Send a message down to the client
        await self.send_json(
            {
                "code": 101,
                "board": event["room_id"],
                "username": event["username"],
                "message": event["message"],
            },
        )
