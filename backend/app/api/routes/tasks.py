from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.category import Category
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.pagination import PaginatedResponse, PaginationMeta
from app.schemas.task import TaskCreate, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/stats")
def get_task_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Return task counts grouped by status and priority."""
    tasks = db.query(Task).filter(Task.user_id == current_user.id).all()
    status_counts = {status.value: 0 for status in TaskStatus}
    priority_counts = {priority.value: 0 for priority in TaskPriority}
    for task in tasks:
        status_counts[task.status.value] += 1
        priority_counts[task.priority.value] += 1
    return {"status_counts": status_counts, "priority_counts": priority_counts}


@router.get("", response_model=PaginatedResponse[dict])
def list_tasks(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    category: Optional[int] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> PaginatedResponse[dict]:
    """List tasks for the current user with filtering, search, and pagination."""
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if status is not None:
        query = query.filter(Task.status == status)
    if priority is not None:
        query = query.filter(Task.priority == priority)
    if category is not None:
        query = query.filter(Task.categories.any(Category.id == category))
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(or_(Task.title.ilike(search_term), Task.description.ilike(search_term)))

    total = query.count()
    tasks = query.order_by(Task.created_at.desc()).offset((page - 1) * size).limit(size).all()

    items = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status.value,
            "priority": task.priority.value,
            "due_date": task.due_date,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "categories": [{"id": c.id, "name": c.name} for c in task.categories],
            "meta_data": task.meta_data,
        }
        for task in tasks
    ]
    meta = PaginationMeta(page=page, size=size, total=total, pages=(total + size - 1) // size)
    return PaginatedResponse(items=items, meta=meta)


@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Create a task for the current user."""
    task = Task(
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        priority=task_in.priority,
        due_date=task_in.due_date,
        user_id=current_user.id,
        meta_data=task_in.meta_data,
    )
    if task_in.category_ids:
        categories = db.query(Category).filter(Category.id.in_(task_in.category_ids), Category.user_id == current_user.id).all()
        task.categories = categories
    db.add(task)
    db.commit()
    db.refresh(task)
    return {"id": task.id, "message": "Task created successfully"}


@router.get("/{task_id}", response_model=dict)
def get_task(
    task_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Return a specific task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status.value,
        "priority": task.priority.value,
        "due_date": task.due_date,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "categories": [{"id": c.id, "name": c.name} for c in task.categories],
        "meta_data": task.meta_data,
    }


@router.put("/{task_id}", response_model=dict)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Update a task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in task_in.model_dump(exclude_unset=True).items():
        if field == "category_ids":
            continue
        setattr(task, field, value)

    if task_in.category_ids is not None:
        categories = db.query(Category).filter(Category.id.in_(task_in.category_ids), Category.user_id == current_user.id).all()
        task.categories = categories

    db.commit()
    db.refresh(task)
    return {"id": task.id, "message": "Task updated successfully"}


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Delete a task."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()


@router.patch("/{task_id}/status", response_model=dict)
def update_task_status(
    task_id: int,
    status_value: TaskStatus,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Update just the task status."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status_value
    db.commit()
    db.refresh(task)
    return {"id": task.id, "status": task.status.value, "message": "Task status updated successfully"}

