from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, todos, categories, templates, calendar, stats

# NOTE: import existing routers (todos, categories) from your current main.py
# and add the dashboard router alongside them as shown below.

app = FastAPI(title="todo-list-3 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- existing routers (keep as-is) ---
# app.include_router(todos.router)
# app.include_router(categories.router)

# --- Phase 1: dashboard router (new) ---
app.include_router(dashboard.router)
app.include_router(calendar.router)   # calendar before todos — /todos/calendar must match before /todos/{todo_id}
app.include_router(todos.router)
app.include_router(categories.router)
app.include_router(templates.router)
app.include_router(stats.router)
