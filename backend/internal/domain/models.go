package domain

import "time"

type User struct {
    ID        int64    `json:"id" db:"id"`
    Username  string   `json:"username" db:"username"`
    Email     string   `json:"email" db:"email"`
    Password  string   `json:"-" db:"password_hash"`
    Skills    []string `json:"skills" db:"skills"`
    Bio       string   `json:"bio" db:"bio"`
    AvatarURL *string  `json:"avatar_url" db:"avatar_url"`
    CreatedAt time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Project struct {
    ID               int64    `json:"id" db:"id"`
    OwnerID          int64    `json:"owner_id" db:"owner_id"`
    Title            string   `json:"title" db:"title"`
    Description      string   `json:"description" db:"description"`
    SkillsRequired   []string `json:"skills_required" db:"skills_required"`
    CreatedAt        time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt        time.Time  `json:"updated_at" db:"updated_at"`
    IsOpen           bool     `json:"is_open" db:"is_open"`
    DeletedAt        *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Application struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    UserID    int64  `json:"user_id" db:"user_id"`
    Message   string `json:"message" db:"message"`
    Status    string `json:"status" db:"status"` 
    CreatedAt time.Time `json:"created_at" db:"created_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Message struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    SenderID  int64  `json:"sender_id" db:"sender_id"`
    Content   string `json:"content" db:"content"`
    SentAt    time.Time `json:"sent_at" db:"sent_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Member struct {
    ID        int64  `json:"id" db:"id"`
    ProjectID int64  `json:"project_id" db:"project_id"`
    UserID    int64  `json:"user_id" db:"user_id"`
    JoinedAt  time.Time `json:"joined_at" db:"joined_at"`
    DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Task struct {
    ID          int64      `json:"id" db:"id"`
    ProjectID   int64      `json:"project_id" db:"project_id"`
    Title       string     `json:"title" db:"title"`
    Description string     `json:"description" db:"description"`
    Status      string     `json:"status" db:"status"`
    AssignedTo  *int64     `json:"assigned_to,omitempty" db:"assigned_to"`
    CreatedAt   time.Time  `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
    DeletedAt   *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Notification struct {
    ID        int64     `json:"id" db:"id"`
    UserID    int64     `json:"user_id" db:"user_id"`
    Type      string    `json:"type" db:"type"`
    Message   string    `json:"message" db:"message"`
    IsRead    bool      `json:"is_read" db:"is_read"`
    CreatedAt time.Time `json:"created_at" db:"created_at"`
}
