package delivery

import (
    "log"
    "net/http"
    "strconv"
    "github.com/gin-gonic/gin"
    "edumatch/internal/domain"
    "edumatch/internal/service"
)

type TaskHandler struct {
    taskService *service.TaskService
    memberService *service.MemberService // To check permissions
}

func NewTaskHandler(ts *service.TaskService, ms *service.MemberService) *TaskHandler {
    return &TaskHandler{taskService: ts, memberService: ms}
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
    userIDStr, _ := c.Get("userID")
    userID, _ := strconv.ParseInt(userIDStr.(string), 10, 64)
    projectIDStr := c.Param("id")
    projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
        return
    }

    // Optional: check if user is member of project
    isMember, err := h.memberService.IsMember(c.Request.Context(), projectID, userID)
    if err != nil {
        log.Printf("IsMember error: %v", err)
        c.JSON(http.StatusForbidden, gin.H{"error": "Error checking membership", "details": err.Error()})
        return
    }
    if !isMember {
        log.Printf("User %d is not a member of project %d", userID, projectID)
        c.JSON(http.StatusForbidden, gin.H{"error": "You are not a member of this project"})
        return
    }

    var input struct {
        Title       string `json:"title" binding:"required"`
        Description string `json:"description"`
        AssignedTo  *int64 `json:"assigned_to"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task := &domain.Task{
        ProjectID:   projectID,
        Title:       input.Title,
        Description: input.Description,
        Status:      "TODO",
        AssignedTo:  input.AssignedTo,
    }

    if err := h.taskService.Create(c.Request.Context(), task); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{"task": task})
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
    projectIDStr := c.Param("id")
    projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
        return
    }

    tasks, err := h.taskService.ListByProject(c.Request.Context(), projectID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
        return
    }
    if tasks == nil {
        tasks = []*domain.Task{}
    }

    c.JSON(http.StatusOK, gin.H{"tasks": tasks})
}

func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
    taskIDStr := c.Param("taskId")
    taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
        return
    }

    var input struct {
        Status string `json:"status" binding:"required"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Update status
    if err := h.taskService.UpdateStatus(c.Request.Context(), taskID, input.Status); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task status"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Task status updated"})
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
    taskIDStr := c.Param("taskId")
    taskID, err := strconv.ParseInt(taskIDStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
        return
    }

    if err := h.taskService.Delete(c.Request.Context(), taskID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
