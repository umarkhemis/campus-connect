from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Notification, NotificationDevice
from django.utils import timezone
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """Get user's notifications"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device(request):
    """Register user's device for push notifications"""
    device_token = request.data.get('device_token')
    device_type = request.data.get('device_type', 'android')
    
    if not device_token:
        return Response({'error': 'Device token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    device, created = NotificationDevice.objects.get_or_create(
        user=request.user,
        device_token=device_token,
        defaults={'device_type': device_type, 'is_active': True}
    )
    
    if not created:
        device.is_active = True
        device.device_type = device_type
        device.save()
    
    return Response({'message': 'Device registered successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    notification = get_object_or_404(
        Notification, 
        id=notification_id, 
        recipient=request.user
    )
    
    notification.mark_as_read()
    return Response({'message': 'Notification marked as read'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read"""
    Notification.objects.filter(
        recipient=request.user, 
        is_read=False
    ).update(is_read=True, read_at=timezone.now())
    
    return Response({'message': 'All notifications marked as read'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Get unread notification count"""
    count = Notification.objects.filter(
        recipient=request.user, 
        is_read=False
    ).count()
    
    return Response({'unread_count': count})

