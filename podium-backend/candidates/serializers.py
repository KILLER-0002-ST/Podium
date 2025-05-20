from rest_framework import serializers
from .models import Resume, Notes



class ResumeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model= Resume
        fields= ['title', 'resume_file', 'template_type']


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model= Notes
        fields= ['identifier', 'note', 'note_file', 'section', 'selected_text', 'context', 'id']


class ResumeSerializer(serializers.ModelSerializer):
    get_all_notes= NoteSerializer(many=True)
    class Meta:
        model= Resume
        fields= ['id', 'user', 'title', 'slug', 'resume_file', 'resume_data', 'get_all_notes', 'created_at', 'template_type', 'views']




class CreateNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model= Notes
        fields= ['identifier', 'note', 'section', 'selected_text', 'context', 'note_file']


class PromptSerializer(serializers.Serializer):
    input_text = serializers.CharField()
    resume_slug = serializers.CharField()
    thread_id = serializers.CharField(required=False, allow_null=True)

class PromptResponseSerializer(serializers.Serializer):
    output = serializers.CharField()
    thread_id = serializers.CharField()