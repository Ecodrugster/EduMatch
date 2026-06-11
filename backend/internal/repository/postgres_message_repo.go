package repository

import (
    "context"
    "time"
    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresMessageRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresMessageRepo(pool *pgxpool.Pool) MessageRepo {
    return &postgresMessageRepo{pool: pool}
}

func (r *postgresMessageRepo) Create(ctx context.Context, m *domain.Message) error {
    const q = `
        INSERT INTO messages (project_id, sender_id, content, sent_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id;
    `
    now := time.Now().UTC()
    err := r.pool.QueryRow(ctx, q, m.ProjectID, m.SenderID, m.Content, now).Scan(&m.ID)
    if err != nil {
        return err
    }
    m.SentAt = now.Format(time.RFC3339)
    return nil
}

func (r *postgresMessageRepo) ListByProject(ctx context.Context, projectID int64, limit, offset int) ([]*domain.Message, error) {
    const q = `
        SELECT id, project_id, sender_id, content, sent_at
        FROM messages
        WHERE project_id = $1 AND deleted_at IS NULL
        ORDER BY sent_at ASC
        LIMIT $2 OFFSET $3;
    `
    rows, err := r.pool.Query(ctx, q, projectID, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var msgs []*domain.Message
    for rows.Next() {
        var m domain.Message
        if err := rows.Scan(&m.ID, &m.ProjectID, &m.SenderID, &m.Content, &m.SentAt); err != nil {
            return nil, err
        }
        msgs = append(msgs, &m)
    }
    return msgs, nil
}
