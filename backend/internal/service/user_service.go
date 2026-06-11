package service

import (
    "context"
    "errors"


    "golang.org/x/crypto/bcrypt"
    "github.com/go-playground/validator/v10"
    "github.com/redis/go-redis/v9"

    "edumatch/config"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
    "edumatch/internal/auth"
)

// UserService provides user‑related business logic.
type UserService struct {
    repo    repository.UserRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}

// NewUserService constructs a UserService.
func NewUserService(repo repository.UserRepo, cfg *config.Config, redisClient *redis.Client) *UserService {
    return &UserService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}

// Register creates a new user, hashing the password.
func (s *UserService) Register(ctx context.Context, in domain.SignUpInput) (int64, error) {
    // Validate DTO fields.
    if err := s.validate.Struct(in); err != nil {
        return 0, err
    }
    // Hash password.
    hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
    if err != nil {
        return 0, err
    }
    user := &domain.User{
        Username: in.Username,
        Email:    in.Email,
        Password: string(hash),
        Skills:   in.Skills,
        Bio:      "",
    }
    if err := s.repo.Create(ctx, user); err != nil {
        return 0, err
    }
    return user.ID, nil
}

// Login checks credentials and returns JWT tokens.
func (s *UserService) Login(ctx context.Context, in domain.SignInInput) (accessToken string, refreshToken string, err error) {
    // Validate input.
    if err := s.validate.Struct(in); err != nil {
        return "", "", err
    }
    // Retrieve user by email.
    user, err := s.repo.GetByEmail(ctx, in.Email)
    if err != nil {
        return "", "", err
    }
    // Compare password.
    if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(in.Password)); err != nil {
        return "", "", errors.New("invalid credentials")
    }
    // Generate tokens.
    accessToken, err = auth.GenerateAccessToken(s.cfg, user.ID)
    if err != nil {
        return "", "", err
    }
    refreshToken, err = auth.GenerateRefreshToken(s.cfg, user.ID)
    if err != nil {
        return "", "", err
    }
    // Store refresh token in Redis with TTL.
    key := "refresh:" + refreshToken
    if err = s.redis.Set(ctx, key, user.ID, s.cfg.RefreshTokenExpiry()).Err(); err != nil {
        return "", "", err
    }
    return accessToken, refreshToken, nil
}

// RefreshAccess creates a new access token using a valid refresh token.
func (s *UserService) RefreshAccess(ctx context.Context, refreshToken string) (string, error) {
    // Verify refresh token signature and expiry.
    userID, err := auth.ValidateRefreshToken(s.cfg, refreshToken)
    if err != nil {
        return "", err
    }
    // Ensure token exists in Redis (revocation protection).
    key := "refresh:" + refreshToken
    storedID, err := s.redis.Get(ctx, key).Int64()
    if err != nil {
        return "", errors.New("refresh token not recognized")
    }
    if storedID != userID {
        return "", errors.New("refresh token user mismatch")
    }
    // Generate new access token.
    return auth.GenerateAccessToken(s.cfg, userID)
}
