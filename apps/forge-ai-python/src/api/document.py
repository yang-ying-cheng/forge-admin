"""Document API endpoints."""

from fastapi import APIRouter, File, HTTPException, UploadFile

from models.schemas import DocumentParseResponse, DocumentType, SummarizeRequest, SummarizeResponse
from services.document_parser import DocumentParser
from services.summarizer import Summarizer

router = APIRouter()
document_parser = DocumentParser()


@router.get("/types", response_model=list[DocumentType])
async def get_document_types() -> list[DocumentType]:
    """Get supported document types."""
    types = document_parser.get_supported_types()
    return [DocumentType(**t) for t in types]


@router.post("/parse", response_model=DocumentParseResponse)
async def parse_document(file: UploadFile = File(...)) -> DocumentParseResponse:
    """Parse uploaded document and extract text."""
    # Read file content
    content = await file.read()

    try:
        result = await document_parser.parse(content, file.filename or "unknown")
        return DocumentParseResponse(
            text=result["text"],
            pages=result["pages"],
            metadata=result["metadata"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_document(request: SummarizeRequest) -> SummarizeResponse:
    """Summarize text content."""
    summarizer = Summarizer(request.provider)

    # Check if provider is available
    from services.llm_client import LLMClient

    available_providers = LLMClient.get_available_providers()
    provider = request.provider or "deepseek"

    if provider not in available_providers:
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{provider}' not available. Available: {available_providers}",
        )

    try:
        return await summarizer.summarize(
            text=request.text,
            style=request.style,
            max_length=request.max_length,
            provider=request.provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))