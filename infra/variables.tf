variable "project_name" {
  description = "Project name for tagging and naming resources"
  type        = string
  default     = "PSO_Final"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "container_image" {
  description = "Docker image for backend ECS (e.g., 123456789.dkr.ecr.ap-southeast-1.amazonaws.com/pso-backend:latest or akhtar2344/pso-backend:latest)"
  type        = string
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
  validation {
    condition     = var.desired_count > 0
    error_message = "desired_count must be > 0"
  }
}

variable "container_cpu" {
  description = "Fargate CPU (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Fargate memory (MB)"
  type        = number
  default     = 1024
}

variable "enable_nat" {
  description = "Enable NAT Gateway for private subnets (costs money)"
  type        = bool
  default     = false
}

variable "alb_enable_https" {
  description = "Enable HTTPS on ALB (requires domain_name or generates self-signed cert)"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Custom domain name (optional). If set, will use Route53 and ACM. Leave empty to use ALB DNS."
  type        = string
  default     = ""
}

variable "mongodb_org_id" {
  description = "MongoDB Atlas Organization ID"
  type        = string
  sensitive   = true
}

variable "mongodb_public_key" {
  description = "MongoDB Atlas Public Key"
  type        = string
  sensitive   = true
}

variable "mongodb_private_key" {
  description = "MongoDB Atlas Private Key"
  type        = string
  sensitive   = true
}

variable "mongodb_cluster_name" {
  description = "MongoDB Atlas cluster name"
  type        = string
  default     = "pso-dev"
}

variable "mongodb_db_username" {
  description = "MongoDB database username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "mongodb_db_password" {
  description = "MongoDB database password"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Express session secret for JWT/sessions"
  type        = string
  sensitive   = true
}

variable "cloudinary_url" {
  description = "Cloudinary URL for image uploads (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "container_port" {
  description = "Backend container port"
  type        = number
  default     = 5001
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}

variable "enable_alb_access_logs" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = true
}
