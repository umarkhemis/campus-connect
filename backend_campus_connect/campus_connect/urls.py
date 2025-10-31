from django.urls import path, include
from .views import(
    RegisterView, ChangePasswordView, UserProfileView,
    ClubViewSet, EventViewSet,
    PostListCreateView, CommentCreateView, LikePostView, ReportPostView, #ConnectionViewSet,
    PostDetailView, LostAndFoundItemViewSet, MarketplaceItemListCreateView, MarketplaceItemDetailView,
    mark_item_as_sold, CurrentUserView, search_messages
)
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter    


router = DefaultRouter()
router.register('clubs', ClubViewSet, basename='clubs')
router.register('events', EventViewSet, basename='events')

router.register(r'lost-found', LostAndFoundItemViewSet, basename='lost-found')


urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path("user-auth/", include("rest_framework.urls")),
    path('users/<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('users/current/', views.CurrentUserView.as_view(), name='current-user-class'),
    path('posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('posts/<int:pk>/', PostDetailView.as_view(), name='post-detail'),
    path('posts/<int:pk>/like/', LikePostView.as_view(), name='post-like'),
    path('reports/', ReportPostView.as_view(), name='report-post'),
    path('comments/', CommentCreateView.as_view(), name='create-comment'),
    path('posts/<int:pk>/comments/', CommentCreateView.as_view(), name='post-comments'),
    path('posts/<int:pk>/report/', ReportPostView.as_view(), name='post-report'),
    path('marketplace/', MarketplaceItemListCreateView.as_view(), name='marketplace-list'),
    path('marketplace/<int:pk>/', MarketplaceItemDetailView.as_view(), name='marketplace-detail'),
    path('marketplace/<int:pk>/mark_sold/', mark_item_as_sold, name='marketplace-mark-sold'),
    
    path('students/', views.StudentListView.as_view(), name='student-list'),
    path('send-request/', views.send_connection_request, name='send-request'),
    path('respond-request/<int:request_id>/', views.respond_to_request, name='respond-request'),
    path('cancel-request/<int:request_id>/', views.cancel_request, name='cancel-request'),
    path('my-requests/', views.my_connection_requests, name='my-requests'),
    path('my-connections/', views.my_connections, name='my-connections'),
    path('remove-connection/<int:connection_id>/', views.remove_connection, name='remove-connection'),
    
    path('chat/rooms/', views.my_chat_rooms, name='my_chat_rooms'),
    path('chat/room/<int:user_id>/', views.get_or_create_chat_room, name='get_or_create_chat_room'),
    path('chat/<uuid:room_id>/messages/', views.chat_messages, name='chat_messages'),
    path('chat/<uuid:room_id>/send/', views.send_message, name='send_message'),
    path('chat/<uuid:room_id>/mark-read/', views.mark_messages_read, name='mark_messages_read'),
    path('chat/message/<uuid:message_id>/delete/', views.delete_message, name='delete_message'),
    path('chat/search/', views.search_messages, name='search_message'),
]
