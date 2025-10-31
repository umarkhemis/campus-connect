from django.db import models
import uuid
from django.db import models
from campus_connect.models import User, MarketplaceItem, LostAndFoundItem, ConnectionRequest, Message
from django.utils import timezone

class NotificationDevice(models.Model):
    """Store user's device tokens for push notifications"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_devices')
    device_token = models.TextField()  # FCM token or APNS token
    device_type = models.CharField(max_length=10, choices=[
        ('android', 'Android'),
        ('ios', 'iOS'),
        ('web', 'Web')
    ])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'device_token')
    
    def __str__(self):
        return f"{self.user.username} - {self.device_type}"


class Notification(models.Model):
    """Store all notifications"""
    NOTIFICATION_TYPES = [
        ('marketplace', 'New Marketplace Item'),
        ('lost_found', 'New Lost & Found Item'),
        ('connection_request', 'Connection Request'),
        ('connection_accepted', 'Connection Accepted'),
        ('new_message', 'New Message'),
        ('item_claimed', 'Item Claimed'),
        ('item_sold', 'Item Sold'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  # Additional data like item_id, etc.
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)  # Whether push notification was sent
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional: Link to related objects
    marketplace_item = models.ForeignKey(MarketplaceItem, on_delete=models.CASCADE, null=True, blank=True)
    lost_found_item = models.ForeignKey(LostAndFoundItem, on_delete=models.CASCADE, null=True, blank=True)
    connection_request = models.ForeignKey(ConnectionRequest, on_delete=models.CASCADE, null=True, blank=True)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['notification_type', '-created_at']),
        ]
    
    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def __str__(self):
        return f"{self.title} -> {self.recipient.username}"

