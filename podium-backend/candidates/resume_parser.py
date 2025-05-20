import argparse
from PyPDF2 import PdfReader
from pydantic import BaseModel
from openai import OpenAI
import json
import os
from dotenv import load_dotenv
from datetime import date, timedelta
import requests
from io import BytesIO

load_dotenv()

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Extract structured data from resume PDF')
    parser.add_argument('--pdf', type=str, default=None, help='Path to resume PDF')
    parser.add_argument('--output_dir', type=str, default="outputscript1", help='Output directory path')
    return parser.parse_args()

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file using PyPDF2 library."""
    print(f"Reading {pdf_path}...")
    
    reader = PdfReader(pdf_path)
    number_of_pages = len(reader.pages)
    text=""
    print("Converting PDF...")
    for p in range(number_of_pages):
     page = reader.pages[p]
     text += page.extract_text()
    print("Extraction complete.")
    
    return text

def extract_text_from_pdf_url(pdf_url):
    """Extract text from a PDF URL using PyPDF2 library."""
    print(f"Downloading PDF from {pdf_url}...")
    
    # Download the PDF content
    response = requests.get(pdf_url)
    response.raise_for_status()  # Raise exception for HTTP errors
    
    # Create a file-like object from the content
    pdf_file = BytesIO(response.content)
    
    # Extract text using PyPDF2
    reader = PdfReader(pdf_file)
    number_of_pages = len(reader.pages)
    text = ""
    print("Converting PDF...")
    for p in range(number_of_pages):
        page = reader.pages[p]
        text += page.extract_text()
    print("Extraction complete.")
    
    return text

def save_text_to_file(text, output_file):
    """Save extracted text to a file."""
    try:
        print(f"Writing extracted text to {output_file}...")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Successfully wrote extracted text to {output_file}.")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")

def save_json_to_file(data, output_file):
    """Save JSON data to a file."""
    try:
        print(f"Writing extracted info to {output_file}...")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(data)
        print(f"Successfully wrote extracted info to {output_file}.")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")

# Define Pydantic models for structured data extraction
class PersonalDetails(BaseModel):
    name: str
    gender: str
    contact_no: str
    email: str
    github: str
    linkedin: str
    website: str
    summary: str 

class Info(BaseModel):
    """Info can be Educational Qualification or Course"""
    title: str
    description: str
    url: str
    dt: str
 
class Skill(BaseModel):
    name: str
    level: int

class CareerExperience(BaseModel):
    company_name: str
    job_title: str
    duration: str
    key_responsbilities: list[str]

class Project(BaseModel):
    title: str
    skills_used: list[Skill]
    description: str

class ProfessionalProfile(BaseModel):
    personal_info: PersonalDetails
    education: list[Info]  # Fixed typo from "qualificaions"
    awards: list[Info]
    publications: list[Info]
    references: list[Info]
    skills: list[Skill]
    work_experience: list[CareerExperience]
    projects: list[Project]  # Optional field with default empty list

def extract_structured_data(text):
    """Extract structured data from text using OpenAI's model."""
    print('Extracting structured information with LLM...')
    
    client = OpenAI()
    
    system_prompt = """
                        You are a professional resume parser. Your job is to extract structured information from resume text with a high degree of accuracy and completeness.

                        Instructions:
                        1. Extract only information explicitly stated in the resume. Do not assume or invent details.
                        2. If information is missing, use "-" as a placeholder.
                        3. Capture:
                        - Personal info: name, email, phone, LinkedIn, GitHub, website (if mentioned), summary- you dont neeed to generate it from your end but pick overview/profile or whateve user mentioned- you dont need to generate a summary by ur end.
                        - Education: title, description, institution, dates.
                        - Skills: list all mentioned, estimate proficiency level if clearly stated (1–5), else skip level or use 3 (moderate).
                        - CareerExperience(Work experience): company name, role, duration, responsibilities.
                        - Projects: title, technologies used, and short descriptions.
                        - Awards, references, publications: if any.

                        Guidelines:
                        - Normalize tech terms (e.g., React.js, PostgreSQL).
                        - Be concise and structured.
                        - If some fields like GitHub/LinkedIn aren't URLs but are mentioned (e.g., “github.com/jeby”), include them as-is.
                    """
    
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-2024-08-06",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Extract structured information from this resume text: " + text},
        ],
        response_format=ProfessionalProfile,
        temperature=0.4
    )
    
    return completion.choices[0].message.parsed

def parse_resume(resume_url):
    """Parse a resume from a URL."""
    print(f"Parsing resume from URL: {resume_url}")
    
    try:
        # Extract text from PDF URL
        text = extract_text_from_pdf_url(resume_url)
        
        # Extract structured data from text
        structured_data = extract_structured_data(text)
        
        return structured_data
        
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        raise

def main():
    """Main function to orchestrate the resume parsing process."""
    print("PDF extractor")
    args = parse_arguments()
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Get all PDF files from the resumes directory
    resume_dir = args.pdf
    pdf_files = [f for f in os.listdir(resume_dir) if f.endswith('.pdf')]
    
    for pdf_file in pdf_files:
        pdf_path = os.path.join(resume_dir, pdf_file)
        base_name = os.path.splitext(pdf_file)[0]
        
        # Define output paths
        text_output = os.path.join(args.output_dir, f"{base_name}.txt")
        json_output = os.path.join(args.output_dir, f"{base_name}.json")
        
        try:
            print(f"\nProcessing {pdf_file}...")
            
            # Extract text from PDF
            extracted_text = extract_text_from_pdf(pdf_path)
            
            # Save extracted text to file
            save_text_to_file(extracted_text, text_output)
            
            # Extract structured data using LLM
            structured_data = extract_structured_data(extracted_text)
            
            # Convert to JSON and save
            json_data = structured_data.model_dump_json(indent=4)
            save_json_to_file(json_data, json_output)
            
            print(f"Successfully processed {pdf_file}")
            
        except Exception as e:
            print(f"Error processing {pdf_file}: {e}")
            continue
    
    print("\nAll resume processing completed!")

if __name__ == "__main__":
    main()