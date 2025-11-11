# S3 + CloudFront for React frontend with HTTPS

# S3 bucket for frontend static files
resource "aws_s3_bucket" "frontend" {
  bucket = "${lower(var.project_name)}-frontend-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-frontend"
  }
}

# Block public access (CloudFront will serve via OAI)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CloudFront Origin Access Identity (OAI) for secure S3 access
resource "aws_cloudfront_origin_access_identity" "frontend" {
  comment = "${var.project_name} OAI for frontend S3"
}

# S3 bucket policy to allow CloudFront OAI access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.frontend.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "frontend" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3Frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  http_version        = "http2and3"

  # Cache behavior
  default_cache_behavior {
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    target_origin_id = "S3Frontend"

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 300
    max_ttl     = 86400
    compress    = true
  }

  # Cache behavior for static assets (long TTL)
  cache_behavior {
    path_pattern    = "/static/*"
    allowed_methods = ["GET", "HEAD"]
    cached_methods  = ["GET", "HEAD"]

    target_origin_id = "S3Frontend"

    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 31536000 # 1 year
    max_ttl     = 31536000
    compress    = true
  }

  # Handle React Router (SPA) - return index.html for missing files
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  # Use default CloudFront certificate or custom domain if provided
  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == "" ? true : false
    acm_certificate_arn            = var.domain_name != "" ? aws_acm_certificate.cloudfront[0].arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  # Allow domain (when provided)
  aliases = var.domain_name != "" ? ["${var.domain_name}", "www.${var.domain_name}"] : []

  # Web ACL for DDoS protection (optional - can add AWS Shield Standard)
  # web_acl_id = aws_wafv2_web_acl.cloudfront[0].arn

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "${var.project_name}-cloudfront"
  }

  depends_on = [var.domain_name != "" ? aws_acm_certificate_validation.cloudfront[0] : null]
}

# ACM Certificate for CloudFront (when domain provided)
resource "aws_acm_certificate" "cloudfront" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method = "DNS"
  provider          = aws.us_east_1 # CloudFront requires us-east-1

  tags = {
    Name = "${var.project_name}-cloudfront-cert"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 DNS validation for CloudFront cert
resource "aws_route53_record" "cloudfront_cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.domain_name != "" ? data.aws_route53_zone.main[0].zone_id : null
}

resource "aws_acm_certificate_validation" "cloudfront" {
  count           = var.domain_name != "" ? 1 : 0
  certificate_arn = aws_acm_certificate.cloudfront[0].arn
  provider        = aws.us_east_1

  timeouts {
    create = "5m"
  }

  depends_on = [aws_route53_record.cloudfront_cert_validation]
}

# Route53 A records for custom domain (when provided)
resource "aws_route53_record" "cloudfront" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "cloudfront_www" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = true
  }
}

# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${lower(var.project_name)}-alb-logs-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${var.project_name}-alb-logs"
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ALB logs bucket policy (allow ELB service account)
data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowELBRootAccount"
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

output "cloudfront_distribution_arn" {
  value = aws_cloudfront_distribution.frontend.arn
}

output "s3_frontend_bucket_arn" {
  value = aws_s3_bucket.frontend.arn
}

output "s3_alb_logs_bucket_arn" {
  value = aws_s3_bucket.alb_logs.arn
}
