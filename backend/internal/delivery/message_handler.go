package delivery

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

// CreateMessageHandler
func CreateMessageHandler(c *gin.Context, svc *service.MessageService) {
    var in struct {
        ProjectID int64  `json:"project_id" binding:"required"`
        SenderID  int64  `json:"sender_id" binding:"required"`
        Content   string `json:"content" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    msg := &domain.Message{ProjectID: in.ProjectID, SenderID: in.SenderID, Content: in.Content}
    if err := svc.Create(c.Request.Context(), msg); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"message": msg})
}

// ListMessagesHandler
func ListMessagesHandler(c *gin.Context, svc *service.MessageService) {
    projectID, _ := strconv.ParseInt(c.Query("project_id"), 10, 64)
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
    offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
    msgs, err := svc.ListByProject(c.Request.Context(), projectID, limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"messages": msgs})
}
