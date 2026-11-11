
import os
import json
import time

from google import genai
from dotenv import load_dotenv

load_dotenv(override=True)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_issue(title: str, description: str):

    prompt = f"""
    Analyze this software issue.

    Title: {title}
    Description: {description}

    Return valid JSON with:
    category: Bug, Security, Performance, or Other
    suggested_priority: Low, Medium, or High
    root_cause: Possible root cause
    troubleshooting_steps: A list of practical steps

    Do not include markdown formatting.
    """

    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )

            result = json.loads(response.text)

            return result

        except Exception as e:

            error_message = str(e)

            temporary_error = (
                "503" in error_message
                or "UNAVAILABLE" in error_message
                or "429" in error_message
                or "RESOURCE_EXHAUSTED" in error_message
            )

            if temporary_error and attempt < max_retries - 1:
                wait_time = 2 ** (attempt + 1)

                print(
                    f"Gemini temporarily unavailable. "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)

            else:
                raise RuntimeError(
                    f"Gemini AI analysis failed: {error_message}"
                )
