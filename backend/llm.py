"""
OpsMind AI - LLM Service
Handles Groq API integrations (openai/gpt-oss-120b, qwen/qwen3-32b, llama-3.3-70b-versatile).
Provides robust fallback reasoning engine so the application NEVER crashes on API failure or missing keys.
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("opsmind.llm")

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False
    logger.info("groq SDK not installed, using fallback reasoning engine")


class LLMService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        # Recommended models as per prompt specification:
        # openai/gpt-oss-120b, qwen/qwen3-32b, llama-3.3-70b-versatile
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.client = None
        if HAS_GROQ and self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                logger.info(f"Groq client initialized with model {self.model}")
            except Exception as e:
                logger.warning(f"Could not initialize Groq client: {e}")

    def is_configured(self) -> bool:
        return bool(self.client and self.api_key)

    def generate_json(self, system_prompt: str, user_prompt: str, fallback_generator=None) -> Dict[str, Any]:
        """Calls Groq with JSON formatting, falling back gracefully if anything fails."""
        if self.client:
            try:
                chat_completion = self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt + "\nYou must return valid JSON only."},
                        {"role": "user", "content": user_prompt}
                    ],
                    model=self.model,
                    response_format={"type": "json_object"},
                    temperature=0.2,
                )
                raw_content = chat_completion.choices[0].message.content
                return json.loads(raw_content)
            except Exception as e:
                logger.warning(f"Groq API call failed or timed out: {e}. Executing resilient reasoning engine.")
        
        # If no client or API error, invoke resilient generator
        if fallback_generator:
            return fallback_generator()
        return {}


llm_service = LLMService()
