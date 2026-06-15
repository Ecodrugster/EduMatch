package infra

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/redis/go-redis/v9"
    "edumatch/config"
)


func InitPostgres(cfg *config.Config) *pgxpool.Pool {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    pool, err := pgxpool.New(ctx, cfg.PostgresDSN)
    if err != nil {
        log.Fatalf("Unable to connect to PostgreSQL: %v", err)
    }

    if err := pool.Ping(ctx); err != nil {
        log.Fatalf("PostgreSQL ping failed: %v", err)
    }
    fmt.Println("✅ PostgreSQL connected")
    return pool
}

func InitRedis(cfg *config.Config) *redis.Client {
    rdb := redis.NewClient(&redis.Options{
        Addr:     cfg.RedisAddr,
        Password: cfg.RedisPassword,
        DB:       0,
    })
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    if err := rdb.Ping(ctx).Err(); err != nil {
        log.Printf("⚠️ Warning: Unable to connect to Redis: %v. Running without Redis.", err)
        return nil
    }
    fmt.Println("✅ Redis connected")
    return rdb
}
