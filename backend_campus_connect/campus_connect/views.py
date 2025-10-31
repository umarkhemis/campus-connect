from django.shortcuts import get_object_or_404, render
from django.db import models
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q, Exists, OuterRef
from rest_framework import generics, permissions, viewsets, status
from .models import( 
    User, Club, Event, Post, Comment, 
    PostLike, PostReport, LostAndFoundItem, 
    MarketplaceItem, Connection, ConnectionRequest 
    , ChatRoom, Message
)
from .serializers import (
    UserSerializer, RegistrationSerializer, UserProfileSerializer,
    ClubSerializer, EventSerializer, PostSerializer, CommentSerializer,
    PostLikeSerializer, PostReportSerializer, LostAndFoundItemSerializer,
    MarketplaceItemSerializer, ConnectionSerializer, ConnectionRequestSerializer,
    ChatRoomSerializer, MessageSerializer, UserDetailSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model

User = get_user_model()



class RegisterView(generics.CreateAPIView):
    """
    View to register a new user.
    Accessible to any user.
    """
    queryset = User.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [AllowAny]
    
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        return token


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    # permission_classes = [AllowAny]

    def get_object(self):
        return self.request.user
    
    
# class UserDetailView(generics.RetrieveAPIView):
#     """
#     Retrieve user details by ID
#     """
#     serializer_class = UserDetailSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         user_id = self.kwargs['user_id']
#         user_profile = get_object_or_404(User, user_id=user_id)
#         return user_profile
    
#     def retrieve(self, request, *args, **kwargs):
#         try:
#             instance = self.get_object()
#             serializer = self.get_serializer(instance)
#             return Response(serializer.data)
#         except Exception as e:
#             return Response(
#                 {'error': 'User not found'}, 
#                 status=status.HTTP_404_NOT_FOUND
#             )



class UserDetailView(generics.RetrieveAPIView):
    """
    Retrieve user details by ID - Fixed for custom User model
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        user_id = self.kwargs['user_id']
        
        user = get_object_or_404(User, id=user_id)
        return user
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in UserDetailView: {str(e)}")  # Debug log
            return Response(
                {'error': 'An error occurred while fetching user details'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )









@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_connection_request(request, user_id):
    """
    Send a connection request to another user
    """
    try:
        target_user = get_object_or_404(User, id=user_id)
        
        # Check if user is trying to connect to themselves
        if request.user.id == target_user.id:
            return Response(
                {'error': 'Cannot connect to yourself'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if connection already exists
        existing_connection = Connection.objects.filter(
            sender=request.user, 
            receiver=target_user
        ).first() or Connection.objects.filter(
            sender=target_user, 
            receiver=request.user
        ).first()
        
        if existing_connection:
            return Response(
                {'error': 'Connection request already exists'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create connection request
        connection = Connection.objects.create(
            sender=request.user,
            receiver=target_user,
            status='pending'
        )
        
        return Response(
            {'message': 'Connection request sent successfully'}, 
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {'error': 'Failed to send connection request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_connection_request(request, connection_id):
    """
    Accept a connection request
    """
    try:
        connection = get_object_or_404(
            Connection, 
            id=connection_id, 
            receiver=request.user, 
            status='pending'
        )
        
        connection.status = 'accepted'
        connection.save()
        
        return Response(
            {'message': 'Connection request accepted'}, 
            status=status.HTTP_200_OK
        )
        
    except Connection.DoesNotExist:
        return Response(
            {'error': 'Connection request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to accept connection request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_connection_request(request, connection_id):
    """
    Reject a connection request
    """
    try:
        connection = get_object_or_404(
            Connection, 
            id=connection_id, 
            receiver=request.user, 
            status='pending'
        )
        
        connection.status = 'rejected'
        connection.save()
        
        return Response(
            {'message': 'Connection request rejected'}, 
            status=status.HTTP_200_OK
        )
        
    except Connection.DoesNotExist:
        return Response(
            {'error': 'Connection request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to reject connection request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_connection_request(request, user_id):
    """
    Cancel a sent connection request
    """
    try:
        target_user = get_object_or_404(User, id=user_id)
        
        connection = get_object_or_404(
            Connection, 
            sender=request.user, 
            receiver=target_user, 
            status='pending'
        )
        
        connection.delete()
        
        return Response(
            {'message': 'Connection request cancelled'}, 
            status=status.HTTP_200_OK
        )
        
    except Connection.DoesNotExist:
        return Response(
            {'error': 'Connection request not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': 'Failed to cancel connection request'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_connection_status(request, user_id):
    """
    Get connection status with a specific user
    Returns: none, pending_sent, pending_received, accepted, rejected
    """
    try:
        target_user = get_object_or_404(User, id=user_id)
        
        # Check if user is checking their own status
        if request.user.id == target_user.id:
            return Response({'status': 'self'}, status=status.HTTP_200_OK)
        
        # Check for existing connections
        sent_connection = Connection.objects.filter(
            sender=request.user, 
            receiver=target_user
        ).first()
        
        received_connection = Connection.objects.filter(
            sender=target_user, 
            receiver=request.user
        ).first()
        
        if sent_connection:
            if sent_connection.status == 'pending':
                return Response({'status': 'pending_sent'}, status=status.HTTP_200_OK)
            elif sent_connection.status == 'accepted':
                return Response({'status': 'accepted'}, status=status.HTTP_200_OK)
            elif sent_connection.status == 'rejected':
                return Response({'status': 'rejected'}, status=status.HTTP_200_OK)
        
        if received_connection:
            if received_connection.status == 'pending':
                return Response(
                    {
                        'status': 'pending_received', 
                        'connection_id': received_connection.id
                    }, 
                    status=status.HTTP_200_OK
                )
            elif received_connection.status == 'accepted':
                return Response({'status': 'accepted'}, status=status.HTTP_200_OK)
            elif received_connection.status == 'rejected':
                return Response({'status': 'rejected'}, status=status.HTTP_200_OK)
        
        return Response({'status': 'none'}, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': 'Failed to get connection status'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response({"detail": "Incorrect old password."}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password changed successfully."})
    
    
class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        category = self.request.query_params.get('category')
        if category:
            return self.queryset.filter(category=category)
        return self.queryset

    @action(detail=True, methods=['post'])
    def join_leave(self, request, pk=None):
        club = self.get_object()
        user = request.user
        if user in club.members.all():
            club.members.remove(user)
            return Response({'status': 'left'})
        else:
            club.members.add(user)
            return Response({'status': 'joined'})
        
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        club = self.get_object()
        members = club.members.all()
        
        member_data = []
        for member in members:
            member_data.append({
                'id': member.id,
                'username': member.username,
                # 'first_name': member.first_name,
                # 'last_name': member.last_name,
                'email': member.email,
                'profile_picture': member.profile.profile_picture.url if hasattr(member, 'profile') and member.profile.profile_picture else None,
            })
        
        return Response(member_data)

        
        

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        category = self.request.query_params.get('category')
        if category:
            return self.queryset.filter(category=category)
        return self.queryset

    @action(detail=True, methods=['post'])
    def rsvp(self, request, pk=None):
        event = self.get_object()
        user = request.user
        if user in event.attendees.all():
            event.attendees.remove(user)
            return Response({'status': 'unrsvped'})
        else:
            event.attendees.add(user)
            return Response({'status': 'rsvped'})  
    

class CommentCreateView(generics.CreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        post_id = self.kwargs['pk']
        post = get_object_or_404(Post, pk=post_id)
        serializer.save(author=self.request.user, post=post)


class PostListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        posts = Post.objects.all().order_by('-created_at')
        serializer = PostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        serializer = PostSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(author=request.user)  
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LikePostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)
        like, created = PostLike.objects.get_or_create(post=post, user=request.user)
        
        if not created:
            like.delete()  # Toggle like off
            liked = False
        else:
            liked = True
            
        # Return the current like status and updated count
        return Response({
            'liked': liked,
            'likes_count': PostLike.objects.filter(post=post).count()
        }, status=status.HTTP_200_OK)




class ReportPostView(generics.CreateAPIView):
    serializer_class = PostReportSerializer
    permission_classes = [permissions.IsAuthenticated]

   
    def perform_create(self, serializer):
        post_id = self.kwargs['pk']
        post = get_object_or_404(Post, pk=post_id)
        serializer.save(reporter=self.request.user, post=post)
          
    
    
class PostDetailView(generics.RetrieveAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    # permission_classes = [permissions.AllowAny]  # Or IsAuthenticated if needed
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]  
    lookup_field = 'pk'
    
    
    
class LostAndFoundItemViewSet(viewsets.ModelViewSet):
    queryset = LostAndFoundItem.objects.all().order_by('-created_at')
    serializer_class = LostAndFoundItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    

    
    
class MarketplaceItemListCreateView(generics.ListCreateAPIView):
    queryset = MarketplaceItem.objects.filter(is_sold=False).order_by('-created_at')
    serializer_class = MarketplaceItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)





# class MarketplaceItemCreateView(generics.CreateAPIView):
#     queryset = MarketplaceItem.objects.all()
#     serializer_class = MarketplaceItemSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     def get_serializer_context(self):
#         context = super().get_serializer_context()
#         context.update({"request": self.request})
#         return context

#     def create(self, request, *args, **kwargs):
#         logger.info(f"Received marketplace item creation request: {request.data}")
        
#         # Log the received data for debugging
#         data_copy = request.data.copy()
#         if 'image' in data_copy:
#             data_copy['image'] = 'base64_image_data' if data_copy['image'] else None
#         logger.info(f"Request data (image redacted): {data_copy}")
        
#         serializer = self.get_serializer(data=request.data)
        
#         try:
#             serializer.is_valid(raise_exception=True)
#             self.perform_create(serializer)
#             logger.info(f"Successfully created marketplace item: {serializer.data}")
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         except serializers.ValidationError as e:
#             logger.error(f"Validation error creating marketplace item: {e}")
#             return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             logger.error(f"Unexpected error creating marketplace item: {str(e)}")
#             return Response(
#                 {"error": "An unexpected error occurred"}, 
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )










# Retrieve, Update (mark sold), or Delete a specific item
class MarketplaceItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MarketplaceItem.objects.all()
    serializer_class = MarketplaceItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    
    
@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_item_as_sold(request, pk):
    try:
        item = MarketplaceItem.objects.get(pk=pk)
        if item.seller != request.user:
            return Response({'error': 'Not authorized to mark this item as sold'}, status=403)
        item.is_sold = True
        item.save()
        return Response({'message': 'Item marked as sold successfully'})
    except MarketplaceItem.DoesNotExist:
        return Response({'error': 'Item not found'}, status=404) 
    



class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get the current authenticated user's details
        """
        try:
            serializer = UserSerializer(request.user)
            return Response({
                'success': True,
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Failed to retrieve user information',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class StudentListView(generics.ListAPIView):
    """List all students excluding current user and already connected users"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        current_user = self.request.user
        
        # Get users already connected to current user
        connected_users = Connection.objects.filter(
            Q(user1=current_user) | Q(user2=current_user)
        ).values_list('user1', 'user2')
        
        connected_user_ids = set()
        for user1_id, user2_id in connected_users:
            connected_user_ids.add(user1_id)
            connected_user_ids.add(user2_id)
        
        # Get users with pending requests (sent or received)
        pending_requests = ConnectionRequest.objects.filter(
            Q(sender=current_user) | Q(receiver=current_user),
            status='pending'
        ).values_list('sender', 'receiver')
        
        pending_user_ids = set()
        for sender_id, receiver_id in pending_requests:
            pending_user_ids.add(sender_id)
            pending_user_ids.add(receiver_id)
        
        # Exclude current user, connected users, and users with pending requests
        excluded_user_ids = connected_user_ids.union(pending_user_ids)
        excluded_user_ids.add(current_user.id)

        return User.objects.exclude(id__in=excluded_user_ids)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_connection_request(request):
    """Send a connection request to another user"""
    receiver_id = request.data.get('receiver_id')
    
    if not receiver_id:
        return Response({'error': 'receiver_id is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    if receiver == request.user:
        return Response({'error': 'Cannot send request to yourself'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Check if connection already exists
    connection_exists = Connection.objects.filter(
        Q(user1=request.user, user2=receiver) | 
        Q(user1=receiver, user2=request.user)
    ).exists()
    
    if connection_exists:
        return Response({'error': 'Already connected'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Check if request already exists
    existing_request = ConnectionRequest.objects.filter(
        Q(sender=request.user, receiver=receiver) |
        Q(sender=receiver, receiver=request.user)
    ).first()
    
    if existing_request:
        return Response({'error': 'Request already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Create new connection request
    connection_request = ConnectionRequest.objects.create(
        sender=request.user,
        receiver=receiver
    )
    
    serializer = ConnectionRequestSerializer(connection_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

   
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def respond_to_request(request, request_id):
    """Accept or reject a connection request"""
    action = request.data.get('action')  # 'accept' or 'reject'
    
    if action not in ['accept', 'reject']:
        return Response({'error': 'Action must be accept or reject'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        connection_request = ConnectionRequest.objects.get(
            id=request_id,
            receiver=request.user,
            status='pending'
        )
    except ConnectionRequest.DoesNotExist:
        return Response({'error': 'Connection request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if action == 'accept':
        # Create connection
        Connection.objects.create(
            user1=min(connection_request.sender, connection_request.receiver, key=lambda x: x.id),
            user2=max(connection_request.sender, connection_request.receiver, key=lambda x: x.id)
        )
        connection_request.status = 'accepted'
        connection_request.save()
        
        return Response({'message': 'Connection request accepted'})
    
    else:  # reject
        connection_request.status = 'rejected'
        connection_request.save()
        
        return Response({'message': 'Connection request rejected'})
 
   
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def cancel_request(request, request_id):
    """Cancel a sent connection request"""
    try:
        connection_request = ConnectionRequest.objects.get(
            id=request_id,
            sender=request.user,
            status='pending'
        )
        connection_request.delete()
        return Response({'message': 'Request cancelled'})
    except ConnectionRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_connection_requests(request):
    """Get sent and received connection requests"""
    sent_requests = ConnectionRequest.objects.filter(
        sender=request.user,
        status='pending'
    )
    received_requests = ConnectionRequest.objects.filter(
        receiver=request.user,
        status='pending'
    )
    
    return Response({
        'sent_requests': ConnectionRequestSerializer(sent_requests, many=True).data,
        'received_requests': ConnectionRequestSerializer(received_requests, many=True).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_connections(request):
    """Get all connections for current user"""
    connections = Connection.objects.filter(
        Q(user1=request.user) | Q(user2=request.user)
    )
    
    serializer = ConnectionSerializer(connections, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_connection(request, connection_id):
    """Remove/unfriend a connection"""
    try:
        connection = Connection.objects.get(
            Q(user1=request.user) | Q(user2=request.user),
            id=connection_id
        )
        connection.delete()
        return Response({'message': 'Connection removed'})
    except Connection.DoesNotExist:
        return Response({'error': 'Connection not found'}, status=status.HTTP_404_NOT_FOUND)
           

        
class MessagePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_or_create_chat_room(request, user_id):
    """Get or create a chat room with another user (if connected)"""
    current_user = request.user
    
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if other_user == current_user:
        return Response({'error': 'Cannot create chat room with yourself'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    # Check if users are connected
    connection_exists = Connection.objects.filter(
        Q(user1=current_user, user2=other_user) | 
        Q(user1=other_user, user2=current_user)
    ).exists()
    
    if not connection_exists:
        return Response({'error': 'You can only chat with connected users'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Get or create chat room
    user1 = min(current_user, other_user, key=lambda x: x.id)
    user2 = max(current_user, other_user, key=lambda x: x.id)
    
    chat_room, created = ChatRoom.objects.get_or_create(
        user1=user1, 
        user2=user2
    )
    
    serializer = ChatRoomSerializer(chat_room, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_chat_rooms(request):
    """Get all chat rooms for current user"""
    chat_rooms = ChatRoom.objects.filter(
        Q(user1=request.user) | Q(user2=request.user)
    ).order_by('-updated_at')
    
    serializer = ChatRoomSerializer(chat_rooms, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_messages(request, room_id):
    """Get messages for a specific chat room"""
    try:
        chat_room = ChatRoom.objects.get(
            Q(user1=request.user) | Q(user2=request.user),
            id=room_id
        )
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    messages = chat_room.messages.all()
    paginator = MessagePagination()
    page = paginator.paginate_queryset(messages, request)
    
    if page is not None:
        serializer = MessageSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, room_id):
    """Send a message to a chat room"""
    try:
        chat_room = ChatRoom.objects.get(
            Q(user1=request.user) | Q(user2=request.user),
            id=room_id
        )
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    content = request.data.get('content', '').strip()
    message_type = request.data.get('message_type', 'text')
    file = request.FILES.get('file')
    
    if message_type == 'text' and not content:
        return Response({'error': 'Message content is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    if message_type in ['image', 'file'] and not file:
        return Response({'error': 'File is required for this message type'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    message = Message.objects.create(
        chat_room=chat_room,
        sender=request.user,
        message_type=message_type,
        content=content,
        file=file
    )
    
    # Update chat room timestamp
    chat_room.save()
    
    serializer = MessageSerializer(message)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request, room_id):
    """Mark all messages in a chat room as read"""
    try:
        chat_room = ChatRoom.objects.get(
            Q(user1=request.user) | Q(user2=request.user),
            id=room_id
        )
    except ChatRoom.DoesNotExist:
        return Response({'error': 'Chat room not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Mark all unread messages from other user as read
    updated_count = Message.objects.filter(
        chat_room=chat_room,
        is_read=False
    ).exclude(sender=request.user).update(is_read=True)
    
    return Response({'message': f'{updated_count} messages marked as read'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):
    """Delete a message (only sender can delete)"""
    try:
        message = Message.objects.get(
            id=message_id,
            sender=request.user
        )
        message.delete()
        return Response({'message': 'Message deleted'})
    except Message.DoesNotExist:
        return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def search_messages(request):
    query = request.GET.get('q', '')
    messages = Message.objects.filter(
        chat_room__in=user_chat_rooms,
        content__icontains=query
    )
    return Response(MessageSerializer(messages, many=True).data)