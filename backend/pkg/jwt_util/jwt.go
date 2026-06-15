package jwt_util

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
    "edumatch/config"

)

type AccessClaims struct {
    UserID int64 `json:"user_id"`
    jwt.RegisteredClaims
}

type RefreshClaims struct {
    UserID int64 `json:"user_id"`
    jwt.RegisteredClaims
}


func GenerateAccessToken(cfg *config.Config, userID int64) (string, error) {

    ttl := time.Duration(cfg.AccessTokenTTLMinutes) * time.Minute
    now := time.Now()
    claims := AccessClaims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
            IssuedAt:  jwt.NewNumericDate(now),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(cfg.JWTSecret))
}

func GenerateRefreshToken(cfg *config.Config, userID int64) (string, error) {
    ttl := cfg.RefreshTokenExpiry()
    now := time.Now()
    claims := RefreshClaims{
        UserID: userID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
            IssuedAt:  jwt.NewNumericDate(now),
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(cfg.RefreshSecret))
}

func ValidateAccessToken(cfg *config.Config, tokenStr string) (int64, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &AccessClaims{}, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, jwt.ErrTokenSignatureInvalid
        }
        return []byte(cfg.JWTSecret), nil
    })
    if err != nil {
        return 0, err
    }
    if claims, ok := token.Claims.(*AccessClaims); ok && token.Valid {
        return claims.UserID, nil
    }
    return 0, jwt.ErrTokenInvalidClaims
}

func ValidateRefreshToken(cfg *config.Config, tokenStr string) (int64, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &RefreshClaims{}, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, jwt.ErrTokenSignatureInvalid
        }
        return []byte(cfg.RefreshSecret), nil
    })
    if err != nil {
        return 0, err
    }
    if claims, ok := token.Claims.(*RefreshClaims); ok && token.Valid {
        return claims.UserID, nil
    }
    return 0, jwt.ErrTokenInvalidClaims
}
