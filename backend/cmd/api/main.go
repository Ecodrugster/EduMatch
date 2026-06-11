package main

import (
    "log"
    "edumatch/config"
    "edumatch/internal/infra"
    "edumatch/internal/repository"
    "edumatch/internal/service"
    "edumatch/internal/delivery"
    "github.com/gin-gonic/gin"
swaggerFiles "github.com/swaggo/files"
    swagger "github.com/swaggo/gin-swagger"
    _ "edumatch/docs"
)

func main() {
   
    config.Load()
    cfg := config.AppConfig

    
    pgPool := infra.InitPostgres(cfg)
    defer pgPool.Close()
    redisClient := infra.InitRedis(cfg)
    defer func() { _ = redisClient.Close() }()

   
    repos := repository.NewRepositories(pgPool)

    
    userService := service.NewUserService(repos.User, cfg, redisClient)
    projectService := service.NewProjectService(repos.Project, cfg, redisClient)
    applicationService := service.NewApplicationService(repos.Application, cfg, redisClient)
    messageService := service.NewMessageService(repos.Message, cfg, redisClient)
    memberService := service.NewMemberService(repos.Member, cfg, redisClient)

    
    router := gin.Default()
    router.GET("/swagger/*any", swagger.WrapHandler(swaggerFiles.Handler))
    
    authRouter := router.Group("/auth")
    authRouter.POST("/signup", func(c *gin.Context) { delivery.SignUpHandler(c, userService) })
    authRouter.POST("/login", func(c *gin.Context) { delivery.LoginHandler(c, userService) })
    authRouter.POST("/refresh", func(c *gin.Context) { delivery.RefreshHandler(c, userService) })
   
    protected := router.Group("/protected")
    protected.Use(delivery.AuthMiddleware(cfg))
    protected.GET("/ping", delivery.PingHandler)
    protected.GET("/projects", func(c *gin.Context) { delivery.GetProjectsHandler(c, projectService) })
    
    protected.POST("/applications", func(c *gin.Context) { delivery.CreateApplicationHandler(c, applicationService) })
    protected.GET("/applications/:id", func(c *gin.Context) { delivery.GetApplicationHandler(c, applicationService) })
    protected.PATCH("/applications/:id/status", func(c *gin.Context) { delivery.UpdateApplicationStatusHandler(c, applicationService) })
    protected.GET("/applications", func(c *gin.Context) { delivery.ListApplicationsHandler(c, applicationService) })
    
    protected.POST("/messages", func(c *gin.Context) { delivery.CreateMessageHandler(c, messageService) })
    protected.GET("/messages", func(c *gin.Context) { delivery.ListMessagesHandler(c, messageService) })
    
    protected.POST("/members", func(c *gin.Context) { delivery.AddMemberHandler(c, memberService) })
    protected.GET("/members", func(c *gin.Context) { delivery.ListMembersHandler(c, memberService) })
  
    log.Printf("Server starting on %s", cfg.ServerAddress())
    if err := router.Run(cfg.ServerAddress()); err != nil {
        log.Fatalf("Failed to run server: %v", err)
    }
}
