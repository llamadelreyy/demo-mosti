#!/usr/bin/env python3
"""
Test script for gTTS implementation
"""

import tempfile
import base64
import os
from gtts import gTTS

def test_gtts():
    """Test gTTS functionality"""
    try:
        print("Testing gTTS (Google Text-to-Speech)...")
        
        # Test English
        test_text_en = "Hello, this is a test of Google Text-to-Speech."
        print(f"Testing English: {test_text_en}")
        
        tts_en = gTTS(text=test_text_en, lang='en', slow=False, tld='com')
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tts_en.save(tmp_file.name)
            
            # Read the generated audio file
            with open(tmp_file.name, "rb") as f:
                audio_data = f.read()
            
            # Clean up
            os.unlink(tmp_file.name)
            
            print(f"English audio generated successfully, size: {len(audio_data)} bytes")
            
        # Test Malay
        test_text_ms = "Selamat datang ke demo AI kami."
        print(f"Testing Malay: {test_text_ms}")
        
        tts_ms = gTTS(text=test_text_ms, lang='ms', slow=False, tld='com')
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tts_ms.save(tmp_file.name)
            
            # Read the generated audio file
            with open(tmp_file.name, "rb") as f:
                audio_data = f.read()
            
            # Clean up
            os.unlink(tmp_file.name)
            
            print(f"Malay audio generated successfully, size: {len(audio_data)} bytes")
            
        # Test different voice configurations
        voice_configs = [
            {'lang': 'en', 'tld': 'com', 'name': 'English US'},
            {'lang': 'en', 'tld': 'co.uk', 'name': 'English UK'},
            {'lang': 'en', 'tld': 'us', 'name': 'English US Alt'},
        ]
        
        for config in voice_configs:
            print(f"Testing {config['name']}...")
            tts = gTTS(text="Testing voice configuration", lang=config['lang'], tld=config['tld'])
            
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                tts.save(tmp_file.name)
                
                with open(tmp_file.name, "rb") as f:
                    audio_data = f.read()
                
                os.unlink(tmp_file.name)
                
                print(f"{config['name']} audio generated, size: {len(audio_data)} bytes")
        
        print("✅ All gTTS tests passed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ gTTS test failed: {e}")
        return False

if __name__ == "__main__":
    test_gtts()