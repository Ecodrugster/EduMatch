package repository

import (
    "context"
    "time"
    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresMemberRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresMemberRepo(pool *pgxpool.Pool) MemberRepo {
    return &postgresMemberRepo{pool: pool}
}

// Add inserts a new member into the members table.
func (r *postgresMemberRepo) Add(ctx context.Context, m *domain.Member) error {
    const q = `
        INSERT INTO members (project_id, user_id, joined_at)
        VALUES ($1, $2, $3)
        RETURNING id;
    `
    now := time.Now().UTC()
    err := r.pool.QueryRow(ctx, q, m.ProjectID, m.UserID, now).Scan(&m.ID)
    if err != nil {
        return err
    }
    m.JoinedAt = now
    return nil
}

// ListByProject returns all members of a project.
func (r *postgresMemberRepo) ListByProject(ctx context.Context, projectID int64) ([]*domain.Member, error) {
    const q = `
        SELECT id, project_id, user_id, joined_at
        FROM members
        WHERE project_id = $1 AND deleted_at IS NULL;
    `
    rows, err := r.pool.Query(ctx, q, projectID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var members []*domain.Member
    for rows.Next() {
        var m domain.Member
        if err := rows.Scan(&m.ID, &m.ProjectID, &m.UserID, &m.JoinedAt); err != nil {
            return nil, err
        }
        members = append(members, &m)
    }
    return members, nil
}
