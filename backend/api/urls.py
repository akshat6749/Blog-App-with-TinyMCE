from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Authentication URLs
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', views.current_user_view, name='current_user'),
    
    # Post URLs
    path('posts/', views.PostListCreateView.as_view(), name='post_list_create'),
    path('posts/<slug:slug>/', views.PostDetailView.as_view(), name='post_detail'),
    path('posts/get/<slug:slug>/', views.get_post_by_slug, name='get_post_by_slug'),
    path('posts/list/', views.get_posts, name='get_posts'),
    
    # File Upload URLs
    path('files/upload/', views.FileUploadView.as_view(), name='file_upload'),
    path('files/<uuid:file_id>/delete/', views.delete_file, name='delete_file'),
    path('files/<uuid:file_id>/preview/', views.get_file_preview, name='file_preview'),
]