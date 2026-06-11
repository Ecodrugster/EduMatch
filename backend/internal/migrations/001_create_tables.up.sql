CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    skills TEXT[] DEFAULT ARRAY[]::TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    skills_required TEXT[] DEFAULT ARRAY[]::TEXT,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    user_id BIGINT REFERENCES users(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    sender_id BIGINT REFERENCES users(id),
    content TEXT,
    sent_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    user_id BIGINT REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
