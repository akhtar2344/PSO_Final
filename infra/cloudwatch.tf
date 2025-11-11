# CloudWatch Log Groups and monitoring

# Log group for ECS (already created in ecs.tf, but we can add more configs here)

# CloudWatch Log Group for ALB (optional, in addition to S3 logs)
resource "aws_cloudwatch_log_group" "alb" {
  name              = "/aws/alb/${var.project_name}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-alb-logs"
  }
}

# CloudWatch Alarms for ECS Service

# High CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.project_name}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Alarm when ECS CPU exceeds 80%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.backend.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name = "${var.project_name}-ecs-cpu-alarm"
  }
}

# High Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.project_name}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Alarm when ECS memory exceeds 85%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = aws_ecs_cluster.backend.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name = "${var.project_name}-ecs-memory-alarm"
  }
}

# ALB Unhealthy Target Count Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "${var.project_name}-alb-unhealthy-targets"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alarm when ALB has unhealthy targets"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
    LoadBalancer = aws_lb.backend_alb.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-unhealthy-alarm"
  }
}

# ALB HTTP 5XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "${var.project_name}-alb-5xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alarm when ALB gets 10+ HTTP 5XX errors in 2 minutes"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = aws_lb_target_group.backend.arn_suffix
    LoadBalancer = aws_lb.backend_alb.arn_suffix
  }

  tags = {
    Name = "${var.project_name}-alb-5xx-alarm"
  }
}

# CloudFront 4XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "Alarm when CloudFront 4XX error rate > 5%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.frontend.id
  }

  tags = {
    Name = "${var.project_name}-cloudfront-4xx-alarm"
  }
}

# CloudFront 5XX Errors Alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_errors" {
  alarm_name          = "${var.project_name}-cloudfront-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "Alarm when CloudFront 5XX error rate > 1%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.frontend.id
  }

  tags = {
    Name = "${var.project_name}-cloudfront-5xx-alarm"
  }
}

output "cloudwatch_log_group_ecs_arn" {
  value = aws_cloudwatch_log_group.ecs.arn
}

output "cloudwatch_log_group_alb_arn" {
  value = aws_cloudwatch_log_group.alb.arn
}

output "alarm_names" {
  value = [
    aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name,
    aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name,
    aws_cloudwatch_metric_alarm.alb_unhealthy_targets.alarm_name,
    aws_cloudwatch_metric_alarm.alb_5xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.cloudfront_4xx_errors.alarm_name,
    aws_cloudwatch_metric_alarm.cloudfront_5xx_errors.alarm_name
  ]
}
