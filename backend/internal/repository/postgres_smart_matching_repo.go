package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"edumatch/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SmartMatchingRepo interface {
	ListSkills(ctx context.Context) ([]domain.Skill, error)
	CreateProjectWithRoles(ctx context.Context, p *domain.Project, roles []domain.RoleInput) (int64, error)
	GetProjectRoles(ctx context.Context, projectID int64) ([]domain.ProjectRole, error)
	GetRoleByID(ctx context.Context, roleID int64) (*domain.ProjectRole, error)
	GetRoleRequirements(ctx context.Context, roleID int64) ([]domain.RoleRequirement, error)
	GetAllCandidateUsers(ctx context.Context) ([]*domain.User, map[int64]int, map[int64][]domain.UserSkill, map[int64]int, error)
	CreateInvite(ctx context.Context, inv *domain.Invite) error
	GetInviteByID(ctx context.Context, id int64) (*domain.Invite, error)
	ListInvitesByRole(ctx context.Context, roleID int64) ([]domain.Invite, error)
	ListInvitesByUser(ctx context.Context, userID int64) ([]domain.Invite, error)
	AcceptInvite(ctx context.Context, inviteID int64) error
	GetTeamMembers(ctx context.Context, projectID int64) ([]domain.TeamMember, error)
	CompleteProject(ctx context.Context, projectID int64) error
	CreatePeerReview(ctx context.Context, review *domain.PeerReview) error
	ListPeerReviewsByProject(ctx context.Context, projectID int64) ([]domain.PeerReview, error)
	RecalculatePeerReviews(ctx context.Context, projectID int64) error
	GetUserProfileDetail(ctx context.Context, userID int64) (*domain.UserProfileDetail, error)
}

type PostgresSmartMatchingRepo struct {
	pool *pgxpool.Pool
}

func NewPostgresSmartMatchingRepo(pool *pgxpool.Pool) *PostgresSmartMatchingRepo {
	return &PostgresSmartMatchingRepo{pool: pool}
}

func (r *PostgresSmartMatchingRepo) ListSkills(ctx context.Context) ([]domain.Skill, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, category FROM skills ORDER BY category, name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []domain.Skill
	for rows.Next() {
		var s domain.Skill
		if err := rows.Scan(&s.ID, &s.Name, &s.Category); err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	return skills, nil
}

func (r *PostgresSmartMatchingRepo) CreateProjectWithRoles(ctx context.Context, p *domain.Project, roles []domain.RoleInput) (int64, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	now := time.Now().UTC()
	var projectID int64
	err = tx.QueryRow(ctx, `
		INSERT INTO projects (owner_id, title, description, skills_required, status, deadline, is_open, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'open', $5, true, $6, $7)
		RETURNING id
	`, p.OwnerID, p.Title, p.Description, p.SkillsRequired, p.Deadline, now, now).Scan(&projectID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert project: %w", err)
	}

	for _, roleInput := range roles {
		var roleID int64
		err = tx.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, $2, $3)
			RETURNING id
		`, projectID, roleInput.Title, roleInput.HoursPerWeek).Scan(&roleID)
		if err != nil {
			return 0, fmt.Errorf("failed to insert role %s: %w", roleInput.Title, err)
		}

		for _, req := range roleInput.Requirements {
			_, err = tx.Exec(ctx, `
				INSERT INTO role_requirements (role_id, skill_id, min_level, weight)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (role_id, skill_id) DO NOTHING
			`, roleID, req.SkillID, req.MinLevel, req.Weight)
			if err != nil {
				return 0, fmt.Errorf("failed to insert req for role %d: %w", roleID, err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return projectID, nil
}

func (r *PostgresSmartMatchingRepo) GetProjectRoles(ctx context.Context, projectID int64) ([]domain.ProjectRole, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, project_id, title, hours_per_week
		FROM project_roles
		WHERE project_id = $1
		ORDER BY id
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var roles []domain.ProjectRole
	for rows.Next() {
		var pr domain.ProjectRole
		if err := rows.Scan(&pr.ID, &pr.ProjectID, &pr.Title, &pr.HoursPerWeek); err != nil {
			return nil, err
		}
		roles = append(roles, pr)
	}

	for i := range roles {
		reqs, err := r.GetRoleRequirements(ctx, roles[i].ID)
		if err == nil {
			roles[i].Requirements = reqs
		}

		// Check if assigned in team_members
		var tm domain.TeamMember
		err = r.pool.QueryRow(ctx, `
			SELECT tm.id, tm.project_id, tm.role_id, tm.user_id, u.username, u.email, u.avatar_url, tm.joined_at
			FROM team_members tm
			JOIN users u ON tm.user_id = u.id
			WHERE tm.role_id = $1
		`, roles[i].ID).Scan(&tm.ID, &tm.ProjectID, &tm.RoleID, &tm.UserID, &tm.Username, &tm.Email, &tm.AvatarURL, &tm.JoinedAt)
		if err == nil {
			roles[i].AssignedUser = &tm
		}
	}

	return roles, nil
}

func (r *PostgresSmartMatchingRepo) GetRoleByID(ctx context.Context, roleID int64) (*domain.ProjectRole, error) {
	var pr domain.ProjectRole
	err := r.pool.QueryRow(ctx, `
		SELECT id, project_id, title, hours_per_week
		FROM project_roles
		WHERE id = $1
	`, roleID).Scan(&pr.ID, &pr.ProjectID, &pr.Title, &pr.HoursPerWeek)
	if err != nil {
		return nil, err
	}

	reqs, err := r.GetRoleRequirements(ctx, pr.ID)
	if err == nil {
		pr.Requirements = reqs
	}
	return &pr, nil
}

func (r *PostgresSmartMatchingRepo) GetRoleRequirements(ctx context.Context, roleID int64) ([]domain.RoleRequirement, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT rr.id, rr.role_id, rr.skill_id, s.name, rr.min_level, rr.weight
		FROM role_requirements rr
		JOIN skills s ON rr.skill_id = s.id
		WHERE rr.role_id = $1
		ORDER BY rr.weight DESC, rr.min_level DESC
	`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reqs []domain.RoleRequirement
	for rows.Next() {
		var rr domain.RoleRequirement
		if err := rows.Scan(&rr.ID, &rr.RoleID, &rr.SkillID, &rr.SkillName, &rr.MinLevel, &rr.Weight); err != nil {
			return nil, err
		}
		reqs = append(reqs, rr)
	}
	return reqs, nil
}

func (r *PostgresSmartMatchingRepo) GetAllCandidateUsers(ctx context.Context) ([]*domain.User, map[int64]int, map[int64][]domain.UserSkill, map[int64]int, error) {
	// 1. Users
	userRows, err := r.pool.Query(ctx, `
		SELECT id, username, email, bio, avatar_url, avg_peer_score, created_at, updated_at
		FROM users
		WHERE deleted_at IS NULL
	`)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	defer userRows.Close()

	var users []*domain.User
	for userRows.Next() {
		var u domain.User
		if err := userRows.Scan(&u.ID, &u.Username, &u.Email, &u.Bio, &u.AvatarURL, &u.AvgPeerScore, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, nil, nil, nil, err
		}
		users = append(users, &u)
	}

	// 2. Availability
	availMap := make(map[int64]int)
	availRows, err := r.pool.Query(ctx, `SELECT user_id, hours_per_week FROM user_availability`)
	if err == nil {
		defer availRows.Close()
		for availRows.Next() {
			var uid int64
			var hours int
			if err := availRows.Scan(&uid, &hours); err == nil {
				availMap[uid] = hours
			}
		}
	}

	// 3. User skills
	skillsMap := make(map[int64][]domain.UserSkill)
	usRows, err := r.pool.Query(ctx, `
		SELECT us.id, us.user_id, us.skill_id, s.name, s.category, us.level, us.evidence_type, COALESCE(us.evidence_url, ''), us.verified
		FROM user_skills us
		JOIN skills s ON us.skill_id = s.id
	`)
	if err == nil {
		defer usRows.Close()
		for usRows.Next() {
			var us domain.UserSkill
			if err := usRows.Scan(&us.ID, &us.UserID, &us.SkillID, &us.SkillName, &us.Category, &us.Level, &us.EvidenceType, &us.EvidenceURL, &us.Verified); err == nil {
				skillsMap[us.UserID] = append(skillsMap[us.UserID], us)
			}
		}
	}

	// 4. Active projects count
	activeCountMap := make(map[int64]int)
	actRows, err := r.pool.Query(ctx, `
		SELECT tm.user_id, COUNT(DISTINCT tm.project_id)
		FROM team_members tm
		JOIN projects p ON tm.project_id = p.id
		WHERE p.status != 'completed' AND p.is_open = true
		GROUP BY tm.user_id
	`)
	if err == nil {
		defer actRows.Close()
		for actRows.Next() {
			var uid int64
			var count int
			if err := actRows.Scan(&uid, &count); err == nil {
				activeCountMap[uid] = count
			}
		}
	}

	return users, availMap, skillsMap, activeCountMap, nil
}

func (r *PostgresSmartMatchingRepo) CreateInvite(ctx context.Context, inv *domain.Invite) error {
	now := time.Now().UTC()
	return r.pool.QueryRow(ctx, `
		INSERT INTO invites (role_id, user_id, direction, status, created_at)
		VALUES ($1, $2, $3, 'pending', $4)
		RETURNING id, created_at
	`, inv.RoleID, inv.UserID, inv.Direction, now).Scan(&inv.ID, &inv.CreatedAt)
}

func (r *PostgresSmartMatchingRepo) GetInviteByID(ctx context.Context, id int64) (*domain.Invite, error) {
	var inv domain.Invite
	err := r.pool.QueryRow(ctx, `
		SELECT i.id, i.role_id, pr.title, pr.project_id, p.title, i.user_id, u.username, u.avatar_url, i.direction, i.status, i.created_at
		FROM invites i
		JOIN project_roles pr ON i.role_id = pr.id
		JOIN projects p ON pr.project_id = p.id
		JOIN users u ON i.user_id = u.id
		WHERE i.id = $1
	`, id).Scan(&inv.ID, &inv.RoleID, &inv.RoleTitle, &inv.ProjectID, &inv.ProjectTitle, &inv.UserID, &inv.Username, &inv.AvatarURL, &inv.Direction, &inv.Status, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (r *PostgresSmartMatchingRepo) ListInvitesByRole(ctx context.Context, roleID int64) ([]domain.Invite, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT i.id, i.role_id, pr.title, pr.project_id, p.title, i.user_id, u.username, u.avatar_url, i.direction, i.status, i.created_at
		FROM invites i
		JOIN project_roles pr ON i.role_id = pr.id
		JOIN projects p ON pr.project_id = p.id
		JOIN users u ON i.user_id = u.id
		WHERE i.role_id = $1
		ORDER BY i.created_at DESC
	`, roleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invites []domain.Invite
	for rows.Next() {
		var inv domain.Invite
		if err := rows.Scan(&inv.ID, &inv.RoleID, &inv.RoleTitle, &inv.ProjectID, &inv.ProjectTitle, &inv.UserID, &inv.Username, &inv.AvatarURL, &inv.Direction, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invites = append(invites, inv)
	}
	return invites, nil
}

func (r *PostgresSmartMatchingRepo) ListInvitesByUser(ctx context.Context, userID int64) ([]domain.Invite, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT i.id, i.role_id, pr.title, pr.project_id, p.title, i.user_id, u.username, u.avatar_url, i.direction, i.status, i.created_at
		FROM invites i
		JOIN project_roles pr ON i.role_id = pr.id
		JOIN projects p ON pr.project_id = p.id
		JOIN users u ON i.user_id = u.id
		WHERE i.user_id = $1
		ORDER BY i.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invites []domain.Invite
	for rows.Next() {
		var inv domain.Invite
		if err := rows.Scan(&inv.ID, &inv.RoleID, &inv.RoleTitle, &inv.ProjectID, &inv.ProjectTitle, &inv.UserID, &inv.Username, &inv.AvatarURL, &inv.Direction, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invites = append(invites, inv)
	}
	return invites, nil
}

func (r *PostgresSmartMatchingRepo) AcceptInvite(ctx context.Context, inviteID int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var roleID, userID int64
	var status string
	err = tx.QueryRow(ctx, `SELECT role_id, user_id, status FROM invites WHERE id = $1`, inviteID).Scan(&roleID, &userID, &status)
	if err != nil {
		return errors.New("invite not found")
	}
	if status != "pending" {
		return fmt.Errorf("invite is already %s", status)
	}

	var projectID int64
	err = tx.QueryRow(ctx, `SELECT project_id FROM project_roles WHERE id = $1`, roleID).Scan(&projectID)
	if err != nil {
		return errors.New("associated role not found")
	}

	now := time.Now().UTC()
	// Insert into team_members
	_, err = tx.Exec(ctx, `
		INSERT INTO team_members (project_id, role_id, user_id, joined_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (project_id, role_id) DO UPDATE SET user_id = EXCLUDED.user_id, joined_at = EXCLUDED.joined_at
	`, projectID, roleID, userID, now)
	if err != nil {
		return fmt.Errorf("failed to add to team_members: %w", err)
	}

	// Also sync into legacy members table for chat compatibility
	_, _ = tx.Exec(ctx, `
		INSERT INTO members (project_id, user_id, joined_at)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING
	`, projectID, userID, now)

	// Update this invite status to accepted
	_, err = tx.Exec(ctx, `UPDATE invites SET status = 'accepted' WHERE id = $1`, inviteID)
	if err != nil {
		return err
	}

	// Close other pending invites for this role
	_, err = tx.Exec(ctx, `UPDATE invites SET status = 'canceled' WHERE role_id = $1 AND id <> $2 AND status = 'pending'`, roleID, inviteID)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *PostgresSmartMatchingRepo) GetTeamMembers(ctx context.Context, projectID int64) ([]domain.TeamMember, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT tm.id, tm.project_id, tm.role_id, pr.title, tm.user_id, u.username, u.email, u.avatar_url, tm.joined_at
		FROM team_members tm
		JOIN project_roles pr ON tm.role_id = pr.id
		JOIN users u ON tm.user_id = u.id
		WHERE tm.project_id = $1
		ORDER BY tm.joined_at ASC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []domain.TeamMember
	for rows.Next() {
		var tm domain.TeamMember
		if err := rows.Scan(&tm.ID, &tm.ProjectID, &tm.RoleID, &tm.RoleTitle, &tm.UserID, &tm.Username, &tm.Email, &tm.AvatarURL, &tm.JoinedAt); err != nil {
			return nil, err
		}
		members = append(members, tm)
	}
	return members, nil
}

func (r *PostgresSmartMatchingRepo) CompleteProject(ctx context.Context, projectID int64) error {
	now := time.Now().UTC()
	cmd, err := r.pool.Exec(ctx, `
		UPDATE projects
		SET status = 'completed', is_open = false, updated_at = $1
		WHERE id = $2
	`, now, projectID)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return errors.New("project not found")
	}
	return nil
}

func (r *PostgresSmartMatchingRepo) CreatePeerReview(ctx context.Context, review *domain.PeerReview) error {
	if review.AuthorID == review.TargetID {
		return errors.New("нельзя оценивать самого себя")
	}

	// Verify both users are members of the project team
	var count int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*)
		FROM team_members
		WHERE project_id = $1 AND user_id IN ($2, $3)
	`, review.ProjectID, review.AuthorID, review.TargetID).Scan(&count)
	if err != nil || count < 2 {
		return errors.New("оценивать можно только участников своей команды проекта")
	}

	now := time.Now().UTC()
	err = r.pool.QueryRow(ctx, `
		INSERT INTO peer_reviews (project_id, author_id, target_id, contribution, deadlines, communication, quality, comment, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at
	`, review.ProjectID, review.AuthorID, review.TargetID, review.Contribution, review.Deadlines, review.Communication, review.Quality, review.Comment, now).Scan(&review.ID, &review.CreatedAt)
	if err != nil {
		return fmt.Errorf("ошибка сохранения отзыва (возможно, отзыв уже оставлен): %w", err)
	}

	// Recalculate peer ratings and verified skills
	_ = r.RecalculatePeerReviews(ctx, review.ProjectID)
	return nil
}

func (r *PostgresSmartMatchingRepo) ListPeerReviewsByProject(ctx context.Context, projectID int64) ([]domain.PeerReview, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pr.id, pr.project_id, pr.author_id, u1.username, pr.target_id, u2.username, pr.contribution, pr.deadlines, pr.communication, pr.quality, COALESCE(pr.comment, ''), pr.created_at
		FROM peer_reviews pr
		JOIN users u1 ON pr.author_id = u1.id
		JOIN users u2 ON pr.target_id = u2.id
		WHERE pr.project_id = $1
		ORDER BY pr.created_at DESC
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []domain.PeerReview
	for rows.Next() {
		var pv domain.PeerReview
		if err := rows.Scan(&pv.ID, &pv.ProjectID, &pv.AuthorID, &pv.AuthorName, &pv.TargetID, &pv.TargetName, &pv.Contribution, &pv.Deadlines, &pv.Communication, &pv.Quality, &pv.Comment, &pv.CreatedAt); err != nil {
			return nil, err
		}
		reviews = append(reviews, pv)
	}
	return reviews, nil
}

func (r *PostgresSmartMatchingRepo) RecalculatePeerReviews(ctx context.Context, projectID int64) error {
	// 1. Recalculate avg_peer_score for all users who received reviews
	_, err := r.pool.Exec(ctx, `
		UPDATE users u
		SET avg_peer_score = sub.avg_score
		FROM (
			SELECT target_id, ROUND(AVG((contribution + deadlines + communication + quality) / 4.0), 2) as avg_score
			FROM peer_reviews
			GROUP BY target_id
		) sub
		WHERE u.id = sub.target_id
	`)
	if err != nil {
		return err
	}

	// 2. Check each target user's average quality in this project
	type qualityStat struct {
		TargetID   int64
		AvgQuality float64
		RoleID     int64
	}

	rows, err := r.pool.Query(ctx, `
		SELECT pv.target_id, AVG(pv.quality) as avg_quality, tm.role_id
		FROM peer_reviews pv
		JOIN team_members tm ON pv.project_id = tm.project_id AND pv.target_id = tm.user_id
		WHERE pv.project_id = $1
		GROUP BY pv.target_id, tm.role_id
	`, projectID)
	if err != nil {
		return err
	}
	defer rows.Close()

	var stats []qualityStat
	for rows.Next() {
		var qs qualityStat
		if err := rows.Scan(&qs.TargetID, &qs.AvgQuality, &qs.RoleID); err == nil {
			stats = append(stats, qs)
		}
	}

	// If avgQuality >= 4.0, verify and level-up skills required by their role
	for _, st := range stats {
		if st.AvgQuality < 4.0 {
			continue
		}

		reqs, err := r.GetRoleRequirements(ctx, st.RoleID)
		if err != nil {
			continue
		}

		for _, req := range reqs {
			// Check existing user skill
			var currentLevel int
			err := r.pool.QueryRow(ctx, `
				SELECT level FROM user_skills WHERE user_id = $1 AND skill_id = $2
			`, st.TargetID, req.SkillID).Scan(&currentLevel)

			if err == pgx.ErrNoRows {
				// Skill was not present -> add verified with level 1 or min_level
				newLevel := 1
				if req.MinLevel > 1 {
					newLevel = req.MinLevel
				}
				_, _ = r.pool.Exec(ctx, `
					INSERT INTO user_skills (user_id, skill_id, level, verified, evidence_type)
					VALUES ($1, $2, $3, true, 'peer_review')
				`, st.TargetID, req.SkillID, newLevel)
			} else if err == nil {
				// Skill was present: if role req is higher than current, increase by 1 (up to min_level)
				newLevel := currentLevel
				if req.MinLevel > currentLevel {
					newLevel = currentLevel + 1
				}
				_, _ = r.pool.Exec(ctx, `
					UPDATE user_skills
					SET level = $1, verified = true, evidence_type = 'peer_review'
					WHERE user_id = $2 AND skill_id = $3
				`, newLevel, st.TargetID, req.SkillID)
			}
		}
	}

	return nil
}

func (r *PostgresSmartMatchingRepo) GetUserProfileDetail(ctx context.Context, userID int64) (*domain.UserProfileDetail, error) {
	var detail domain.UserProfileDetail

	// User
	err := r.pool.QueryRow(ctx, `
		SELECT id, username, email, bio, avatar_url, avg_peer_score, created_at, updated_at
		FROM users
		WHERE id = $1
	`, userID).Scan(&detail.User.ID, &detail.User.Username, &detail.User.Email, &detail.User.Bio, &detail.User.AvatarURL, &detail.User.AvgPeerScore, &detail.User.CreatedAt, &detail.User.UpdatedAt)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// Availability
	var hours int
	err = r.pool.QueryRow(ctx, `SELECT hours_per_week FROM user_availability WHERE user_id = $1`, userID).Scan(&hours)
	if err == nil {
		detail.HoursPerWeek = hours
	} else {
		detail.HoursPerWeek = 20
	}

	// Skills
	rows, err := r.pool.Query(ctx, `
		SELECT us.id, us.user_id, us.skill_id, s.name, s.category, us.level, us.evidence_type, COALESCE(us.evidence_url, ''), us.verified
		FROM user_skills us
		JOIN skills s ON us.skill_id = s.id
		WHERE us.user_id = $1
		ORDER BY us.verified DESC, us.level DESC
	`, userID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var us domain.UserSkill
			if err := rows.Scan(&us.ID, &us.UserID, &us.SkillID, &us.SkillName, &us.Category, &us.Level, &us.EvidenceType, &us.EvidenceURL, &us.Verified); err == nil {
				detail.Skills = append(detail.Skills, us)
			}
		}
	}

	// Track record
	trRows, err := r.pool.Query(ctx, `
		SELECT tm.project_id, p.title as project_title, pr.title as role_title,
		       COALESCE(AVG(pv.quality), 0) as avg_quality,
		       COALESCE(AVG((pv.contribution + pv.deadlines + pv.communication + pv.quality) / 4.0), 0) as avg_overall,
		       COUNT(pv.id) as review_count
		FROM team_members tm
		JOIN projects p ON tm.project_id = p.id
		JOIN project_roles pr ON tm.role_id = pr.id
		LEFT JOIN peer_reviews pv ON pv.project_id = p.id AND pv.target_id = tm.user_id
		WHERE tm.user_id = $1 AND p.status = 'completed'
		GROUP BY tm.project_id, p.title, pr.title
		ORDER BY tm.project_id DESC
	`, userID)
	if err == nil {
		defer trRows.Close()
		for trRows.Next() {
			var tr domain.ProjectTrackRecord
			if err := trRows.Scan(&tr.ProjectID, &tr.ProjectTitle, &tr.RoleTitle, &tr.AvgQuality, &tr.AvgOverall, &tr.ReviewCount); err == nil {
				detail.TrackRecord = append(detail.TrackRecord, tr)
			}
		}
	}

	return &detail, nil
}

