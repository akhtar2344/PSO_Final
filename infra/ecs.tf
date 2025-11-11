# ECS Fargate Cluster, Task Definition, and Service for Node/Express backend

resource "aws_ecs_cluster" "backend" {
  name = "${var.project_name}-backend"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-backend-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "backend" {
  cluster_name = aws_ecs_cluster.backend.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-ecs-logs"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "${var.project_name}-backend"
    image     = var.container_image
    essential = true
    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    # Secrets from Secrets Manager
    secrets = [
      {
        name      = "MONGODB_URI"
        valueFrom = aws_secretsmanager_secret.mongodb_uri.arn
      },
      {
        name      = "SESSION_SECRET"
        valueFrom = aws_secretsmanager_secret.session_secret.arn
      },
      {
        name      = "CLOUDINARY_URL"
        valueFrom = aws_secretsmanager_secret.cloudinary_url.arn
      }
    ]

    # Environment variables
    environment = [
      {
        name  = "NODE_ENV"
        value = var.environment
      },
      {
        name  = "PORT"
        value = tostring(var.container_port)
      }
    ]
  }])

  tags = {
    Name = "${var.project_name}-backend-task"
  }
}

# ECS Service
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-backend-service"
  cluster         = aws_ecs_cluster.backend.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "${var.project_name}-backend"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.backend,
    aws_iam_role_policy.ecs_task_execution_policy
  ]

  tags = {
    Name = "${var.project_name}-backend-service"
  }
}

# Auto Scaling for ECS Service
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 3
  min_capacity       = var.desired_count
  resource_id        = "service/${aws_ecs_cluster.backend.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "${var.project_name}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  name               = "${var.project_name}-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
  }
}

output "ecs_cluster_arn" {
  value = aws_ecs_cluster.backend.arn
}

output "ecs_task_definition_arn" {
  value = aws_ecs_task_definition.backend.arn
}

output "ecs_service_arn" {
  value = aws_ecs_service.backend.arn
}
