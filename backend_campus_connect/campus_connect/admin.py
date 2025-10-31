from django.contrib import admin
from .models import(
    User, Event, Club, Post, Comment, PostLike,
    PostReport, LostAndFoundItem, MarketplaceItem, 
    Connection, ConnectionRequest, Message, ChatRoom
)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active')
    search_fields = ('username', 'email')
    list_filter = ('is_staff', 'is_active')
    
admin.site.register(Event)
admin.site.register(Club)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(PostLike)
admin.site.register(PostReport)
admin.site.register(LostAndFoundItem)
admin.site.register(MarketplaceItem)
admin.site.register(Connection)
admin.site.register(ConnectionRequest)
admin.site.register(Message)
admin.site.register(ChatRoom)
