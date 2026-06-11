// internal/domain/models.go
package domain

import "time"

// User represents a platform user.
// db tags are for sqlx/pgx mapping; json tags for API responses.
type User struct {
    ID        int64    `json:"id" db:"id"`
    Username  string   `json:"username" db:"username"`
    Email     string   `json:"email" db:"email"`
    Password  string   `json:"-" db:"password_hash"`
    Skills    []string `json:"skills" db:"skills"` // PostgreSQL text[]
    Bio       string   `json:"bio" db:"bio"`
    CreatedAt string   `json:"created_at" db:"created_at"`
    UpdatedAt string   `json:"updated_at" db:"updated_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Project represents a project looking for teammates.
type Project struct {
    ID               int64    `json:"id" db:"id"`
    OwnerID          int64    `json:"owner_id" db:"owner_id"`
    Title            string   `json:"title" db:"title"`
    Description      string   `json:"description" db:"description"`
    SkillsRequired   []string `json:"skills_required" db:"skills_required"`
    CreatedAt        string   `json:"created_at" db:"created_at"`
    UpdatedAt        string   `json:"updated_at" db:"updated_at"`
    IsOpen           bool     `json:"is_open" db:"is_open"`
    DeletedAt        *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Application links a user to a project (a request to join).
type Application struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    UserID    int64  `json:"user_id" db:"user_id"`
    Message   string `json:"message" db:"message"`
    Status    string `json:"status" db:"status"` // pending, accepted, rejected
    CreatedAt string `json:"created_at" db:"created_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Message represents a chat message inside a project room.
type Message struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    SenderID  int64  `json:"sender_id" db:"sender_id"`
    Content   string `json:"content" db:"content"`
    SentAt    string `json:"sent_at" db:"sent_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// Member represents a user who is part of a project (joined team).
type Member struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    UserID    int64  `json:"user_id" db:"user_id"`
    JoinedAt  string `json:"joined_at" db:"joined_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}
