import os
import json
import google.generativeai as genai
from typing import Optional

# Configuration
# Assuming API key is set in environment variables
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWLEDGE_FILE = os.path.join(BASE_DIR, "knowledge", "Infographic_Architect.txt")
DATA_FILE = os.path.join(BASE_DIR, "data", "infographic_templates.json")

def load_system_instruction():
    """Reads the system instruction from the knowledge file."""
    try:
        with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        print(f"Error: Knowledge file not found at {KNOWLEDGE_FILE}")
        return ""

def load_templates():
    """Loads the templates from the JSON database."""
    if not os.path.exists(DATA_FILE):
        return {"templates": []}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {"templates": []}

def save_templates(data):
    """Saves the templates to the JSON database."""
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def parse_json_response(text):
    """Parses JSON from a string, handling potential markdown code blocks."""
    try:
        cleaned = text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: try to find the first { and last }
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
        except:
            pass
        return None

def analyze_and_save_template(image_path: str, template_name: str):
    """
    Analyzes an image using Gemini Vision to extract style and create a master prompt,
    then saves it as a template.
    """
    if not API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return

    print(f"Analyzing image: {image_path}...")
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return

    # Upload image to Gemini
    try:
        sample_file = genai.upload_file(path=image_path, display_name=template_name)
    except Exception as e:
        print(f"Error uploading file: {e}")
        return

    system_instruction = load_system_instruction()
    
    # Create model
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")

    prompt = f"{system_instruction}\n\nAnalyze this image and provide the output in JSON format."

    try:
        response = model.generate_content([prompt, sample_file])
        result = parse_json_response(response.text)
        
        if not result:
            print("Error: Failed to parse JSON response from Gemini.")
            print("Raw response:", response.text)
            return

        db = load_templates()
        new_template = {
            "id": len(db["templates"]) + 1,
            "name": template_name,
            "environment_prompt": result.get("environment_prompt", ""),
            "lighting_prompt": result.get("lighting_prompt", ""),
            "composition_keywords": result.get("composition_keywords", ""),
            "negative_prompt_additions": result.get("negative_prompt_additions", "")
        }
        
        db["templates"].append(new_template)
        save_templates(db)
        
        print(f"Template '{template_name}' saved successfully.")
        print("Analysis Result:", json.dumps(new_template, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")

def generate_new_image(template_name: str, product_name: str, product_physical_description: str):
    """
    Generates a new image prompt based on a saved template and detailed product info.
    """
    db = load_templates()
    template = next((t for t in db["templates"] if t["name"] == template_name), None)
    
    if not template:
        print(f"Error: Template '{template_name}' not found.")
        return

    # Extract template components
    lighting = template.get("lighting_prompt", "")
    environment = template.get("environment_prompt", "")
    composition = template.get("composition_keywords", "")
    neg_additions = template.get("negative_prompt_additions", "")

    # Construct Final Prompt
    # Formula: [Lighting_Prompt] + [Environment_Prompt] + "featuring a [Product_Physical_Description] placed in the center" + [Composition_Keywords]
    final_prompt = f"{lighting} {environment} featuring a {product_physical_description} of {product_name} placed in the center {composition}"
    
    # Construct Negative Prompt
    negative_prompt = f"distorted, bad quality, {neg_additions}"

    print(f"Generating image command for '{product_name}' using template '{template_name}'...")
    print("-" * 50)
    print("FINAL PROMPT:")
    print(final_prompt)
    print("-" * 50)
    print("NEGATIVE PROMPT:")
    print(negative_prompt)
    print("-" * 50)
    
    return final_prompt, negative_prompt

def enhance_user_prompt(user_text: str):
    """
    Enhances the user's rough description into a professional English image generation prompt.
    """
    if not API_KEY:
        print("Error: GEMINI_API_KEY environment variable not set.")
        return user_text

    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    
    prompt = f"""
    ROLE: Expert Prompt Engineer for Midjourney/Nano Banana.
    TASK: Enhance the user's rough description into a professional English image generation prompt.
    
    USER INPUT: "{user_text}"
    
    REQUIREMENTS:
    1. Translate to English if not already.
    2. Add mandatory quality keywords: "8k resolution, cinematic lighting, professional advertising photography, infographic layout, negative space for text".
    3. Keep the user's core intent/subject intact. Do not hallucinate unrelated objects.
    4. Return ONLY the final prompt string.
    """

    try:
        response = model.generate_content(prompt)
        print(f"Enhanced Prompt: {response.text.strip()}")
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return user_text

if __name__ == "__main__":
    # Example usage
    # enhance_user_prompt("chai nước hoa màu hồng trên bàn gỗ")
    pass
