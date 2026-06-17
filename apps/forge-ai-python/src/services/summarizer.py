"""Document summarization service."""

from typing import Optional

from models.schemas import ChatMessage, SummarizeResponse
from services.llm_client import LLMClient


class Summarizer:
    """Service for summarizing documents using LLM."""

    STYLE_PROMPTS = {
        "brief": "请用简洁的语言总结以下内容的核心要点，不超过{max_length}字。",
        "detailed": "请详细总结以下内容的主要观点和关键信息，包含具体细节，不超过{max_length}字。",
        "bullet": "请用要点列表的形式总结以下内容，每个要点一行，总字数不超过{max_length}字。",
    }

    def __init__(self, provider: Optional[str] = None):
        self.llm_client = LLMClient(provider)

    async def summarize(
        self,
        text: str,
        style: str = "brief",
        max_length: int = 500,
        provider: Optional[str] = None,
    ) -> SummarizeResponse:
        """Summarize text using LLM.

        Args:
            text: Text to summarize
            style: Summary style (brief, detailed, bullet)
            max_length: Maximum summary length in characters
            provider: Override provider name

        Returns:
            SummarizeResponse with summary and metadata
        """
        # Get system prompt for style
        system_prompt = self.STYLE_PROMPTS.get(style, self.STYLE_PROMPTS["brief"]).format(
            max_length=max_length
        )

        # Build messages
        messages = [
            ChatMessage(role="system", content=system_prompt),
            ChatMessage(role="user", content=f"以下是需要总结的内容:\n\n{text}"),
        ]

        # Call LLM
        response = await self.llm_client.chat(
            messages=messages,
            provider=provider,
            temperature=0.5,  # Lower temperature for more focused summaries
            max_tokens=max_length * 2,  # Token estimate for Chinese
        )

        summary = response.choices[0].message.content

        return SummarizeResponse(
            summary=summary,
            provider=response.provider,
            model=response.model,
            original_length=len(text),
            summary_length=len(summary),
        )

    async def summarize_with_questions(
        self,
        text: str,
        questions: list[str],
        provider: Optional[str] = None,
    ) -> dict[str, str]:
        """Answer specific questions about text.

        Args:
            text: Text to analyze
            questions: List of questions to answer
            provider: Override provider name

        Returns:
            Dict mapping questions to answers
        """
        system_prompt = "请根据提供的文本内容回答问题。如果文本中没有相关信息，请回答'文本中未提及'。"

        results: dict[str, str] = {}

        for question in questions:
            messages = [
                ChatMessage(role="system", content=system_prompt),
                ChatMessage(role="user", content=f"文本内容:\n\n{text}\n\n问题: {question}"),
            ]

            response = await self.llm_client.chat(
                messages=messages,
                provider=provider,
                temperature=0.3,
            )

            results[question] = response.choices[0].message.content

        return results