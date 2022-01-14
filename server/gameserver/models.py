from django.db import models

# Create your models here.
class GameSession(models.Model):
  session_id = models.UUIDField(primary_key=True, editable=False)
  host_client_id = models.UUIDField(editable=False)
  guest_client_id = models.UUIDField(editable=False)
  game_state = models.JSONField()

  def __str__(self) -> str:
    return f'[ session: {self.session_id} host: {self.host_client_id} guest: {self.guest_client_id} state: {self.game_state} ]'

class WebsocketMessage(models.Model):
  session_id = models.UUIDField(editable=False)
  client_id = models.UUIDField(editable=False)
  timestamp = models.IntegerField(editable=False)
  json = models.JSONField()

  class Meta:
    indexes = [models.Index(fields=['session_id', 'timestamp'])]

  def __str__(self) -> str:
    return f'[ session: {self.session_id} client: {self.client_id} timestamp: {self.timestamp} ]'