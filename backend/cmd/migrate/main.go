package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"edumatch/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	config.Load()
	cfg := config.AppConfig

	log.Printf("Connecting to Postgres at: %s", cfg.PostgresDSN)
	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()
	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("failed to ping postgres: %v", err)
	}
	fmt.Println("Connected to Neon Postgres successfully.")

	// 1. Initial tables
	initialTables := `
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    skills TEXT[] DEFAULT '{}',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT REFERENCES users(id),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    skills_required TEXT[] DEFAULT '{}',
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    user_id BIGINT REFERENCES users(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    sender_id BIGINT REFERENCES users(id),
    content TEXT,
    sent_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS project_documents (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    deleted_at TIMESTAMPTZ
);
`
	if _, err := pool.Exec(ctx, initialTables); err != nil {
		log.Fatalf("failed to apply initial tables: %v", err)
	}
	fmt.Println("✓ Core tables created.")

	// 2. Migration 005
	migrationFile := "internal/migrations/005_smart_team_builder.up.sql"
	sqlBytes, err := os.ReadFile(migrationFile)
	if err != nil {
		sqlBytes, err = os.ReadFile("backend/" + migrationFile)
		if err != nil {
			log.Fatalf("failed to read migration file: %v", err)
		}
	}

	if _, err := pool.Exec(ctx, string(sqlBytes)); err != nil {
		log.Fatalf("failed to apply migration 005: %v", err)
	}

	fmt.Println("✅ All migrations applied successfully to Neon Postgres!")
}
