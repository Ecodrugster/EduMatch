package delivery

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

// AddMemberHandler
func AddMemberHandler(c *gin.Context, svc *service.MemberService) {
    var in struct {
        ProjectID int64 `json:"project_id" binding:"required"`
        UserID    int64 `json:"user_id" binding:"required"`
    }
    if err := c.ShouldBindJSON(&in); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    member := &domain.Member{ProjectID: in.ProjectID, UserID: in.UserID}
    if err := svc.Add(c.Request.Context(), member); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"member": member})
}

// ListMembersHandler
func ListMembersHandler(c *gin.Context, svc *service.MemberService) {
    projectID, _ := strconv.ParseInt(c.Query("project_id"), 10, 64)
    members, err := svc.ListByProject(c.Request.Context(), projectID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"members": members})
}

// LeaveProjectHandler handles a user leaving a project.
func LeaveProjectHandler(c *gin.Context, svc *service.MemberService) {
    projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
        return
    }

    userIDStr, ok := c.Get("userID")
    if !ok {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }
    userID, err := strconv.ParseInt(userIDStr.(string), 10, 64)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID"})
        return
    }

    if err := svc.Leave(c.Request.Context(), projectID, userID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Successfully left the project"})
}
