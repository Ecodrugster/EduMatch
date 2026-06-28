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
        SELECT m.id, m.project_id, m.user_id, u.username, m.joined_at
        FROM members m
        JOIN users u ON m.user_id = u.id
        WHERE m.project_id = $1 AND m.deleted_at IS NULL;
    `
    rows, err := r.pool.Query(ctx, q, projectID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var members []*domain.Member
    for rows.Next() {
        var m domain.Member
        if err := rows.Scan(&m.ID, &m.ProjectID, &m.UserID, &m.Username, &m.JoinedAt); err != nil {
            return nil, err
        }
        members = append(members, &m)
    }
    return members, nil
}

// IsMember checks if a user is a member of a project.
func (r *postgresMemberRepo) IsMember(ctx context.Context, projectID, userID int64) (bool, error) {
    const q = `
        SELECT EXISTS (
            SELECT 1 FROM members
            WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL
            UNION ALL
            SELECT 1 FROM projects
            WHERE id = $1 AND owner_id = $2 AND deleted_at IS NULL
        );
    `
    var exists bool
    err := r.pool.QueryRow(ctx, q, projectID, userID).Scan(&exists)
    return exists, err
}

// Leave removes a user from a project by soft-deleting the member entry.
func (r *postgresMemberRepo) Leave(ctx context.Context, projectID, userID int64) error {
    const q = `
        UPDATE members
        SET deleted_at = $3
        WHERE project_id = $1 AND user_id = $2 AND deleted_at IS NULL;
    `
    _, err := r.pool.Exec(ctx, q, projectID, userID, time.Now().UTC())
    return err
}
