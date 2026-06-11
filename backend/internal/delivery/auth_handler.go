package delivery

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

// SignUpHandler
func SignUpHandler(c *gin.Context, us *service.UserService) {
    var in domain.SignUpInput
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
        return
    }
    id, err := us.Register(c.Request.Context(), in)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"user_id": id})
}

// LoginHandler
func LoginHandler(c *gin.Context, us *service.UserService) {
    var in domain.SignInInput
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
        return
    }
    access, refresh, err := us.Login(c.Request.Context(), in)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"access_token": access, "refresh_token": refresh})
}

// RefreshInput
type RefreshInput struct {
    RefreshToken string `json:"refresh_token" binding:"required"`
}

// RefreshHandler
func RefreshHandler(c *gin.Context, us *service.UserService) {
    var in RefreshInput
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request", "details": err.Error()})
        return
    }
    newAccess, err := us.RefreshAccess(c.Request.Context(), in.RefreshToken)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"access_token": newAccess})
}
