package domain

import "time"

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

type RoleRequirementInput struct {
	SkillID  int64 `json:"skill_id" validate:"required"`
	MinLevel int   `json:"min_level" validate:"required,min=1,max=5"`
	Weight   int   `json:"weight" validate:"required,min=1,max=3"`
}

type RoleInput struct {
	Title        string                 `json:"title" validate:"required"`
	HoursPerWeek int                    `json:"hours_per_week" validate:"required,min=1"`
	Requirements []RoleRequirementInput `json:"requirements"`
}

type CreateProjectInput struct {
	Title          string      `json:"title" validate:"required"`
	Description    string      `json:"description"`
	SkillsRequired []string    `json:"skills_required"`
	Deadline       *time.Time  `json:"deadline,omitempty"`
	OwnerID        int64       `json:"owner_id"`
	Roles          []RoleInput `json:"roles,omitempty"`
}

type UpdateProjectInput struct {
	ID             int64      `json:"id" validate:"required"`
	Title          *string    `json:"title,omitempty"`
	Description    *string    `json:"description,omitempty"`
	SkillsRequired []string   `json:"skills_required,omitempty"`
	Status         *string    `json:"status,omitempty"`
	Deadline       *time.Time `json:"deadline,omitempty"`
	IsOpen         *bool      `json:"is_open,omitempty"`
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

type InviteInput struct {
	UserID    int64  `json:"user_id"`
	Direction string `json:"direction"` // 'invite' or 'apply'
}

type PeerReviewInput struct {
	TargetID      int64  `json:"target_id" validate:"required"`
	Contribution  int    `json:"contribution" validate:"required,min=1,max=5"`
	Deadlines     int    `json:"deadlines" validate:"required,min=1,max=5"`
	Communication int    `json:"communication" validate:"required,min=1,max=5"`
	Quality       int    `json:"quality" validate:"required,min=1,max=5"`
	Comment       string `json:"comment"`
}
