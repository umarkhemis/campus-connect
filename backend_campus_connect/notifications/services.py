
import json
import requests
from django.conf import settings
# from django.contrib.auth.models import User
from campus_connect.models import User
from django.db import transaction
from typing import List, Dict, Optional
import logging
from .models import Notification, NotificationDevice

logger = logging.getLogger(__name__)

class NotificationService:
    """Handle creating and sending push notifications"""
    
    def __init__(self):
        self.fcm_server_key = getattr(settings, 'FCM_SERVER_KEY', None)
        self.fcm_url = "https://fcm.googleapis.com/fcm/send"
    
    def create_notification(self, 
                          recipient: User, 
                          notification_type: str,
                          title: str, 
                          message: str, 
                          sender: User = None,
                          data: Dict = None,
                          **related_objects) -> 'Notification':
        """Create a notification record"""
        
        notification_data = data or {}
        
        notification = Notification.objects.create(
            recipient=recipient,
            sender=sender,
            notification_type=notification_type,
            title=title,
            message=message,
            data=notification_data,
            **related_objects
        )
        
        # Send push notification asynchronously
        self.send_push_notification(notification)
        
        return notification
    
    def send_push_notification(self, notification: 'Notification'):
        """Send push notification to user's devices"""
        if not self.fcm_server_key:
            logger.warning("FCM_SERVER_KEY not configured")
            return
        
        devices = NotificationDevice.objects.filter(
            user=notification.recipient,
            is_active=True
        )
        
        if not devices.exists():
            return
        
        payload = {
            "notification": {
                "title": notification.title,
                "body": notification.message,
                "sound": "default",
                "badge": self.get_unread_count(notification.recipient)
            },
            "data": {
                "notification_id": str(notification.id),
                "type": notification.notification_type,
                **notification.data
            }
        }
        
        success_count = 0
        for device in devices:
            try:
                payload["to"] = device.device_token
                
                headers = {
                    "Authorization": f"key={self.fcm_server_key}",
                    "Content-Type": "application/json"
                }
                
                response = requests.post(
                    self.fcm_url,
                    data=json.dumps(payload),
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success', 0) > 0:
                        success_count += 1
                    else:
                        # Token might be invalid, deactivate it
                        if result.get('failure', 0) > 0:
                            device.is_active = False
                            device.save()
                
            except Exception as e:
                logger.error(f"Failed to send notification to device {device.id}: {e}")
        
        if success_count > 0:
            notification.is_sent = True
            notification.save(update_fields=['is_sent'])
    
    def get_unread_count(self, user: User) -> int:
        """Get unread notification count for badge"""
        return Notification.objects.filter(recipient=user, is_read=False).count()
    
    # Specific notification methods
    
    def notify_new_marketplace_item(self, marketplace_item, exclude_user: User = None):
        """Notify all users about new marketplace item"""
        users = User.objects.exclude(id=marketplace_item.seller.id)
        if exclude_user:
            users = users.exclude(id=exclude_user.id)
        
        for user in users:
            self.create_notification(
                recipient=user,
                sender=marketplace_item.seller,
                notification_type='marketplace',
                title='New Item for Sale!',
                message=f'{marketplace_item.seller.username} posted "{marketplace_item.title}" for ${marketplace_item.price}',
                data={
                    'item_id': marketplace_item.id,
                    'category': marketplace_item.category,
                    'price': str(marketplace_item.price)
                },
                marketplace_item=marketplace_item
            )
    
    def notify_new_lost_found_item(self, lost_found_item, exclude_user: User = None):
        """Notify all users about new lost & found item"""
        users = User.objects.exclude(id=lost_found_item.owner.id)
        if exclude_user:
            users = users.exclude(id=exclude_user.id)
        
        status_text = "Lost" if lost_found_item.status == 'lost' else "Found"
        
        for user in users:
            self.create_notification(
                recipient=user,
                sender=lost_found_item.owner,
                notification_type='lost_found',
                title=f'Item {status_text}!',
                message=f'{lost_found_item.owner.username} reported: "{lost_found_item.title}" - {status_text} at {lost_found_item.location}',
                data={
                    'item_id': lost_found_item.id,
                    'status': lost_found_item.status,
                    'location': lost_found_item.location
                },
                lost_found_item=lost_found_item
            )
    
    def notify_connection_request(self, connection_request):
        """Notify user about incoming connection request"""
        self.create_notification(
            recipient=connection_request.receiver,
            sender=connection_request.sender,
            notification_type='connection_request',
            title='New Connection Request',
            message=f'{connection_request.sender.username} wants to connect with you',
            data={
                'request_id': connection_request.id,
                'sender_id': connection_request.sender.id
            },
            connection_request=connection_request
        )
    
    def notify_connection_accepted(self, connection_request):
        """Notify sender that connection request was accepted"""
        self.create_notification(
            recipient=connection_request.sender,
            sender=connection_request.receiver,
            notification_type='connection_accepted',
            title='Connection Request Accepted',
            message=f'{connection_request.receiver.username} accepted your connection request',
            data={
                'request_id': connection_request.id,
                'accepter_id': connection_request.receiver.id
            },
            connection_request=connection_request
        )
    
    def notify_new_message(self, message, recipient: User):
        """Notify user about new chat message"""
        # Don't notify if the message is from the same user
        if message.sender == recipient:
            return
        
        # Check if user is currently in the chat (you might want to track this)
        # For now, we'll always send notification
        
        self.create_notification(
            recipient=recipient,
            sender=message.sender,
            notification_type='new_message',
            title=f'New message from {message.sender.username}',
            # message=message.content[:100] + ('...' if len(message.content) > 100 else ''),
            data={
                'message_id': str(message.id),
                'chat_room_id': str(message.chat_room.id),
                'sender_id': message.sender.id
            },
            message=message
        )