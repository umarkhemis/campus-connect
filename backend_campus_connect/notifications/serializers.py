
from rest_framework import serializers
from .models import NotificationDevice, Notification
from campus_connect.serializers import UserSerializer  # Assuming you have a UserSerializer


class NotificationDeviceSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)  # Show username instead of ID
    
    class Meta:
        model = NotificationDevice
        fields = [
            'id',
            'user',
            'device_token',
            'device_type',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Automatically set the user to the current logged-in user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    recipient = serializers.StringRelatedField(read_only=True)
    sender = serializers.StringRelatedField(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_since_created = serializers.SerializerMethodField()
    
    # Related object details (optional - only include if needed)
    marketplace_item_title = serializers.CharField(source='marketplace_item.title', read_only=True)
    lost_found_item_title = serializers.CharField(source='lost_found_item.title', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'sender',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'data',
            'is_read',
            'is_sent',
            'created_at',
            'read_at',
            'time_since_created',
            # Optional related fields
            'marketplace_item_title',
            'lost_found_item_title',
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'read_at', 
            'time_since_created',
            'notification_type_display',
            'marketplace_item_title',
            'lost_found_item_title'
        ]

    def get_time_since_created(self, obj):
        """Return a human-readable time since notification was created"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at)

    def update(self, instance, validated_data):
        # Only allow updating specific fields
        allowed_fields = ['is_read']
        for field in allowed_fields:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        
        # If marking as read, set read_at timestamp
        if validated_data.get('is_read') and not instance.read_at:
            instance.mark_as_read()
        else:
            instance.save()
            
        return instance


# Detailed serializer with full related object data (use when you need more details)
class NotificationDetailSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    sender = UserSerializer(read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    time_since_created = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'sender',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'data',
            'is_read',
            'is_sent',
            'created_at',
            'read_at',
            'time_since_created',
            'marketplace_item',
            'lost_found_item',
            'connection_request',
            'message',
        ]
        read_only_fields = [
            'id', 
            'created_at', 
            'read_at', 
            'time_since_created',
            'notification_type_display'
        ]

    def get_time_since_created(self, obj):
        """Return a human-readable time since notification was created"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at)


# Simplified serializer for bulk operations or lists
class NotificationListSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'sender_username',
            'notification_type',
            'notification_type_display',
            'title',
            'message',
            'is_read',
            'created_at',
        ]