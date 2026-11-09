package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"edumatch/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type skillDef struct {
	Name     string
	Category string
}

type userDef struct {
	Username     string
	Email        string
	Bio          string
	HoursPerWeek int
	AvgPeerScore *float64
	Skills       []userSkillDef
}

type userSkillDef struct {
	SkillName    string
	Level        int
	Verified     bool
	EvidenceType string
	EvidenceURL  string
}

func main() {
	config.Load()
	cfg := config.AppConfig

	pool, err := pgxpool.New(context.Background(), cfg.PostgresDSN)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pool.Close()

	ctx := context.Background()

	fmt.Println("🌱 Seeding database for Smart Team Builder...")

	// 1. Skills
	skills := []skillDef{
		{"React", "Frontend"},
		{"TypeScript", "Frontend"},
		{"Vue.js", "Frontend"},
		{"Next.js", "Frontend"},
		{"HTML/CSS", "Frontend"},
		{"Tailwind CSS", "Frontend"},
		{"Node.js", "Backend"},
		{"Go", "Backend"},
		{"Python", "Backend"},
		{"PostgreSQL", "Backend"},
		{"Express", "Backend"},
		{"Django", "Backend"},
		{"Figma", "Design"},
		{"UI/UX", "Design"},
		{"QA Testing", "QA"},
		{"Docker", "DevOps"},
		{"Git", "Tools"},
		{"Linux", "DevOps"},
	}

	skillIDMap := make(map[string]int64)
	for _, s := range skills {
		var id int64
		err := pool.QueryRow(ctx, `
			INSERT INTO skills (name, category)
			VALUES ($1, $2)
			ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
			RETURNING id
		`, s.Name, s.Category).Scan(&id)
		if err != nil {
			log.Fatalf("failed to insert skill %s: %v", s.Name, err)
		}
		skillIDMap[s.Name] = id
	}
	fmt.Printf("✓ %d skills seeded\n", len(skills))

	// Password hash for all test accounts: "password123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("failed to hash password: %v", err)
	}

	fPtr := func(v float64) *float64 { return &v }

	// 2. 28 Students + 1 Demo Author
	students := []userDef{
		{
			Username:     "alex_author",
			Email:        "author@edumatch.ru",
			Bio:          "Создатель и тимлид образовательных и студенческих стартапов.",
			HoursPerWeek: 30,
			AvgPeerScore: fPtr(4.9),
			Skills: []userSkillDef{
				{"Go", 4, true, "github", "https://github.com/alex_author/go-service"},
				{"PostgreSQL", 4, true, "certificate", "Coursera DB Master"},
				{"React", 3, false, "none", ""},
			},
		},
		{
			Username:     "ivan_frontend_star",
			Email:        "ivan.react@edumatch.ru",
			Bio:          "Опытный фронтендер, пишу на React и TypeScript, побеждал в хакатонах.",
			HoursPerWeek: 25,
			AvgPeerScore: fPtr(4.8),
			Skills: []userSkillDef{
				{"React", 5, true, "github", "https://github.com/ivan/react-portfolio"},
				{"TypeScript", 4, true, "peer_review", ""},
				{"HTML/CSS", 5, true, "portfolio", "https://ivan.dev"},
				{"Tailwind CSS", 4, true, "github", ""},
			},
		},
		{
			Username:     "daria_unverified_pro",
			Email:        "daria.dev@edumatch.ru",
			Bio:          "Хорошо знаю React и веб-технологии, но пока не прикрепила ссылки на репозитории.",
			HoursPerWeek: 25,
			AvgPeerScore: fPtr(4.8),
			Skills: []userSkillDef{
				{"React", 5, false, "none", ""}, // Не подтверждён - для сравнения со звездой Иваном!
				{"TypeScript", 4, false, "none", ""},
				{"HTML/CSS", 4, false, "none", ""},
			},
		},
		{
			Username:     "kirill_parttime",
			Email:        "kirill.parttime@edumatch.ru",
			Bio:          "Frontend-разработчик с высокой надежностью, но могу уделять только 10 часов в неделю.",
			HoursPerWeek: 10,
			AvgPeerScore: fPtr(4.7),
			Skills: []userSkillDef{
				{"React", 4, true, "github", "https://github.com/kirill/demo"},
				{"TypeScript", 3, true, "portfolio", ""},
				{"HTML/CSS", 4, true, "certificate", ""},
			},
		},
		{
			Username:     "elena_newbie",
			Email:        "elena.newbie@edumatch.ru",
			Bio:          "Новичок на платформе EduMatch. Готова учиться и уделять много времени проектам.",
			HoursPerWeek: 35,
			AvgPeerScore: nil, // Новичок без отзывов -> надёжность 0.6
			Skills: []userSkillDef{
				{"React", 4, true, "github", "https://github.com/elena/pet-project"},
				{"HTML/CSS", 4, true, "portfolio", ""},
				{"TypeScript", 3, false, "none", ""},
			},
		},
		{
			Username:     "sergey_busy",
			Email:        "sergey.busy@edumatch.ru",
			Bio:          "Участвую сразу в нескольких проектах одновременно.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.2),
			Skills: []userSkillDef{
				{"React", 4, true, "peer_review", ""},
				{"TypeScript", 4, true, "github", ""},
			},
		},
		{
			Username:     "mikhail_backend_lead",
			Email:        "mikhail.go@edumatch.ru",
			Bio:          "Пишу микросервисы на Go, проектирую схемы PostgreSQL и контейнеризацию в Docker.",
			HoursPerWeek: 25,
			AvgPeerScore: fPtr(4.9),
			Skills: []userSkillDef{
				{"Go", 5, true, "github", "https://github.com/mikhail/go-clean-arch"},
				{"PostgreSQL", 4, true, "certificate", "Postgres Professional"},
				{"Docker", 4, true, "github", ""},
				{"Linux", 4, true, "none", ""},
			},
		},
		{
			Username:     "anna_backend_mid",
			Email:        "anna.backend@edumatch.ru",
			Bio:          "Backend разработчик на Go и Python. Люблю оптимизацию SQL запросов.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.5),
			Skills: []userSkillDef{
				{"Go", 3, true, "github", ""},
				{"PostgreSQL", 3, true, "peer_review", ""},
				{"Docker", 3, false, "none", ""},
				{"Git", 4, true, "github", ""},
			},
		},
		{
			Username:     "sofia_designer_star",
			Email:        "sofia.design@edumatch.ru",
			Bio:          "Product и UI/UX дизайнер. Делаю дизайн-системы в Figma, интерактивные прототипы.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(5.0),
			Skills: []userSkillDef{
				{"Figma", 5, true, "portfolio", "https://behance.net/sofiadesign"},
				{"UI/UX", 5, true, "certificate", "British Higher School of Art & Design"},
				{"HTML/CSS", 3, false, "none", ""},
			},
		},
		{
			Username:     "artem_designer_mid",
			Email:        "artem.design@edumatch.ru",
			Bio:          "Дизайнер интерфейсов для мобильных и веб-приложений.",
			HoursPerWeek: 15,
			AvgPeerScore: fPtr(4.4),
			Skills: []userSkillDef{
				{"Figma", 4, true, "portfolio", "https://dribbble.com/artem"},
				{"UI/UX", 3, false, "none", ""},
			},
		},
		{
			Username:     "polina_qa",
			Email:        "polina.qa@edumatch.ru",
			Bio:          "Тестировщик ПО. Автотесты, регресс, составление тест-кейсов и баг-репортов.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.8),
			Skills: []userSkillDef{
				{"QA Testing", 5, true, "certificate", "ISTQB Certified Tester"},
				{"Git", 4, true, "github", ""},
				{"Linux", 3, true, "none", ""},
			},
		},
		{
			Username:     "daniil_devops",
			Email:        "daniil.devops@edumatch.ru",
			Bio:          "DevOps и системное администрирование. Docker, CI/CD, Linux серверов.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.6),
			Skills: []userSkillDef{
				{"Docker", 5, true, "github", ""},
				{"Linux", 4, true, "certificate", ""},
				{"Git", 4, true, "none", ""},
				{"Go", 2, false, "none", ""},
			},
		},
		{
			Username:     "nikita_fullstack",
			Email:        "nikita.fullstack@edumatch.ru",
			Bio:          "Fullstack разработчик (React, Node.js, Express, PostgreSQL).",
			HoursPerWeek: 25,
			AvgPeerScore: fPtr(4.5),
			Skills: []userSkillDef{
				{"React", 4, true, "github", ""},
				{"Node.js", 4, true, "github", ""},
				{"PostgreSQL", 3, true, "peer_review", ""},
				{"Express", 4, true, "none", ""},
			},
		},
		{
			Username:     "alina_pm",
			Email:        "alina.pm@edumatch.ru",
			Bio:          "Управление IT-проектами, agile, scrum, координация команд и стейкхолдеров.",
			HoursPerWeek: 15,
			AvgPeerScore: fPtr(4.9),
			Skills: []userSkillDef{
				{"UI/UX", 3, true, "portfolio", ""},
				{"Git", 3, true, "certificate", ""},
			},
		},
		{
			Username:     "egor_python_dev",
			Email:        "egor.py@edumatch.ru",
			Bio:          "Backend разработчик на Python и Django.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.3),
			Skills: []userSkillDef{
				{"Python", 4, true, "github", ""},
				{"Django", 4, true, "portfolio", ""},
				{"PostgreSQL", 3, false, "none", ""},
			},
		},
		{
			Username:     "anastasia_vue_dev",
			Email:        "anastasia.vue@edumatch.ru",
			Bio:          "Frontend разработчица на Vue.js и Tailwind CSS.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.4),
			Skills: []userSkillDef{
				{"Vue.js", 4, true, "github", ""},
				{"Tailwind CSS", 4, true, "portfolio", ""},
				{"HTML/CSS", 4, true, "none", ""},
			},
		},
		{
			Username:     "maksim_junior_fe",
			Email:        "maksim.fe@edumatch.ru",
			Bio:          "Начинающий фронтендер. Учу React и CSS верстку.",
			HoursPerWeek: 20,
			AvgPeerScore: nil,
			Skills: []userSkillDef{
				{"React", 2, false, "none", ""},
				{"HTML/CSS", 3, false, "none", ""},
			},
		},
		{
			Username:     "timofey_junior_be",
			Email:        "timofey.be@edumatch.ru",
			Bio:          "Начинающий бэкендер на Go.",
			HoursPerWeek: 15,
			AvgPeerScore: nil,
			Skills: []userSkillDef{
				{"Go", 2, false, "none", ""},
				{"PostgreSQL", 2, false, "none", ""},
			},
		},
		{
			Username:     "ksenia_mobile_ui",
			Email:        "ksenia.ui@edumatch.ru",
			Bio:          "Графический и UI дизайнер интерфейсов.",
			HoursPerWeek: 15,
			AvgPeerScore: fPtr(4.1),
			Skills: []userSkillDef{
				{"Figma", 3, true, "portfolio", ""},
				{"UI/UX", 3, false, "none", ""},
			},
		},
		{
			Username:     "roman_docker_fan",
			Email:        "roman.docker@edumatch.ru",
			Bio:          "Люблю автоматизацию, Docker и bash скрипты.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.0),
			Skills: []userSkillDef{
				{"Docker", 3, true, "github", ""},
				{"Linux", 3, true, "none", ""},
			},
		},
		{
			Username:     "valeria_tester",
			Email:        "valeria.test@edumatch.ru",
			Bio:          "Ручное и автоматизированное тестирование веб-сервисов.",
			HoursPerWeek: 15,
			AvgPeerScore: fPtr(4.2),
			Skills: []userSkillDef{
				{"QA Testing", 3, true, "none", ""},
				{"Git", 3, false, "none", ""},
			},
		},
		{
			Username:     "denis_node_dev",
			Email:        "denis.node@edumatch.ru",
			Bio:          "Node.js, Express, REST API и базы данных.",
			HoursPerWeek: 25,
			AvgPeerScore: fPtr(4.5),
			Skills: []userSkillDef{
				{"Node.js", 4, true, "github", ""},
				{"Express", 4, true, "github", ""},
				{"PostgreSQL", 3, true, "certificate", ""},
			},
		},
		{
			Username:     "veronika_frontend",
			Email:        "veronika.fe@edumatch.ru",
			Bio:          "Frontend разработчик, аккуратный код и верстка.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.6),
			Skills: []userSkillDef{
				{"React", 3, true, "github", ""},
				{"HTML/CSS", 4, true, "portfolio", ""},
				{"TypeScript", 3, false, "none", ""},
			},
		},
		{
			Username:     "ilya_go_hacker",
			Email:        "ilya.go@edumatch.ru",
			Bio:          "Люблю Go и сложные алгоритмические задачи.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(4.7),
			Skills: []userSkillDef{
				{"Go", 4, true, "github", ""},
				{"PostgreSQL", 3, true, "none", ""},
			},
		},
		{
			Username:     "olesya_figma_pro",
			Email:        "olesya.design@edumatch.ru",
			Bio:          "UI дизайнер, создание презентаций и интерфейсов сайтов.",
			HoursPerWeek: 15,
			AvgPeerScore: fPtr(4.7),
			Skills: []userSkillDef{
				{"Figma", 4, true, "portfolio", ""},
				{"UI/UX", 4, true, "portfolio", ""},
			},
		},
		{
			Username:     "vlad_student",
			Email:        "vlad.student@edumatch.ru",
			Bio:          "Студент 3 курса, изучаю фуллстек разработку.",
			HoursPerWeek: 20,
			AvgPeerScore: fPtr(3.8),
			Skills: []userSkillDef{
				{"React", 3, false, "none", ""},
				{"Node.js", 3, false, "none", ""},
			},
		},
		{
			Username:     "marina_student",
			Email:        "marina.student@edumatch.ru",
			Bio:          "Изучаю тестирование и анализ требований.",
			HoursPerWeek: 15,
			AvgPeerScore: nil,
			Skills: []userSkillDef{
				{"QA Testing", 2, false, "none", ""},
				{"Git", 2, false, "none", ""},
			},
		},
		{
			Username:     "stanislav_student",
			Email:        "stanislav.student@edumatch.ru",
			Bio:          "Интересуюсь системным администрированием и Linux.",
			HoursPerWeek: 10,
			AvgPeerScore: fPtr(4.0),
			Skills: []userSkillDef{
				{"Linux", 3, true, "none", ""},
				{"Docker", 2, false, "none", ""},
			},
		},
	}

	userIDMap := make(map[string]int64)
	now := time.Now()

	for _, s := range students {
		var uid int64
		// Create or update user
		err := pool.QueryRow(ctx, `
			INSERT INTO users (username, email, password_hash, bio, avg_peer_score, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (email) DO UPDATE SET
				username = EXCLUDED.username,
				bio = EXCLUDED.bio,
				avg_peer_score = EXCLUDED.avg_peer_score,
				updated_at = EXCLUDED.updated_at
			RETURNING id
		`, s.Username, s.Email, string(hashedPassword), s.Bio, s.AvgPeerScore, now, now).Scan(&uid)
		if err != nil {
			log.Fatalf("failed to insert user %s: %v", s.Username, err)
		}
		userIDMap[s.Username] = uid

		// Availability
		_, err = pool.Exec(ctx, `
			INSERT INTO user_availability (user_id, hours_per_week)
			VALUES ($1, $2)
			ON CONFLICT (user_id) DO UPDATE SET hours_per_week = EXCLUDED.hours_per_week
		`, uid, s.HoursPerWeek)
		if err != nil {
			log.Fatalf("failed to insert availability for %s: %v", s.Username, err)
		}

		// Delete existing skills to replace cleanly
		_, _ = pool.Exec(ctx, `DELETE FROM user_skills WHERE user_id = $1`, uid)

		// Insert user_skills
		for _, us := range s.Skills {
			sid, ok := skillIDMap[us.SkillName]
			if !ok {
				continue
			}
			_, err = pool.Exec(ctx, `
				INSERT INTO user_skills (user_id, skill_id, level, verified, evidence_type, evidence_url)
				VALUES ($1, $2, $3, $4, $5, $6)
				ON CONFLICT (user_id, skill_id) DO UPDATE SET
					level = EXCLUDED.level,
					verified = EXCLUDED.verified,
					evidence_type = EXCLUDED.evidence_type,
					evidence_url = EXCLUDED.evidence_url
			`, uid, sid, us.Level, us.Verified, us.EvidenceType, us.EvidenceURL)
			if err != nil {
				log.Fatalf("failed to insert user skill %s for user %s: %v", us.SkillName, s.Username, err)
			}
		}
	}
	fmt.Printf("✓ %d students seeded with availability and verified/unverified skills\n", len(students))

	// 3. Seed 2 Projects with Roles and Requirements
	authorID := userIDMap["alex_author"]

	// Project 1: «Сервис аренды»
	deadline1 := now.AddDate(0, 2, 0)
	var proj1ID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO projects (owner_id, title, description, is_open, status, deadline, created_at, updated_at)
		VALUES ($1, $2, $3, true, 'open', $4, $5, $6)
		ON CONFLICT (id) DO NOTHING
		RETURNING id
	`, authorID, "Сервис аренды", "Платформа для краткосрочной и долгосрочной аренды студенческого оборудования и инвентаря.", deadline1, now, now).Scan(&proj1ID)
	if err != nil {
		// retrieve if already exists
		_ = pool.QueryRow(ctx, `SELECT id FROM projects WHERE title = $1 LIMIT 1`, "Сервис аренды").Scan(&proj1ID)
	}

	if proj1ID > 0 {
		// Clear old roles if any
		_, _ = pool.Exec(ctx, `DELETE FROM project_roles WHERE project_id = $1`, proj1ID)

		// Role 1: Frontend разработчик (20 ч/нед)
		var r1ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'Frontend разработчик', 20) RETURNING id
		`, proj1ID).Scan(&r1ID)

		// Requirements: React (min 4, weight 3), TypeScript (min 3, weight 2), HTML/CSS (min 3, weight 1)
		insertReq(ctx, pool, r1ID, skillIDMap["React"], 4, 3)
		insertReq(ctx, pool, r1ID, skillIDMap["TypeScript"], 3, 2)
		insertReq(ctx, pool, r1ID, skillIDMap["HTML/CSS"], 3, 1)

		// Role 2: Backend разработчик (20 ч/нед)
		var r2ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'Backend разработчик', 20) RETURNING id
		`, proj1ID).Scan(&r2ID)

		// Requirements: Go (min 3, weight 3), PostgreSQL (min 3, weight 2), Docker (min 2, weight 1)
		insertReq(ctx, pool, r2ID, skillIDMap["Go"], 3, 3)
		insertReq(ctx, pool, r2ID, skillIDMap["PostgreSQL"], 3, 2)
		insertReq(ctx, pool, r2ID, skillIDMap["Docker"], 2, 1)

		// Role 3: UI/UX дизайнер (15 ч/нед)
		var r3ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'UI/UX дизайнер', 15) RETURNING id
		`, proj1ID).Scan(&r3ID)

		// Requirements: Figma (min 4, weight 3), UI/UX (min 3, weight 2)
		insertReq(ctx, pool, r3ID, skillIDMap["Figma"], 4, 3)
		insertReq(ctx, pool, r3ID, skillIDMap["UI/UX"], 3, 2)

		fmt.Printf("✓ Project 1 'Сервис аренды' seeded with 3 roles (Frontend, Backend, Design)\n")
	}

	// Project 2: «Платформа онлайн-курсов»
	deadline2 := now.AddDate(0, 3, 0)
	var proj2ID int64
	err = pool.QueryRow(ctx, `
		INSERT INTO projects (owner_id, title, description, is_open, status, deadline, created_at, updated_at)
		VALUES ($1, $2, $3, true, 'open', $4, $5, $6)
		ON CONFLICT (id) DO NOTHING
		RETURNING id
	`, authorID, "Платформа онлайн-курсов", "Интерактивная образовательная система с тестированием и автопроверкой кода.", deadline2, now, now).Scan(&proj2ID)
	if err != nil {
		_ = pool.QueryRow(ctx, `SELECT id FROM projects WHERE title = $1 LIMIT 1`, "Платформа онлайн-курсов").Scan(&proj2ID)
	}

	if proj2ID > 0 {
		_, _ = pool.Exec(ctx, `DELETE FROM project_roles WHERE project_id = $1`, proj2ID)

		// Role 1: Fullstack разработчик (25 ч/нед)
		var r1ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'Fullstack разработчик', 25) RETURNING id
		`, proj2ID).Scan(&r1ID)
		insertReq(ctx, pool, r1ID, skillIDMap["React"], 3, 2)
		insertReq(ctx, pool, r1ID, skillIDMap["Node.js"], 3, 2)
		insertReq(ctx, pool, r1ID, skillIDMap["PostgreSQL"], 3, 1)

		// Role 2: QA Инженер (15 ч/нед)
		var r2ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'QA Инженер', 15) RETURNING id
		`, proj2ID).Scan(&r2ID)
		insertReq(ctx, pool, r2ID, skillIDMap["QA Testing"], 3, 3)
		insertReq(ctx, pool, r2ID, skillIDMap["Git"], 3, 1)

		// Role 3: DevOps специалист (15 ч/нед)
		var r3ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'DevOps специалист', 15) RETURNING id
		`, proj2ID).Scan(&r3ID)
		insertReq(ctx, pool, r3ID, skillIDMap["Docker"], 3, 3)
		insertReq(ctx, pool, r3ID, skillIDMap["Linux"], 3, 2)

		// Role 4: Project Manager (10 ч/нед)
		var r4ID int64
		_ = pool.QueryRow(ctx, `
			INSERT INTO project_roles (project_id, title, hours_per_week)
			VALUES ($1, 'Project Manager', 10) RETURNING id
		`, proj2ID).Scan(&r4ID)
		insertReq(ctx, pool, r4ID, skillIDMap["UI/UX"], 2, 2)
		insertReq(ctx, pool, r4ID, skillIDMap["Git"], 2, 1)

		fmt.Printf("✓ Project 2 'Платформа онлайн-курсов' seeded with 4 roles (Fullstack, QA, DevOps, PM)\n")
	}

	fmt.Println("\n🎉 Database successfully seeded with 18 skills, 28 students and 2 projects!")
	fmt.Println("👉 Demo login: author@edumatch.ru / password: password123")
}

func insertReq(ctx context.Context, pool *pgxpool.Pool, roleID, skillID int64, minLevel, weight int) {
	_, err := pool.Exec(ctx, `
		INSERT INTO role_requirements (role_id, skill_id, min_level, weight)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (role_id, skill_id) DO UPDATE SET
			min_level = EXCLUDED.min_level,
			weight = EXCLUDED.weight
	`, roleID, skillID, minLevel, weight)
	if err != nil {
		log.Printf("failed to insert req for role %d, skill %d: %v", roleID, skillID, err)
	}
}

