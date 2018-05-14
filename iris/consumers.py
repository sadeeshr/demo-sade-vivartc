from channels.generic.websocket import WebsocketConsumer
import json
import logging


class TribeConsumer(WebsocketConsumer):
    
    def connect(self):
        self.accept()
        logging.info("Channel Name {}".format(self.channel_name))

    def disconnect(self, key):
        pass

    def receive(self, text_data):
        data = json.loads(text_data)
        logging.info("Message recieved {}".format(data))

        self.send(text_data=json.dumps({
            'message': "Message Ack"
        }))
        
    
