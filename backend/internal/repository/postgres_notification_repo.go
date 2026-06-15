package repository

import (
    "context"
    "time"
    "edumatch/internal/domain"
    "github.com/jackc/pgx/v5/pgxpool"
)

type postgresNotificationRepo struct {
    pool *pgxpool.Pool
}

func NewPostgresNotificationRepo(pool *pgxpool.Pool) NotificationRepo {
    return &postgresNotificationRepo{pool: pool}
}

func (r *postgresNotificationRepo) Create(ctx context.Context, n *domain.Notification) error {
    const q = `
        INSERT INTO notifications (user_id, type, message, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id;
    `
    now := time.Now().UTC()
    n.CreatedAt = now
    err := r.pool.QueryRow(ctx, q, n.UserID, n.Type, n.Message, n.IsRead, n.CreatedAt).Scan(&n.ID)
    return err
}

func (r *postgresNotificationRepo) ListByUser(ctx context.Context, userID int64) ([]*domain.Notification, error) {
    const q = `
        SELECT id, user_id, type, message, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50;
    `
    rows, err := r.pool.Query(ctx, q, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var notifications []*domain.Notification
    for rows.Next() {
        var n domain.Notification
        if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Message, &n.IsRead, &n.CreatedAt); err != nil {
            return nil, err
        }
        notifications = append(notifications, &n)
    }
    return notifications, nil
}

func (r *postgresNotificationRepo) MarkAsRead(ctx context.Context, id int64) error {
    const q = `UPDATE notifications SET is_read = true WHERE id = $1;`
    _, err := r.pool.Exec(ctx, q, id)
    return err
}

func (r *postgresNotificationRepo) MarkAllAsRead(ctx context.Context, userID int64) error {
    const q = `UPDATE notifications SET is_read = true WHERE user_id = $1;`
    _, err := r.pool.Exec(ctx, q, userID)
    return err
}
