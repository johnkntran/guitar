import os
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
model = os.environ["AZURE_OPENAI_DEPLOYMENT_NAME"]

credential = DefaultAzureCredential()

token_provider = get_bearer_token_provider(
    credential,
    "https://cognitiveservices.azure.com/.default"
)

client = AzureOpenAI(
    azure_endpoint=endpoint,
    azure_ad_token_provider=token_provider,
    api_version="2024-12-01-preview",
)

def ask_teacher(query: str) -> str | None:
    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are a professor of music theory. "
                    "Frame your responses in the context of answering a guitar student."},
            {
                "role": "user",
                "content": query,
            }
        ],
        temperature=0.9,
    )
    return response.choices[0].message.content
