output "alb_dns_name" {
  description = "ALB DNS name (or use custom domain if configured)"
  value       = aws_lb.backend_alb.dns_name
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.backend_alb.arn
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name for frontend"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "s3_alb_logs_bucket" {
  description = "S3 bucket name for ALB access logs"
  value       = aws_s3_bucket.alb_logs.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.backend.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.backend.name
}

output "secrets_manager_arns" {
  description = "ARNs of all secrets in Secrets Manager"
  value = {
    mongodb_uri      = aws_secretsmanager_secret.mongodb_uri.arn
    session_secret   = aws_secretsmanager_secret.session_secret.arn
    cloudinary_url   = aws_secretsmanager_secret.cloudinary_url.arn
  }
}

output "mongodb_connection_string" {
  description = "MongoDB Atlas connection string (stored in Secrets Manager)"
  value       = aws_secretsmanager_secret_version.mongodb_uri_value.secret_id
  sensitive   = true
}

output "mongodb_cluster_name" {
  description = "MongoDB Atlas cluster name"
  value       = module.mongodb_atlas.cluster_name
}

output "mongodb_cluster_connection_string" {
  description = "MongoDB connection string"
  value       = module.mongodb_atlas.connection_string
  sensitive   = true
}

output "cloudwatch_log_group_ecs" {
  description = "CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "website_url" {
  description = "Frontend website URL"
  value = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_endpoint" {
  description = "Backend API endpoint"
  value = var.domain_name != "" ? "https://api.${var.domain_name}" : "https://${aws_lb.backend_alb.dns_name}"
}

output "post_deployment_checklist" {
  description = "Post-deployment checklist"
  value = <<-EOT
    
    ✅ POST-DEPLOYMENT CHECKLIST:
    
    1. Backend API:
       - URL: ${aws_lb.backend_alb.dns_name}
       - Health Check: curl https://${aws_lb.backend_alb.dns_name}/api/auth/register
       - CloudWatch Logs: aws logs tail /ecs/pso-backend --follow
    
    2. Frontend:
       - URL: https://${aws_cloudfront_distribution.frontend.domain_name}
       - S3 Bucket: ${aws_s3_bucket.frontend.id}
       - Distribution ID: ${aws_cloudfront_distribution.frontend.id}
    
    3. Secrets Manager:
       - MongoDB URI: ${aws_secretsmanager_secret.mongodb_uri.arn}
       - Session Secret: ${aws_secretsmanager_secret.session_secret.arn}
       - Cloudinary URL: ${aws_secretsmanager_secret.cloudinary_url.arn}
    
    4. MongoDB Atlas:
       - Cluster: ${module.mongodb_atlas.cluster_name}
       - Connection String: (stored in Secrets Manager)
    
    5. Deployment Commands:
       
       # Build and push backend image to ECR:
       aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com
       docker build -t ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/pso-backend:latest ./backend
       docker push ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/pso-backend:latest
       
       # Update ECS service:
       aws ecs update-service --cluster ${aws_ecs_cluster.backend.name} --service ${aws_ecs_service.backend.name} --force-new-deployment --region ${var.aws_region}
       
       # Upload frontend to S3:
       cd frontend && npm run build
       aws s3 sync build/ s3://${aws_s3_bucket.frontend.id}/ --delete --region ${var.aws_region}
       
       # Invalidate CloudFront:
       aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.frontend.id} --paths "/*"
  EOT
}
