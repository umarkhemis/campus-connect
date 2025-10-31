

# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q
from .models import ChatRoom, Message
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'
        
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]
        
        if not token:
            logger.warning("No token provided in WebSocket connection")
            await self.close()
            return
        
        # Authenticate user with JWT token
        self.user = await self.get_user_from_jwt_token(token)
        
        if not self.user:
            logger.warning(f"Invalid token provided: {token[:20]}...")
            await self.close()
            return
        
        # Verify user has access to this chat room
        has_access = await self.verify_chat_room_access()
        if not has_access:
            logger.warning(f"User {self.user.username} doesn't have access to room {self.room_id}")
            await self.close()
            return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected for user {self.user.username} in room {self.room_id}")
        
        # Update user's online status
        await self.update_user_status(True)
    
    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
        
        # Update user's online status
        if hasattr(self, 'user') and self.user:
            await self.update_user_status(False)
        
        logger.info(f"WebSocket disconnected with code {close_code}")
    
    @database_sync_to_async
    def get_user_from_jwt_token(self, token):
        try:
            # Validate JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user from database
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist) as e:
            logger.error(f"JWT token validation failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during JWT validation: {str(e)}")
            return None
    
    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'chat_message')
            
            if message_type == 'chat_message':
                content = data.get('content', '').strip()
                if content:
                    # Save message to database
                    message = await self.save_message(content)
                    if message:
                        # Send message to room group
                        await self.channel_layer.group_send(
                            self.room_group_name,
                            {
                                'type': 'chat_message',
                                'message': {
                                    'id': str(message['id']),
                                    'content': message['content'],
                                    'sender': message['sender'],
                                    'created_at': message['created_at'],
                                    'message_type': message['message_type']
                                }
                            }
                        )
            
            elif message_type == 'typing':
                # Handle typing indicators
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'typing_indicator',
                        'user': self.user.username,
                        'is_typing': data.get('is_typing', False)
                    }
                )
            
            elif message_type == 'mark_read':
                # Mark messages as read
                await self.mark_messages_read()
                
            elif message_type == 'message_delivered':
                await self.update_message_status(data.get('message_id'), 'delivered')
            elif message_type == 'message_read':
                await self.update_message_status(data.get('message_id'), 'read')
        
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON'
            }))
        except Exception as e:
            logger.error(f"Error in receive method: {str(e)}")
            await self.send(text_data=json.dumps({
                'error': 'Server error'
            }))
    
    async def chat_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
        }))
    
    async def typing_indicator(self, event):
        # Don't send typing indicator to the user who's typing
        if event['user'] != self.user.username:
            await self.send(text_data=json.dumps({
                'type': 'typing_indicator',
                'user': event['user'],
                'is_typing': event['is_typing']
            }))
    
    @database_sync_to_async
    def verify_chat_room_access(self):
        try:
            chat_room = ChatRoom.objects.get(
                Q(user1=self.user) | Q(user2=self.user),
                id=self.room_id
            )
            return True
        except ChatRoom.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        try:
            chat_room = ChatRoom.objects.get(
                Q(user1=self.user) | Q(user2=self.user),
                id=self.room_id
            )
            
            message = Message.objects.create(
                chat_room=chat_room,
                sender=self.user,
                content=content,
                message_type='text'
            )
            
            # Update chat room timestamp
            chat_room.save()
            
            return {
                'id': message.id,
                'content': message.content,
                'sender': {
                    'id': self.user.id,
                    'username': self.user.username,
                },
                'created_at': message.created_at.isoformat(),
                'message_type': message.message_type
            }
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return None
    
    @database_sync_to_async
    def mark_messages_read(self):
        try:
            chat_room = ChatRoom.objects.get(
                Q(user1=self.user) | Q(user2=self.user),
                id=self.room_id
            )
            
            Message.objects.filter(
                chat_room=chat_room,
                is_read=False
            ).exclude(sender=self.user).update(is_read=True)
            
        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}")
    
    @database_sync_to_async
    def update_message_status(self, message_id, status):
        try:
            message = Message.objects.get(id=message_id)
            if status == 'delivered':
                message.is_delivered = True
            elif status == 'read':
                message.is_read = True
            message.save()
        except Exception as e:
            logger.error(f"Error updating message status: {str(e)}")
    
    @database_sync_to_async
    def update_user_status(self, is_online):
        # You can implement user online status tracking here
        # For now, we'll skip this implementation
        pass






























# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# # from django.contrib.auth.models import User
# from django.db.models import Q
# from .models import ChatRoom, Message
# from django.contrib.auth import get_user_model

# User = get_user_model()

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_id = self.scope['url_route']['kwargs']['room_id']
#         self.room_group_name = f'chat_{self.room_id}'
#         self.user = self.scope['user']
        
#         if not self.user.is_authenticated:
#             await self.close()
#             return
        
#         # Verify user has access to this chat room
#         has_access = await self.verify_chat_room_access()
#         if not has_access:
#             await self.close()
#             return
        
#         # Join room group
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
        
#         await self.accept()
        
#         # Update user's online status
#         await self.update_user_status(True)
    
#     async def disconnect(self, close_code):
#         # Leave room group
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )
        
#         # Update user's online status
#         await self.update_user_status(False)
    
#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             message_type = data.get('type', 'chat_message')
            
#             if message_type == 'chat_message':
#                 content = data.get('content', '').strip()
#                 if content:
#                     # Save message to database
#                     message = await self.save_message(content)
#                     if message:
#                         # Send message to room group
#                         await self.channel_layer.group_send(
#                             self.room_group_name,
#                             {
#                                 'type': 'chat_message',
#                                 'message': {
#                                     'id': str(message['id']),
#                                     'content': message['content'],
#                                     'sender': message['sender'],
#                                     'created_at': message['created_at'],
#                                     'message_type': message['message_type']
#                                 }
#                             }
#                         )
            
#             elif message_type == 'typing':
#                 # Handle typing indicators
#                 await self.channel_layer.group_send(
#                     self.room_group_name,
#                     {
#                         'type': 'typing_indicator',
#                         'user': self.user.username,
#                         'is_typing': data.get('is_typing', False)
#                     }
#                 )
            
#             elif message_type == 'mark_read':
#                 # Mark messages as read
#                 await self.mark_messages_read()
                
#             elif message_type == 'message_delivered':
#                 await self.update_message_status(data.get('message_id'), 'delivered')
#             elif message_type == 'message_read':
#                 await self.update_message_status(data.get('message_id'), 'read')
        
#         except json.JSONDecodeError:
#             await self.send(text_data=json.dumps({
#                 'error': 'Invalid JSON'
#             }))
    
#     async def chat_message(self, event):
#         message = event['message']
        
#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'type': 'chat_message',
#             'message': message
#         }))
    
#     async def typing_indicator(self, event):
#         # Don't send typing indicator to the user who's typing
#         if event['user'] != self.user.username:
#             await self.send(text_data=json.dumps({
#                 'type': 'typing_indicator',
#                 'user': event['user'],
#                 'is_typing': event['is_typing']
#             }))
    
#     @database_sync_to_async
#     def verify_chat_room_access(self):
#         try:
#             chat_room = ChatRoom.objects.get(
#                 Q(user1=self.user) | Q(user2=self.user),
#                 id=self.room_id
#             )
#             return True
#         except ChatRoom.DoesNotExist:
#             return False
    
#     @database_sync_to_async
#     def save_message(self, content):
#         try:
#             chat_room = ChatRoom.objects.get(
#                 Q(user1=self.user) | Q(user2=self.user),
#                 id=self.room_id
#             )
            
#             message = Message.objects.create(
#                 chat_room=chat_room,
#                 sender=self.user,
#                 content=content,
#                 message_type='text'
#             )
            
#             # Update chat room timestamp
#             chat_room.save()
            
#             return {
#                 'id': message.id,
#                 'content': message.content,
#                 'sender': {
#                     'id': self.user.id,
#                     'username': self.user.username,
#                     # 'first_name': self.user.first_name,
#                     # 'last_name': self.user.last_name
#                 },
#                 'created_at': message.created_at.isoformat(),
#                 'message_type': message.message_type
#             }
#         except Exception as e:
#             return None
    
#     @database_sync_to_async
#     def mark_messages_read(self):
#         try:
#             chat_room = ChatRoom.objects.get(
#                 Q(user1=self.user) | Q(user2=self.user),
#                 id=self.room_id
#             )
            
#             Message.objects.filter(
#                 chat_room=chat_room,
#                 is_read=False
#             ).exclude(sender=self.user).update(is_read=True)
            
#         except Exception as e:
#             pass
    
#     @database_sync_to_async
#     def update_user_status(self, is_online):
#         # You can implement user online status tracking here
#         # For now, we'll skip this implementation
#         pass