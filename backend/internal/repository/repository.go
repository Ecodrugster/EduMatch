package repository

import (
    "context"
    "github.com/jackc/pgx/v5/pgxpool"
    "edumatch/internal/domain"
)

// UserRepo abstracts user persistence.
type UserRepo interface {
    Create(ctx context.Context, u *domain.User) error
    GetByEmail(ctx context.Context, email string) (*domain.User, error)
    GetByID(ctx context.Context, id int64) (*domain.User, error)
    Delete(ctx context.Context, id int64) error // soft delete
}

// ProjectRepo abstracts project persistence.
type ProjectRepo interface {
    Create(ctx context.Context, p *domain.Project) error
    GetByID(ctx context.Context, id int64) (*domain.Project, error)
    Update(ctx context.Context, p *domain.Project) error
    Delete(ctx context.Context, id int64) error // soft delete
    List(ctx context.Context, filter ProjectFilter) ([]*domain.Project, error)
}

type ProjectFilter struct {
    TitleContains string
    Skills []string
    OwnerID int64
    OpenOnly bool
}

// ApplicationRepo abstracts application persistence.
type ApplicationRepo interface {
    Create(ctx context.Context, a *domain.Application) error
    GetByID(ctx context.Context, id int64) (*domain.Application, error)
    UpdateStatus(ctx context.Context, id int64, status string) error
    ListByProject(ctx context.Context, projectID int64) ([]*domain.Application, error)
    ListByUser(ctx context.Context, userID int64) ([]*domain.Application, error)
}

// MessageRepo abstracts chat messages.
type MessageRepo interface {
    Create(ctx context.Context, m *domain.Message) error
    ListByProject(ctx context.Context, projectID int64, limit, offset int) ([]*domain.Message, error)
}

// MemberRepo abstracts project members.
type MemberRepo interface {
    Add(ctx context.Context, m *domain.Member) error
    ListByProject(ctx context.Context, projectID int64) ([]*domain.Member, error)
}

// NewRepositories creates concrete implementations backed by pgxpool.
func NewRepositories(pool *pgxpool.Pool) *Repos {
    return &Repos{
        User:        NewPostgresUserRepo(pool),
        Project:     NewPostgresProjectRepo(pool),
        Application: NewPostgresApplicationRepo(pool),
        Message:     NewPostgresMessageRepo(pool),
        Member:      NewPostgresMemberRepo(pool),
    }
}

type Repos struct {
    User        UserRepo
    Project     ProjectRepo
    Application ApplicationRepo
    Message     MessageRepo
    Member      MemberRepo
}
