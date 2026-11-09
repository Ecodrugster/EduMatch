package domain

import "time"

type User struct {
	ID           int64      `json:"id" db:"id"`
	Username     string     `json:"username" db:"username"`
	Email        string     `json:"email" db:"email"`
	Password     string     `json:"-" db:"password_hash"`
	Skills       []string   `json:"skills" db:"skills"`
	Bio          string     `json:"bio" db:"bio"`
	AvatarURL    *string    `json:"avatar_url" db:"avatar_url"`
	AvgPeerScore *float64   `json:"avg_peer_score,omitempty" db:"avg_peer_score"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt    *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Project struct {
	ID             int64      `json:"id" db:"id"`
	OwnerID        int64      `json:"owner_id" db:"owner_id"`
	Title          string     `json:"title" db:"title"`
	Description    string     `json:"description" db:"description"`
	SkillsRequired []string   `json:"skills_required" db:"skills_required"`
	Status         string     `json:"status" db:"status"`
	Deadline       *time.Time `json:"deadline,omitempty" db:"deadline"`
	StartDate      *time.Time `json:"start_date,omitempty" db:"start_date"`
	EndDate        *time.Time `json:"end_date,omitempty" db:"end_date"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	IsOpen         bool       `json:"is_open" db:"is_open"`
	DeletedAt      *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Application struct {
	ID        int64      `json:"id" db:"id"`
	ProjectID int64      `json:"project_id" db:"project_id"`
	UserID    int64      `json:"user_id" db:"user_id"`
	Message   string     `json:"message" db:"message"`
	Status    string     `json:"status" db:"status"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Message struct {
	ID        int64      `json:"id" db:"id"`
	ProjectID int64      `json:"project_id" db:"project_id"`
	SenderID  int64      `json:"sender_id" db:"sender_id"`
	Content   string     `json:"content" db:"content"`
	SentAt    time.Time  `json:"sent_at" db:"sent_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

type Member struct {
	ID        int64      `json:"id" db:"id"`
	ProjectID int64      `json:"project_id" db:"project_id"`
	UserID    int64      `json:"user_id" db:"user_id"`
	Username  string     `json:"username,omitempty" db:"username"`
	JoinedAt  time.Time  `json:"joined_at" db:"joined_at"`
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

type ProjectDocument struct {
	ID         int64      `json:"id" db:"id"`
	ProjectID  int64      `json:"project_id" db:"project_id"`
	UploadedBy int64      `json:"uploaded_by" db:"uploaded_by"`
	Name       string     `json:"name" db:"name"`
	FilePath   string     `json:"file_path" db:"file_path"`
	FileSize   int64      `json:"file_size" db:"file_size"`
	CreatedAt  time.Time  `json:"created_at" db:"created_at"`
	DeletedAt  *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// ---- Smart Team Builder Models ----

type Skill struct {
	ID       int64  `json:"id" db:"id"`
	Name     string `json:"name" db:"name"`
	Category string `json:"category" db:"category"`
}

type UserSkill struct {
	ID           int64   `json:"id" db:"id"`
	UserID       int64   `json:"user_id" db:"user_id"`
	SkillID      int64   `json:"skill_id" db:"skill_id"`
	SkillName    string  `json:"skill_name,omitempty" db:"skill_name"`
	Category     string  `json:"category,omitempty" db:"category"`
	Level        int     `json:"level" db:"level"` // 1-5
	EvidenceType string  `json:"evidence_type" db:"evidence_type"`
	EvidenceURL  string  `json:"evidence_url" db:"evidence_url"`
	Verified     bool    `json:"verified" db:"verified"`
}

type UserAvailability struct {
	UserID       int64 `json:"user_id" db:"user_id"`
	HoursPerWeek int   `json:"hours_per_week" db:"hours_per_week"`
}

type ProjectRole struct {
	ID           int64             `json:"id" db:"id"`
	ProjectID    int64             `json:"project_id" db:"project_id"`
	Title        string            `json:"title" db:"title"`
	HoursPerWeek int               `json:"hours_per_week" db:"hours_per_week"`
	Requirements []RoleRequirement `json:"requirements,omitempty"`
	AssignedUser *TeamMember       `json:"assigned_user,omitempty"`
}

type RoleRequirement struct {
	ID        int64  `json:"id" db:"id"`
	RoleID    int64  `json:"role_id" db:"role_id"`
	SkillID   int64  `json:"skill_id" db:"skill_id"`
	SkillName string `json:"skill_name,omitempty" db:"skill_name"`
	MinLevel  int    `json:"min_level" db:"min_level"`
	Weight    int    `json:"weight" db:"weight"` // 1-3
}

type Invite struct {
	ID           int64     `json:"id" db:"id"`
	RoleID       int64     `json:"role_id" db:"role_id"`
	RoleTitle    string    `json:"role_title,omitempty" db:"role_title"`
	ProjectID    int64     `json:"project_id,omitempty" db:"project_id"`
	ProjectTitle string    `json:"project_title,omitempty" db:"project_title"`
	UserID       int64     `json:"user_id" db:"user_id"`
	Username     string    `json:"username,omitempty" db:"username"`
	AvatarURL    *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	Direction    string    `json:"direction" db:"direction"` // 'invite' | 'apply'
	Status       string    `json:"status" db:"status"`       // 'pending', 'accepted', 'rejected', 'canceled'
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type TeamMember struct {
	ID        int64     `json:"id" db:"id"`
	ProjectID int64     `json:"project_id" db:"project_id"`
	RoleID    int64     `json:"role_id" db:"role_id"`
	RoleTitle string    `json:"role_title,omitempty" db:"role_title"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Username  string    `json:"username,omitempty" db:"username"`
	Email     string    `json:"email,omitempty" db:"email"`
	AvatarURL *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	JoinedAt  time.Time `json:"joined_at" db:"joined_at"`
}

type PeerReview struct {
	ID            int64     `json:"id" db:"id"`
	ProjectID     int64     `json:"project_id" db:"project_id"`
	AuthorID      int64     `json:"author_id" db:"author_id"`
	AuthorName    string    `json:"author_name,omitempty" db:"author_name"`
	TargetID      int64     `json:"target_id" db:"target_id"`
	TargetName    string    `json:"target_name,omitempty" db:"target_name"`
	Contribution  int       `json:"contribution" db:"contribution"`   // 1-5
	Deadlines     int       `json:"deadlines" db:"deadlines"`         // 1-5
	Communication int       `json:"communication" db:"communication"` // 1-5
	Quality       int       `json:"quality" db:"quality"`             // 1-5
	Comment       string    `json:"comment" db:"comment"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

type ScoreParts struct {
	SSkills float64 `json:"sSkills"`
	STime   float64 `json:"sTime"`
	SRel    float64 `json:"sRel"`
}

type Candidate struct {
	UserID       int64        `json:"userId"`
	Username     string       `json:"username"`
	Email        string       `json:"email"`
	AvatarURL    *string      `json:"avatar_url,omitempty"`
	Bio          string       `json:"bio"`
	Score        int          `json:"score"`
	Parts        ScoreParts   `json:"parts"`
	Reasons      []string     `json:"reasons"`
	HoursPerWeek int          `json:"hoursPerWeek"`
	AvgPeerScore *float64     `json:"avgPeerScore"`
	Skills       []UserSkill  `json:"skills"`
	Eligible     bool         `json:"eligible"`
}

type TeamMemberCandidate struct {
	RoleID    int64      `json:"roleId"`
	RoleTitle string     `json:"roleTitle"`
	UserID    int64      `json:"userId"`
	Username  string     `json:"username"`
	AvatarURL *string    `json:"avatar_url,omitempty"`
	Score     int        `json:"score"`
	Parts     ScoreParts `json:"parts"`
	Reasons   []string   `json:"reasons"`
}

type TeamVariant struct {
	TeamScore int                   `json:"teamScore"`
	AvgScore  int                   `json:"avgScore"`
	MinScore  int                   `json:"minScore"`
	Members   []TeamMemberCandidate `json:"members"`
}

type ProjectTrackRecord struct {
	ProjectID    int64    `json:"project_id"`
	ProjectTitle string   `json:"project_title"`
	RoleTitle    string   `json:"role_title"`
	AvgQuality   float64  `json:"avg_quality"`
	AvgOverall   float64  `json:"avg_overall"`
	ReviewCount  int      `json:"review_count"`
}

type UserProfileDetail struct {
	User         User                 `json:"user"`
	HoursPerWeek int                  `json:"hours_per_week"`
	Skills       []UserSkill          `json:"skills"`
	TrackRecord  []ProjectTrackRecord `json:"track_record"`
}
