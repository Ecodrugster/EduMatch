package delivery

import (
	"net/http"
	"strconv"

	"edumatch/internal/domain"
	"edumatch/internal/service"
	"github.com/gin-gonic/gin"
)

type SmartMatchingHandler struct {
	svc *service.SmartMatchingService
}

func NewSmartMatchingHandler(svc *service.SmartMatchingService) *SmartMatchingHandler {
	return &SmartMatchingHandler{svc: svc}
}

// GET /api/skills
func (h *SmartMatchingHandler) ListSkills(c *gin.Context) {
	skills, err := h.svc.ListSkills(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"skills": skills})
}

// POST /api/projects
func (h *SmartMatchingHandler) CreateProject(c *gin.Context) {
	var in domain.CreateProjectInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ownerID := in.OwnerID
	if ownerID == 0 {
		if uidVal, exists := c.Get("userID"); exists {
			if uidStr, ok := uidVal.(string); ok {
				ownerID, _ = strconv.ParseInt(uidStr, 10, 64)
			}
		}
	}
	if ownerID == 0 {
		ownerID = 1 // default author if not provided in open testing
	}

	project := &domain.Project{
		OwnerID:        ownerID,
		Title:          in.Title,
		Description:    in.Description,
		SkillsRequired: in.SkillsRequired,
		Deadline:       in.Deadline,
	}

	projectID, err := h.svc.CreateProjectWithRoles(c.Request.Context(), project, in.Roles)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Проект успешно создан",
		"project_id": projectID,
	})
}

// GET /api/projects/:id/roles
func (h *SmartMatchingHandler) GetProjectRoles(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	roles, err := h.svc.GetProjectRoles(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"roles": roles})
}

// GET /api/roles/:id/candidates
func (h *SmartMatchingHandler) GetRoleCandidates(c *gin.Context) {
	roleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	candidates, err := h.svc.GetRoleCandidates(c.Request.Context(), roleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"role_id":    roleID,
		"candidates": candidates,
		"count":      len(candidates),
	})
}

// GET /api/projects/:id/team-variants
func (h *SmartMatchingHandler) GetTeamVariants(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	variants, errMsg, err := h.svc.BuildTeamVariants(c.Request.Context(), projectID, 4, 3)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if errMsg != "" {
		c.JSON(http.StatusOK, gin.H{
			"error":    errMsg,
			"variants": []domain.TeamVariant{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"error":    nil,
		"variants": variants,
	})
}

// POST /api/roles/:id/invites
func (h *SmartMatchingHandler) CreateInvite(c *gin.Context) {
	roleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var in domain.InviteInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := in.UserID
	if userID == 0 {
		if uidVal, exists := c.Get("userID"); exists {
			if uidStr, ok := uidVal.(string); ok {
				userID, _ = strconv.ParseInt(uidStr, 10, 64)
			}
		}
	}
	if userID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID required"})
		return
	}

	direction := in.Direction
	if direction == "" {
		direction = "invite"
	}

	inv := &domain.Invite{
		RoleID:    roleID,
		UserID:    userID,
		Direction: direction,
	}

	if err := h.svc.CreateInvite(c.Request.Context(), inv); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Приглашение успешно отправлено",
		"invite":  inv,
	})
}

// POST /api/invites/:id/accept
func (h *SmartMatchingHandler) AcceptInvite(c *gin.Context) {
	inviteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invite ID"})
		return
	}

	if err := h.svc.AcceptInvite(c.Request.Context(), inviteID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Приглашение принято. Участник добавлен в команду проекта!",
	})
}

// GET /api/roles/:id/invites
func (h *SmartMatchingHandler) ListInvitesByRole(c *gin.Context) {
	roleID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	invites, err := h.svc.ListInvitesByRole(c.Request.Context(), roleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invites": invites})
}

// GET /api/invites/my
func (h *SmartMatchingHandler) ListMyInvites(c *gin.Context) {
	var userID int64
	if uidVal, exists := c.Get("userID"); exists {
		if uidStr, ok := uidVal.(string); ok {
			userID, _ = strconv.ParseInt(uidStr, 10, 64)
		}
	}
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	invites, err := h.svc.ListInvitesByUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invites": invites})
}

// GET /api/projects/:id/team
func (h *SmartMatchingHandler) GetTeamMembers(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	members, err := h.svc.GetTeamMembers(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"members": members})
}

// POST /api/projects/:id/complete
func (h *SmartMatchingHandler) CompleteProject(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.svc.CompleteProject(c.Request.Context(), projectID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Проект успешно завершён. Доступен этап взаимной оценки (Peer Review)!",
	})
}

// POST /api/projects/:id/peer-reviews
func (h *SmartMatchingHandler) CreatePeerReview(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var in domain.PeerReviewInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var authorID int64
	if uidVal, exists := c.Get("userID"); exists {
		if uidStr, ok := uidVal.(string); ok {
			authorID, _ = strconv.ParseInt(uidStr, 10, 64)
		}
	}
	if authorID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	review := &domain.PeerReview{
		ProjectID:     projectID,
		AuthorID:      authorID,
		TargetID:      in.TargetID,
		Contribution:  in.Contribution,
		Deadlines:     in.Deadlines,
		Communication: in.Communication,
		Quality:       in.Quality,
		Comment:       in.Comment,
	}

	if err := h.svc.CreatePeerReview(c.Request.Context(), review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Оценка успешно сохранена!",
		"review":  review,
	})
}

// GET /api/projects/:id/peer-reviews
func (h *SmartMatchingHandler) ListPeerReviews(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	reviews, err := h.svc.ListPeerReviewsByProject(c.Request.Context(), projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// GET /api/users/:id/profile
func (h *SmartMatchingHandler) GetUserProfile(c *gin.Context) {
	userID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	profile, err := h.svc.GetUserProfileDetail(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile": profile})
}

