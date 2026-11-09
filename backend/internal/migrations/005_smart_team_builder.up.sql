-- Migration 005: Smart Team Builder tables and schema updates

-- 1. Skills catalog
CREATE TABLE IF NOT EXISTS skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL
);

-- 2. User skills with level, verification status and evidence
CREATE TABLE IF NOT EXISTS user_skills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    skill_id BIGINT REFERENCES skills(id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
    evidence_type VARCHAR(50) NOT NULL DEFAULT 'none',
    evidence_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(user_id, skill_id)
);

-- 3. User availability
CREATE TABLE IF NOT EXISTS user_availability (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hours_per_week INT NOT NULL DEFAULT 20 CHECK (hours_per_week >= 1 AND hours_per_week <= 168)
);

-- 4. Projects status and deadline columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'open';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Add avg_peer_score to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS avg_peer_score NUMERIC(3, 2) DEFAULT NULL;

-- 5. Project roles
CREATE TABLE IF NOT EXISTS project_roles (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    hours_per_week INT NOT NULL DEFAULT 15 CHECK (hours_per_week >= 1)
);

-- 6. Role requirements
CREATE TABLE IF NOT EXISTS role_requirements (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT REFERENCES project_roles(id) ON DELETE CASCADE,
    skill_id BIGINT REFERENCES skills(id) ON DELETE CASCADE,
    min_level INT NOT NULL DEFAULT 1 CHECK (min_level >= 1 AND min_level <= 5),
    weight INT NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 3),
    UNIQUE(role_id, skill_id)
);

-- 7. Invites and applications
CREATE TABLE IF NOT EXISTS invites (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT REFERENCES project_roles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('invite', 'apply')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Approved team members
CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    role_id BIGINT REFERENCES project_roles(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, role_id),
    UNIQUE(project_id, user_id)
);

-- 9. Peer reviews
CREATE TABLE IF NOT EXISTS peer_reviews (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    author_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    target_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    contribution INT NOT NULL CHECK (contribution >= 1 AND contribution <= 5),
    deadlines INT NOT NULL CHECK (deadlines >= 1 AND deadlines <= 5),
    communication INT NOT NULL CHECK (communication >= 1 AND communication <= 5),
    quality INT NOT NULL CHECK (quality >= 1 AND quality <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_different_users CHECK (author_id <> target_id),
    UNIQUE(project_id, author_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_project_roles_proj ON project_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_role_reqs_role ON role_requirements(role_id);
CREATE INDEX IF NOT EXISTS idx_invites_role_user ON invites(role_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_proj ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_target ON peer_reviews(target_id);

