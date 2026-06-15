package delivery

import (
    "net/http"
    "strconv"
    "strings"
    "github.com/gin-gonic/gin"
    "edumatch/config"
    "edumatch/pkg/jwt_util"
)

// AuthMiddleware
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        var token string
        authHeader := c.GetHeader("Authorization")
        if authHeader != "" {
            parts := strings.SplitN(authHeader, " ", 2)
            if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
                token = strings.TrimSpace(parts[1])
            }
        }
        
        // Fallback for WebSockets where Authorization header cannot be set
        if token == "" {
            token = c.Query("token")
        }

        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization missing"})
            return
        }
        userID, err := jwt_util.ValidateAccessToken(cfg, token)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token", "details": err.Error()})
            return
        }
        // Store userID
        c.Set("userID", strconv.FormatInt(userID, 10))
        c.Next()
    }
}
