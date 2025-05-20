from django.db import models 
from users.models import User 
from django.shortcuts  import get_object_or_404
from django.core.validators import FileExtensionValidator
from openai import OpenAI
from dotenv import load_dotenv
from django.utils.text import slugify
import uuid

load_dotenv()
client= OpenAI()

RESUME_TYPE= (
    (1, 'default'),
    (2, 'two'),
    (3, 'three'),
    (4, 'four'),
    (5, 'five'),
    (6, 'six')
)

class Resume(models.Model):
    PARSING_STATUS = (
        ('not_parsed', 'Not Parsed'),
        ('parsing', 'Parsing in Progress'),
        ('parsed', 'Parsed Successfully'),
        ('failed', 'Parsing Failed'),
    )
    user= models.ForeignKey(User, on_delete=models.CASCADE)
    template_type= models.IntegerField(choices=RESUME_TYPE, blank=True, null=True)
    title= models.CharField(max_length=100) 
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    resume_file = models.FileField(upload_to='Candidates-Resume', validators=[FileExtensionValidator(allowed_extensions=['pdf'])])
    resume_data= models.JSONField(blank=True, null=True) 
    parsing_status = models.CharField(max_length=20, choices=PARSING_STATUS, default='not_parsed')
    views= models.IntegerField(default=0) 
    created_at= models.DateTimeField(auto_now_add=True) 

    @property
    def get_all_notes(self):
        notes= self.notes_set.all()
        return notes

    def save(self, *args, **kwargs):
        if not self.slug:
            # Create a unique slug based on title and a random string
            base_slug = slugify(self.title)
            unique_id = str(uuid.uuid4())[:8]  # Use first 8 chars of UUID
            self.slug = f"{base_slug}-{unique_id}"
        super().save(*args, **kwargs)
    
    def __str__(self): 
        return f"Candidate {self.title}"
    

class Notes(models.Model):
    #user
    resume= models.ForeignKey(Resume, on_delete=models.CASCADE)
    identifier= models.TextField()
    section= models.TextField(null=True, blank=True)
    selected_text= models.TextField(null=True, blank=True)
    context= models.JSONField(null=True, blank=True)
    note= models.CharField(max_length=100)
    note_file= models.FileField(upload_to='Notes-File', validators=[FileExtensionValidator(allowed_extensions=['pdf', 'docx', 'jpeg', 'png', 'svg', 'jpg', 'webp'])], blank=True, null=True)
    created_at= models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.note
    
    
conversation_threads = {}

def get_resume_context(resume_slug: str, user_query: str, thread_id=None, messages=None):
    resume = get_object_or_404(Resume, slug=resume_slug)
    notes = "\n".join(note.note for note in resume.notes_set.all())
    
    # Build messages array with conversation history if available
    if not messages:
        messages = [
            {"role": "system", "content": f"""You are an AI assistant helping users understand a resume.
             Resume Details: {resume.resume_data}
             Additional Notes: {notes if notes else "No notes added yet."}"""}
        ]
    
    # Add the new user query
    messages.append({"role": "user", "content": user_query})
    
    # Get response from LLM
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages
    )
    
    # Add the assistant's response to the conversation history
    assistant_message = response.choices[0].message
    messages.append({"role": "assistant", "content": assistant_message.content})
    
    return {
        "response": assistant_message.content,
        "thread_id": thread_id,
        "messages": messages
    }
