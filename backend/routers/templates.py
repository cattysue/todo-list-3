from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from dependencies import get_current_user, get_supabase, require_user_id
from schemas.template import TemplateApplyRequest, TemplateCreateRequest, TemplateResponse
from schemas.todo import TodoCreateResponse
from services.templates import apply_template, create_template, delete_template, list_templates

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=list[TemplateResponse])
def get_templates(
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    return list_templates(user_id=user_id, supabase=supabase)


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template_endpoint(
    body: TemplateCreateRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    return create_template(
        user_id=user_id,
        name=body.name,
        items=[item.model_dump() for item in body.items],
        supabase=supabase,
    )


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template_endpoint(
    template_id: UUID,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    deleted = delete_template(
        template_id=str(template_id), user_id=user_id, supabase=supabase
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="템플릿을 찾을 수 없습니다.",
        )


@router.post(
    "/{template_id}/apply",
    response_model=list[TodoCreateResponse],
    status_code=status.HTTP_201_CREATED,
)
def apply_template_endpoint(
    template_id: UUID,
    body: TemplateApplyRequest,
    current_user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    user_id = require_user_id(current_user)
    todos = apply_template(
        template_id=str(template_id),
        user_id=user_id,
        base_date=body.base_date,
        supabase=supabase,
    )
    if todos is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="템플릿을 찾을 수 없습니다.",
        )
    return todos
