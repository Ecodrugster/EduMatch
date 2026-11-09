package service

import (
	"context"
	"fmt"
	"math"
	"sort"

	"edumatch/internal/domain"
	"edumatch/internal/repository"
)

const (
	WeightSkills     = 0.6
	WeightTime       = 0.2
	WeightReliabilty = 0.2

	UnverifiedFactor = 0.6
	NewbieReliabilty = 0.6
)

type SmartMatchingService struct {
	repo repository.SmartMatchingRepo
}

func NewSmartMatchingService(repo repository.SmartMatchingRepo) *SmartMatchingService {
	return &SmartMatchingService{repo: repo}
}

// ScoreCandidate calculates matching score, parts and detailed explanation reasons
func (s *SmartMatchingService) ScoreCandidate(role *domain.ProjectRole, user *domain.User, hoursPerWeek int, userSkills []domain.UserSkill, activeProjects int) domain.Candidate {
	var reasons []string
	var weighted float64
	var totalWeight float64

	// Skills map for quick lookup
	usMap := make(map[int64]domain.UserSkill)
	for _, us := range userSkills {
		usMap[us.SkillID] = us
	}

	for _, req := range role.Requirements {
		totalWeight += float64(req.Weight)
		us, exists := usMap[req.SkillID]
		if !exists {
			reasons = append(reasons, fmt.Sprintf("− нет навыка %s", req.SkillName))
			continue
		}

		levelFit := math.Min(float64(us.Level)/float64(req.MinLevel), 1.0)
		factor := UnverifiedFactor
		if us.Verified {
			factor = 1.0
		}
		weighted += float64(req.Weight) * levelFit * factor

		if levelFit >= 1.0 && us.Verified {
			reasons = append(reasons, fmt.Sprintf("+ %s %d/5, подтверждён", req.SkillName, us.Level))
		} else if levelFit >= 1.0 {
			reasons = append(reasons, fmt.Sprintf("~ %s %d/5, не подтверждён", req.SkillName, us.Level))
		} else {
			reasons = append(reasons, fmt.Sprintf("− %s: %d из нужных %d", req.SkillName, us.Level, req.MinLevel))
		}
	}

	sSkills := 0.0
	if totalWeight > 0 {
		sSkills = weighted / totalWeight
	}

	roleHours := float64(role.HoursPerWeek)
	if roleHours <= 0 {
		roleHours = 1
	}
	sTime := math.Min(float64(hoursPerWeek)/roleHours, 1.0)
	if sTime < 1.0 {
		reasons = append(reasons, fmt.Sprintf("− готов %d ч/нед из %d", hoursPerWeek, role.HoursPerWeek))
	}

	sRel := NewbieReliabilty
	if user.AvgPeerScore != nil && *user.AvgPeerScore > 0 {
		sRel = *user.AvgPeerScore / 5.0
		reasons = append(reasons, fmt.Sprintf("+ надёжность %.1f/5", *user.AvgPeerScore))
	} else {
		reasons = append(reasons, "~ пока нет отзывов")
	}

	finalScore := WeightSkills*sSkills + WeightTime*sTime + WeightReliabilty*sRel
	roundedScore := int(math.Round(finalScore * 100))
	eligible := roundedScore >= 40 && activeProjects < 2

	return domain.Candidate{
		UserID:       user.ID,
		Username:     user.Username,
		Email:        user.Email,
		AvatarURL:    user.AvatarURL,
		Bio:          user.Bio,
		Score:        roundedScore,
		Parts:        domain.ScoreParts{SSkills: sSkills, STime: sTime, SRel: sRel},
		Reasons:      reasons,
		HoursPerWeek: hoursPerWeek,
		AvgPeerScore: user.AvgPeerScore,
		Skills:       userSkills,
		Eligible:     eligible,
	}
}

// GetRoleCandidates returns ranked candidates for a specific role
func (s *SmartMatchingService) GetRoleCandidates(ctx context.Context, roleID int64) ([]domain.Candidate, error) {
	role, err := s.repo.GetRoleByID(ctx, roleID)
	if err != nil {
		return nil, fmt.Errorf("role not found: %w", err)
	}

	users, availMap, skillsMap, activeProjectsMap, err := s.repo.GetAllCandidateUsers(ctx)
	if err != nil {
		return nil, err
	}

	// Exclude existing members of this project
	members, err := s.repo.GetTeamMembers(ctx, role.ProjectID)
	excludeUsers := make(map[int64]bool)
	if err == nil {
		for _, m := range members {
			excludeUsers[m.UserID] = true
		}
	}

	var candidates []domain.Candidate
	for _, u := range users {
		if excludeUsers[u.ID] {
			continue
		}

		hours := availMap[u.ID]
		if hours <= 0 {
			hours = 20
		}
		uSkills := skillsMap[u.ID]
		activeCount := activeProjectsMap[u.ID]

		cand := s.ScoreCandidate(role, u, hours, uSkills, activeCount)
		// Cut off score < 40 and active projects >= 2
		if cand.Eligible {
			candidates = append(candidates, cand)
		}
	}

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score > candidates[j].Score
	})

	return candidates, nil
}

// BuildTeamVariants builds up to 3 best team combinations
func (s *SmartMatchingService) BuildTeamVariants(ctx context.Context, projectID int64, topN int, variantsCount int) ([]domain.TeamVariant, string, error) {
	roles, err := s.repo.GetProjectRoles(ctx, projectID)
	if err != nil {
		return nil, "", err
	}
	if len(roles) == 0 {
		return nil, "В проекте нет настроенных ролей", nil
	}

	type rolePool struct {
		RoleID     int64
		RoleTitle  string
		Candidates []domain.Candidate
	}

	var pools []rolePool
	for _, r := range roles {
		// If role is already assigned to a team member, candidate pool is just that member with score 100
		if r.AssignedUser != nil {
			pools = append(pools, rolePool{
				RoleID:    r.ID,
				RoleTitle: r.Title,
				Candidates: []domain.Candidate{
					{
						UserID:    r.AssignedUser.UserID,
						Username:  r.AssignedUser.Username,
						AvatarURL: r.AssignedUser.AvatarURL,
						Score:     100,
						Reasons:   []string{"✓ Уже утверждён в составе команды"},
					},
				},
			})
			continue
		}

		cands, err := s.GetRoleCandidates(ctx, r.ID)
		if err != nil {
			return nil, "", err
		}
		if len(cands) == 0 {
			// Clear message about unclosed role
			return nil, fmt.Sprintf("Роль «%s» не закрыта", r.Title), nil
		}

		if len(cands) > topN {
			cands = cands[:topN]
		}

		pools = append(pools, rolePool{
			RoleID:     r.ID,
			RoleTitle:  r.Title,
			Candidates: cands,
		})
	}

	var combinations []domain.TeamVariant
	var walk func(i int, picked []domain.TeamMemberCandidate, used map[int64]bool)

	walk = func(i int, picked []domain.TeamMemberCandidate, used map[int64]bool) {
		if i == len(pools) {
			var sum int
			minScore := 101
			for _, p := range picked {
				sum += p.Score
				if p.Score < minScore {
					minScore = p.Score
				}
			}
			avg := float64(sum) / float64(len(picked))
			teamScore := int(math.Round(0.7*avg + 0.3*float64(minScore)))

			membersCopy := make([]domain.TeamMemberCandidate, len(picked))
			copy(membersCopy, picked)

			combinations = append(combinations, domain.TeamVariant{
				TeamScore: teamScore,
				AvgScore:  int(math.Round(avg)),
				MinScore:  minScore,
				Members:   membersCopy,
			})
			return
		}

		for _, c := range pools[i].Candidates {
			if used[c.UserID] {
				continue
			}
			used[c.UserID] = true
			picked = append(picked, domain.TeamMemberCandidate{
				RoleID:    pools[i].RoleID,
				RoleTitle: pools[i].RoleTitle,
				UserID:    c.UserID,
				Username:  c.Username,
				AvatarURL: c.AvatarURL,
				Score:     c.Score,
				Parts:     c.Parts,
				Reasons:   c.Reasons,
			})

			walk(i+1, picked, used)

			picked = picked[:len(picked)-1]
			delete(used, c.UserID)
		}
	}

	walk(0, []domain.TeamMemberCandidate{}, make(map[int64]bool))

	if len(combinations) == 0 {
		return nil, "Не удалось сформировать варианты команды без повторяющихся участников", nil
	}

	sort.Slice(combinations, func(i, j int) bool {
		return combinations[i].TeamScore > combinations[j].TeamScore
	})

	if len(combinations) > variantsCount {
		combinations = combinations[:variantsCount]
	}

	return combinations, "", nil
}

func (s *SmartMatchingService) ListSkills(ctx context.Context) ([]domain.Skill, error) {
	return s.repo.ListSkills(ctx)
}

func (s *SmartMatchingService) CreateProjectWithRoles(ctx context.Context, p *domain.Project, roles []domain.RoleInput) (int64, error) {
	return s.repo.CreateProjectWithRoles(ctx, p, roles)
}

func (s *SmartMatchingService) GetProjectRoles(ctx context.Context, projectID int64) ([]domain.ProjectRole, error) {
	return s.repo.GetProjectRoles(ctx, projectID)
}

func (s *SmartMatchingService) CreateInvite(ctx context.Context, inv *domain.Invite) error {
	return s.repo.CreateInvite(ctx, inv)
}

func (s *SmartMatchingService) AcceptInvite(ctx context.Context, inviteID int64) error {
	return s.repo.AcceptInvite(ctx, inviteID)
}

func (s *SmartMatchingService) ListInvitesByRole(ctx context.Context, roleID int64) ([]domain.Invite, error) {
	return s.repo.ListInvitesByRole(ctx, roleID)
}

func (s *SmartMatchingService) ListInvitesByUser(ctx context.Context, userID int64) ([]domain.Invite, error) {
	return s.repo.ListInvitesByUser(ctx, userID)
}

func (s *SmartMatchingService) GetTeamMembers(ctx context.Context, projectID int64) ([]domain.TeamMember, error) {
	return s.repo.GetTeamMembers(ctx, projectID)
}

func (s *SmartMatchingService) CompleteProject(ctx context.Context, projectID int64) error {
	return s.repo.CompleteProject(ctx, projectID)
}

func (s *SmartMatchingService) CreatePeerReview(ctx context.Context, review *domain.PeerReview) error {
	return s.repo.CreatePeerReview(ctx, review)
}

func (s *SmartMatchingService) ListPeerReviewsByProject(ctx context.Context, projectID int64) ([]domain.PeerReview, error) {
	return s.repo.ListPeerReviewsByProject(ctx, projectID)
}

func (s *SmartMatchingService) GetUserProfileDetail(ctx context.Context, userID int64) (*domain.UserProfileDetail, error) {
	return s.repo.GetUserProfileDetail(ctx, userID)
}

