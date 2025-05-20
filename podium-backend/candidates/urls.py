from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ResumeViewSet,PromptAPI,NoteViewSet

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename="notes")
router.register(r'resume', ResumeViewSet, basename="resume")

urlpatterns = [
    path('prompt/', PromptAPI.as_view())
    #path('notes/', NoteAPI.as_view())
    
]

urlpatterns += router.urls