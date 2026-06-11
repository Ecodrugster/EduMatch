// internal/domain/dto.go
package domain

// SignUpInput represents data required for user registration.
type SignUpInput struct {
    Username string   `json:"username" validate:"required,min=3,max=30"`
    Email    string   `json:"email"    validate:"required,email"`
    Password string   `json:"password" validate:"required,min=8"`
    Skills   []string `json:"skills,omitempty"`
    Bio      string   `json:"bio,omitempty"`
}

// SignInInput represents data for user login.
type SignInInput struct {
    Email    string `json:"email"    validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

// CreateProjectInput represents data for creating a new project.
type CreateProjectInput struct {
    Title          string   `json:"title" validate:"required"`
    Description    string   `json:"description"`
    SkillsRequired []string `json:"skills_required" validate:"required,min=1"`
    OwnerID        int64    `json:"owner_id"` // set from JWT userID
}

// UpdateProjectInput represents data for updating a project.
type UpdateProjectInput struct {
    ID             int64    `json:"id" validate:"required"`
    Title          *string  `json:"title,omitempty"`
    Description    *string  `json:"description,omitempty"`
    SkillsRequired []string `json:"skills_required,omitempty"`
    IsOpen         *bool    `json:"is_open,omitempty"`
}

// ApplicationInput for creating an application.
type ApplicationInput struct {
    ProjectID int64  `json:"project_id" validate:"required"`
    Message   string `json:"message"`
    UserID    int64  `json:"user_id"` // set from JWT
}

// MessageInput for creating a chat message.
type MessageInput struct {
    ProjectID int64  `json:"project_id" validate:"required"`
    Content   string `json:"content" validate:"required"`
    SenderID  int64  `json:"sender_id"` // set from JWT
}

// MemberInput for adding a member to a project.
type MemberInput struct {
    ProjectID int64 `json:"project_id" validate:"required"`
    UserID    int64 `json:"user_id"` // set from JWT
}
