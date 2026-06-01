CREATE TABLE todo_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE todo_template_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES todo_templates(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
    due_date_offset INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_todo_templates_user_id ON todo_templates(user_id);
CREATE INDEX idx_todo_template_items_template_id ON todo_template_items(template_id);
