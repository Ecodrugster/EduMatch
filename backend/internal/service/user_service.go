package service

import (
    "context"
    "errors"
    "log"


    "golang.org/x/crypto/bcrypt"
    "github.com/go-playground/validator/v10"
    "github.com/redis/go-redis/v9"

    "edumatch/config"
    "edumatch/internal/domain"
    "edumatch/internal/repository"
    "edumatch/pkg/jwt_util"
)


type UserService struct {
    repo    repository.UserRepo
    cfg     *config.Config
    redis   *redis.Client
    validate *validator.Validate
}


func NewUserService(repo repository.UserRepo, cfg *config.Config, redisClient *redis.Client) *UserService {
    return &UserService{repo: repo, cfg: cfg, redis: redisClient, validate: validator.New()}
}


func (s *UserService) Register(ctx context.Context, in domain.SignUpInput) (int64, error) {
    
    if err := s.validate.Struct(in); err != nil {
        return 0, err
    }
   
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


func (s *UserService) Login(ctx context.Context, in domain.SignInInput) (accessToken string, refreshToken string, err error) {
    
    if err := s.validate.Struct(in); err != nil {
        return "", "", err
    }
    
    user, err := s.repo.GetByEmail(ctx, in.Email)
    if err != nil {
        return "", "", err
    }
   
    if err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(in.Password)); err != nil {
        return "", "", errors.New("invalid credentials")
    }
    
    accessToken, err = jwt_util.GenerateAccessToken(s.cfg, user.ID)
    if err != nil {
        return "", "", err
    }
    refreshToken, err = jwt_util.GenerateRefreshToken(s.cfg, user.ID)
    if err != nil {
        return "", "", err
    }
    
    key := "refresh:" + refreshToken
    if s.redis != nil {
        if err = s.redis.Set(ctx, key, user.ID, s.cfg.RefreshTokenExpiry()).Err(); err != nil {
            return "", "", err
        }
    } else {
        // mock success if redis is not running locally
        log.Printf("⚠️ Mocking Redis Set for user %d", user.ID)
    }
    return accessToken, refreshToken, nil
}


func (s *UserService) RefreshAccess(ctx context.Context, refreshToken string) (string, error) {
    
    userID, err := jwt_util.ValidateRefreshToken(s.cfg, refreshToken)
    if err != nil {
        return "", err
    }
    
    key := "refresh:" + refreshToken
    var storedID int64
    if s.redis != nil {
        storedID, err = s.redis.Get(ctx, key).Int64()
        if err != nil {
            return "", errors.New("refresh token not recognized")
        }
    } else {
        // mock success
        storedID = userID
    }

    if storedID != userID {
        return "", errors.New("refresh token user mismatch")
    }
    
    return jwt_util.GenerateAccessToken(s.cfg, userID)
}

func (s *UserService) GetProfile(ctx context.Context, userID int64) (*domain.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.Password = ""
	return user, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID int64, skills []string, bio string) (*domain.User, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	user.Skills = skills
	user.Bio = bio

	if err := s.repo.UpdateProfile(ctx, user); err != nil {
		return nil, err
	}
	user.Password = ""
	return user, nil
}

func (s *UserService) ListUsers(ctx context.Context, skills []string) ([]*domain.User, error) {
	users, err := s.repo.List(ctx, skills)
	if err != nil {
		return nil, err
	}
	for _, u := range users {
		u.Password = ""
	}
	return users, nil
}
