from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
import uuid



def user_profile_path(instance, filename):
    # File will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return f"user_{instance.id}/{filename}"


class User(AbstractUser):
    """
    Custom user model that extends the default Django user model.
    This allows for additional fields and methods specific to the application.
    """
    course = models.CharField(max_length=100, blank=True, null=True)
    year = models.PositiveIntegerField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to=user_profile_path, null=True, blank=True)
    last_seen = models.DateTimeField(auto_now=True)
    is_online = models.BooleanField(default=False)
    # bio = models.TextField(max_length=500, blank=True)

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        



User = get_user_model()

class Club(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=[('Tech', 'Tech'), ('Fun', 'Fun'), ('Sports', 'Sports'), ('Academics', 'Academics')])
    members = models.ManyToManyField(User, related_name='joined_clubs', blank=True)

    def __str__(self):
        return self.name

class Event(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField()
    location = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    category = models.CharField(max_length=50, choices=[('Tech', 'Tech'), ('Fun', 'Fun'), ('Academics', 'Academics')])
    attendees = models.ManyToManyField(User, related_name='rsvped_events', blank=True)

    def __str__(self):
        return self.title
    
    
    
    
class Post(models.Model):
    CATEGORY_CHOICES = [
        ('Academics', 'Academics'),
        ('General', 'General'),
    ]

    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='post_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class PostLike(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('post', 'user')  # A user can only like a post once

class PostReport(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    



class LostAndFoundItem(models.Model):
    STATUS_CHOICES = [
        ('lost', 'Lost'),
        ('found', 'Found'),
        ('claimed', 'Claimed'),
    ]

    title = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='lost_found/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    location = models.CharField(max_length=100)
    date = models.DateField()
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lost_found_items')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.status.title()} - {self.title}"
    
    
    
    
class MarketplaceItem(models.Model):
    CATEGORY_CHOICES = [
        ('Books', 'Books'),
        ('Electronics', 'Electronics'),
        ('Clothing', 'Clothing'),
        ('Others', 'Others'),
    ]

    CONDITION_CHOICES = [
        ('New', 'New'),
        ('Used', 'Used'),
    ]

    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='marketplace_items')
    title = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES, default='Used')
    image = models.ImageField(upload_to='marketplace/', blank=True, null=True)
    is_sold = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    



class ConnectionRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_requests')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('sender', 'receiver')
    
    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError("Cannot send connection request to yourself")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"

class Connection(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connections_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='connections_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user1', 'user2')
    
    def clean(self):
        if self.user1 == self.user2:
            raise ValidationError("Cannot create connection with yourself")
        # Ensure user1 < user2 to avoid duplicate connections
        if self.user1.id > self.user2.id:
            self.user1, self.user2 = self.user2, self.user1
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user1.username} <-> {self.user2.username}"


class ChatRoom(models.Model):
    """
    Represents a chat room between two connected users
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_user1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_user2')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_group = models.BooleanField(default=False)
    group_name = models.CharField(max_length=100, blank=True)
    # participants = models.ManyToManyField(User, through='ChatRoomMembership')
    
    class Meta:
        unique_together = ('user1', 'user2')
        indexes = [
            models.Index(fields=['user1', 'user2']),
        ]
    
    def clean(self):
        if self.user1 == self.user2:
            raise ValidationError("Cannot create chat room with yourself")
        # Ensure user1 < user2 to avoid duplicate rooms
        if self.user1.id > self.user2.id:
            self.user1, self.user2 = self.user2, self.user1
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def get_other_user(self, current_user):
        """Get the other user in the chat room"""
        return self.user2 if self.user1 == current_user else self.user1
    
    def __str__(self):
        return f"Chat: {self.user1.username} <-> {self.user2.username}"

class Message(models.Model):
    """
    Represents a message in a chat room
    """
    MESSAGE_TYPES = [
        ('text', 'Text'),
        ('image', 'Image'),
        ('file', 'File'),
        ('voice', 'Voice'),
        ('video', 'Video'),
    ]
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('delivered', 'Delivered'), 
        ('read', 'Read'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    content = models.TextField(blank=True)  # For text messages
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)  # For file/image messages
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='sent')
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    reactions = models.JSONField(default=dict, blank=True)  
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)  # For videos
    duration = models.IntegerField(null=True, blank=True)  # For audio/video
    file_size = models.BigIntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['chat_room', '-created_at']),
            models.Index(fields=['sender', 'status']),
            models.Index(fields=['is_read', 'chat_room']),
        ]
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."
