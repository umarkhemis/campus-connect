
from django.db.models.signals import post_save
from django.dispatch import receiver
from .services import NotificationService

notification_service = NotificationService()

@receiver(post_save, sender='campus_connect.MarketplaceItem')
def marketplace_item_created(sender, instance, created, **kwargs):
    """Send notification when new marketplace item is created"""
    if created:
        notification_service.notify_new_marketplace_item(instance)

@receiver(post_save, sender='campus_connect.LostAndFoundItem')  
def lost_found_item_created(sender, instance, created, **kwargs):
    """Send notification when new lost & found item is created"""
    if created:
        notification_service.notify_new_lost_found_item(instance)

@receiver(post_save, sender='campus_connect.ConnectionRequest')
def connection_request_created(sender, instance, created, **kwargs):
    """Send notification for connection requests"""
    if created:
        notification_service.notify_connection_request(instance)
    elif instance.status == 'accepted':
        notification_service.notify_connection_accepted(instance)

@receiver(post_save, sender='campus_connect.Message')
def message_created(sender, instance, created, **kwargs):
    """Send notification for new messages"""
    if created:
        # Get the recipient (other user in chat room)
        recipient = instance.chat_room.get_other_user(instance.sender)
        notification_service.notify_new_message(instance, recipient)
