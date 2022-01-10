import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
  def connect(self):
    self.session_id = self.scope['url_route']['kwargs']['session_id']
    self.session_id_group_name = f'channel_{self.session_id}'

    async_to_sync(self.channel_layer.group_add)(
      self.session_id_group_name,
      self.channel_name
    )

    self.accept
  
  def disconnect(self, code):
    print(code)
    async_to_sync(self.channel_layer.group_discard)(
      self.session_id_group_name,
      self.channel_name
    )
  
  def receive(self, text_data, bytes_data=None):
    text_data_json = json.loads(text_data)
    message = text_data_json['message']

    async_to_sync(self.channel_layer.group_send)(
      self.session_id_group_name,
      {
        'type': 'chat_message',
        'message': message
      }
    )

  def chat_message(self, event):
    data_str = json.dumps({'message': event['message']})
    self.send(text_data=data_str)