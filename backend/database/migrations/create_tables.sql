-- ============================================================
-- 기본 테이블 생성 SQL
-- Supabase SQL Editor에서 한 번만 실행하세요.
-- 이미 테이블이 존재하면 무시합니다 (IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- 1. categories 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories: 본인 데이터만 접근" ON categories;
CREATE POLICY "categories: 본인 데이터만 접근"
    ON categories FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. todos 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS todos (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title                    TEXT        NOT NULL,
    is_completed             BOOLEAN     NOT NULL DEFAULT FALSE,
    completed_at             TIMESTAMPTZ,
    due_date                 DATE,
    priority                 TEXT        CHECK (priority IN ('high', 'medium', 'low')),
    category_id              UUID        REFERENCES categories(id) ON DELETE SET NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    recurrence_type          TEXT        CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
    recurrence_days          TEXT,
    recurrence_day_of_month  INTEGER,
    recurrence_paused        BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id     ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date    ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(user_id, completed_at)
    WHERE completed_at IS NOT NULL;

-- RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todos: 본인 데이터만 접근" ON todos;
CREATE POLICY "todos: 본인 데이터만 접근"
    ON todos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. todo_templates 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS todo_templates (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_todo_templates_user_id ON todo_templates(user_id);

-- RLS
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todo_templates: 본인 데이터만 접근" ON todo_templates;
CREATE POLICY "todo_templates: 본인 데이터만 접근"
    ON todo_templates FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. todo_template_items 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS todo_template_items (
    id              UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID     NOT NULL REFERENCES todo_templates(id) ON DELETE CASCADE,
    title           TEXT     NOT NULL,
    category_id     UUID     REFERENCES categories(id) ON DELETE SET NULL,
    priority        TEXT     CHECK (priority IN ('high', 'medium', 'low')),
    due_date_offset INTEGER,
    sort_order      INTEGER  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_todo_template_items_template_id ON todo_template_items(template_id);

-- todo_template_items는 user_id 없이 template_id를 통해 RLS 적용
ALTER TABLE todo_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "todo_template_items: 템플릿 소유자만 접근" ON todo_template_items;
CREATE POLICY "todo_template_items: 템플릿 소유자만 접근"
    ON todo_template_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM todo_templates t
            WHERE t.id = template_id
              AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM todo_templates t
            WHERE t.id = template_id
              AND t.user_id = auth.uid()
        )
    );
