
from django.urls import path
from . views import (
    NotificationListView,
    register_device,
    mark_notification_read,
    mark_all_notifications_read,
    unread_count
)

urlpatterns = [
    
    # path('api/notifications/', include([
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/register-device/', register_device, name='register-device'),
    path('notifications/<uuid:notification_id>/read/', mark_notification_read, name='mark-notification-read'),
    path('notifications/mark-all-read/', mark_all_notifications_read, name='mark-all-read'),
    path('notifications/unread-count/', unread_count, name='unread-count'),
    # ])),
]