# IAM Roles and Policies for least-privilege access

# ECS Task Execution Role (allows ECS to pull image, write logs, read secrets)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-execution-role"
  }
}

# Attach managed policy for basic ECS task execution
resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for ECS task execution role to read secrets
resource "aws_iam_role_policy" "ecs_task_execution_policy" {
  name   = "${var.project_name}-ecs-task-execution-policy"
  role   = aws_iam_role.ecs_task_execution_role.id
  policy = data.aws_iam_policy_document.ecs_task_execution_policy.json
}

data "aws_iam_policy_document" "ecs_task_execution_policy" {
  statement {
    sid    = "ReadSecrets"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      aws_secretsmanager_secret.mongodb_uri.arn,
      aws_secretsmanager_secret.session_secret.arn,
      aws_secretsmanager_secret.cloudinary_url.arn
    ]
  }

  statement {
    sid    = "DecryptSecrets"
    effect = "Allow"

    actions = [
      "kms:Decrypt"
    ]

    resources = ["arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"]
  }
}

# ECS Task Role (application runtime permissions)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-ecs-task-role"
  }
}

# Custom policy for application runtime (read secrets)
resource "aws_iam_role_policy" "ecs_task_policy" {
  name   = "${var.project_name}-ecs-task-policy"
  role   = aws_iam_role.ecs_task_role.id
  policy = data.aws_iam_policy_document.ecs_task_policy.json
}

data "aws_iam_policy_document" "ecs_task_policy" {
  statement {
    sid    = "ReadSecretsAtRuntime"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue"
    ]

    resources = [
      aws_secretsmanager_secret.mongodb_uri.arn,
      aws_secretsmanager_secret.session_secret.arn,
      aws_secretsmanager_secret.cloudinary_url.arn
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "${aws_cloudwatch_log_group.ecs.arn}:*"
    ]
  }
}

# IAM Policy for S3 frontend bucket (for deployment)
resource "aws_iam_policy" "s3_frontend_deployment" {
  name        = "${var.project_name}-s3-frontend-deployment"
  description = "Allow uploading to frontend S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListBucket"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketVersioning"
        ]
        Resource = aws_s3_bucket.frontend.arn
      },
      {
        Sid    = "PutObject"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-s3-frontend-deployment"
  }
}

# IAM Policy for CloudFront cache invalidation
resource "aws_iam_policy" "cloudfront_invalidation" {
  name        = "${var.project_name}-cloudfront-invalidation"
  description = "Allow CloudFront cache invalidation"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "InvalidateDistribution"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetInvalidation"
        ]
        Resource = aws_cloudfront_distribution.frontend.arn
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-cloudfront-invalidation"
  }
}

# IAM Policy for ECR push (for CI/CD)
resource "aws_iam_policy" "ecr_push" {
  name        = "${var.project_name}-ecr-push"
  description = "Allow pushing to ECR repository"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:DescribeImages"
        ]
        Resource = "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/*"
      },
      {
        Sid    = "ECRAuth"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-ecr-push"
  }
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task_role.arn
}

output "s3_frontend_deployment_policy_arn" {
  value = aws_iam_policy.s3_frontend_deployment.arn
}

output "cloudfront_invalidation_policy_arn" {
  value = aws_iam_policy.cloudfront_invalidation.arn
}

output "ecr_push_policy_arn" {
  value = aws_iam_policy.ecr_push.arn
}
