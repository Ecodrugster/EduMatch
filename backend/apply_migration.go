package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	dsn := "postgres://postgres:123@localhost:5435/Edu?sslmode=disable"
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer pool.Close()

	sqlBytes, err := os.ReadFile("internal/migrations/002_add_avatar_url.up.sql")
	if err != nil {
		log.Fatalf("failed to read sql file: %v", err)
	}

	_, err = pool.Exec(context.Background(), string(sqlBytes))
	if err != nil {
		log.Fatalf("failed to execute query: %v", err)
	}
	fmt.Println("Migration 002 applied successfully!")
}
