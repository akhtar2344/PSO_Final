#############################################
# AWS Outputs
#############################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.backend_alb.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.backend_alb.arn
}

output "alb_listener_arn" {
  description = "ARN of the ALB Listener"
  value       = aws_lb_listener.backend.arn
}

output "alb_target_group_arn" {
  description = "Target Group ARN for ECS backend"
  value       = aws_lb_target_group.backend.arn
}

output "s3_frontend_bucket" {
  description = "S3 bucket used for frontend hosting"
  value       = aws_s3_bucket.frontend.id
}

output "s3_frontend_bucket_arn" {
  description = "Frontend S3 bucket ARN"
  value       = aws_s3_bucket.frontend.arn
}

output "s3_alb_logs_bucket" {
  description = "S3 bucket used for ALB logs"
  value       = aws_s3_bucket.alb_logs.id
}

#############################################
# CloudFront Outputs
#############################################

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

#############################################
# MongoDB Atlas Outputs (from module)
#############################################

output "mongodb_project_id" {
  description = "MongoDB Atlas Project ID"
  value       = module.mongodb_atlas.mongodb_project_id
}

output "mongodb_cluster_name" {
  description = "MongoDB Cluster Name"
  value       = module.mongodb_atlas.mongodb_cluster_name
}

output "mongodb_cluster_connection_string" {
  description = "MongoDB connection string"
  value       = module.mongodb_atlas.mongodb_connection_string
  sensitive   = true
}

#############################################
# API Endpoint Output
#############################################

output "api_endpoint" {
  description = "Backend API public endpoint"
  value       = var.domain_name != "" ? "https://api.${var.domain_name}" : "http://${aws_lb.backend_alb.dns_name}"
}
