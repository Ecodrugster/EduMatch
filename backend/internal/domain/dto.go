package domain

type SignUpInput struct {
    Username string   `json:"username" validate:"required,min=3,max=30"`
    Email    string   `json:"email"    validate:"required,email"`
    Password string   `json:"password" validate:"required,min=8"`
    Skills   []string `json:"skills,omitempty"`
    Bio      string   `json:"bio,omitempty"`
}

type SignInInput struct {
    Email    string `json:"email"    validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type CreateProjectInput struct {
    Title          string   `json:"title" validate:"required"`
    Description    string   `json:"description"`
    SkillsRequired []string `json:"skills_required" validate:"required,min=1"`
    OwnerID        int64    `json:"owner_id"` 
}

type UpdateProjectInput struct {
    ID             int64    `json:"id" validate:"required"`
    Title          *string  `json:"title,omitempty"`
    Description    *string  `json:"description,omitempty"`
    SkillsRequired []string `json:"skills_required,omitempty"`
    IsOpen         *bool    `json:"is_open,omitempty"`
}

type ApplicationInput struct {
    ProjectID int64  `json:"project_id" validate:"required"`
    Message   string `json:"message"`
    UserID    int64  `json:"user_id"` 
}

type MessageInput struct {
    ProjectID int64  `json:"project_id" validate:"required"`
    Content   string `json:"content" validate:"required"`
    SenderID  int64  `json:"sender_id"`
}


type MemberInput struct {
    ProjectID int64 `json:"project_id" validate:"required"`
    UserID    int64 `json:"user_id"` 
}
