package config

import (
    "log"
    "os"
    "strconv"
    "time"
    "github.com/joho/godotenv"
)

type Config struct {
    ServerPort            string
    PostgresDSN           string
    RedisAddr             string
    RedisPassword         string
    JWTSecret             string
    RefreshSecret         string
    AccessTokenTTLMinutes int // access token TTL in minutes
    RefreshExpiryDays     int // refresh token TTL in days
}

var AppConfig *Config

func Load() {
    // Load .env file if present
    _ = godotenv.Load()
    // Helper to get env with fallback
    getEnv := func(key, fallback string) string {
        if value, exists := os.LookupEnv(key); exists {
            return value
        }
        return fallback
    }
    // Parse integer values safely
    parseInt := func(key string, fallback int) int {
        str := getEnv(key, "")
        if str == "" {
            return fallback
        }
        v, err := strconv.Atoi(str)
        if err != nil {
            log.Printf("invalid int for %s: %v, using fallback %d", key, err, fallback)
            return fallback
        }
        return v
    }
    cfg := &Config{
        ServerPort:            getEnv("SERVER_PORT", "8080"),
        PostgresDSN:           getEnv("POSTGRES_DSN", "postgres://user:password@localhost:5432/edumatch?sslmode=disable"),
        RedisAddr:             getEnv("REDIS_ADDR", "localhost:6379"),
        RedisPassword:         getEnv("REDIS_PASSWORD", ""),
        JWTSecret:             getEnv("JWT_SECRET", "supersecretkey"),
        RefreshSecret:         getEnv("REFRESH_SECRET", "refreshsupersecret"),
        AccessTokenTTLMinutes: parseInt("ACCESS_TOKEN_TTL_MINUTES", 15),
        RefreshExpiryDays:     parseInt("REFRESH_EXPIRY_DAYS", 7),
    }
    AppConfig = cfg
}

func (c *Config) GetRedisOptions() *RedisOptions {
    return &RedisOptions{Addr: c.RedisAddr, Password: c.RedisPassword}
}

// Simple struct for passing Redis options to callers
type RedisOptions struct {
    Addr     string
    Password string
}

// Helper to get server address string for Gin
func (c *Config) ServerAddress() string {
    return ":" + c.ServerPort
}

// Helper to get JWT expiration duration
func (c *Config) AccessTokenExpiry() time.Duration {
    return time.Duration(c.AccessTokenTTLMinutes) * time.Minute
}

func (c *Config) RefreshTokenExpiry() time.Duration {
    return time.Duration(c.RefreshExpiryDays) * 24 * time.Hour
}
