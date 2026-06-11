package delivery

import (
    "net/http"
    "strconv"
    "strings"
    "github.com/gin-gonic/gin"
    "edumatch/config"
    "edumatch/internal/auth"
)

// AuthMiddleware.
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header missing"})
            return
        }
        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
            return
        }
        token := strings.TrimSpace(parts[1])
        userID, err := auth.ValidateAccessToken(cfg, token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token", "details": err.Error()})
            return
        }
        // Store userID
        c.Set("userID", strconv.FormatInt(userID, 10))
        c.Next()
    }
}
