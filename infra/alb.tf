# Application Load Balancer with HTTPS and least-privilege security

resource "aws_lb" "backend_alb" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.id
    enabled = var.enable_alb_access_logs
    prefix  = "alb-logs"
  }

  tags = {
    Name = "${var.project_name}-alb"
  }

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

# Target Group
resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-backend-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 3
    interval            = 30
    path                = "/api/auth/register"
    matcher             = "200-499"
  }

  tags = {
    Name = "${var.project_name}-backend-tg"
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "backend_http" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# HTTPS Listener (requires certificate)
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"

  # Use ACM certificate if domain provided, else self-signed (for testing only)
  certificate_arn = var.domain_name != "" ? aws_acm_certificate.alb[0].arn : aws_acm_certificate_self_signed.alb[0].arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  depends_on = [var.domain_name != "" ? aws_acm_certificate_validation.alb[0] : aws_acm_certificate_self_signed.alb[0]]
}

# Self-signed certificate for testing (when no domain)
resource "tls_private_key" "alb_self_signed" {
  count     = var.domain_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "alb_self_signed" {
  count           = var.domain_name == "" ? 1 : 0
  private_key_pem = tls_private_key.alb_self_signed[0].private_key_pem

  subject {
    common_name  = aws_lb.backend_alb.dns_name
    organization = var.project_name
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "aws_acm_certificate_self_signed" "alb" {
  count             = var.domain_name == "" ? 1 : 0
  certificate_body  = tls_self_signed_cert.alb_self_signed[0].cert_pem
  private_key       = tls_private_key.alb_self_signed[0].private_key_pem
  tags = {
    Name = "${var.project_name}-self-signed-cert"
  }
}

# ACM Certificate from Route53 (when domain provided)
resource "aws_acm_certificate" "alb" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method = "DNS"

  tags = {
    Name = "${var.project_name}-acm-cert"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Route53 DNS validation (when domain provided)
data "aws_route53_zone" "main" {
  count = var.domain_name != "" ? 1 : 0
  name  = var.domain_name
}

resource "aws_route53_record" "cert_validation" {
  for_each = var.domain_name != "" ? {
    for dvo in aws_acm_certificate.alb[0].domain_validation_options : dvo.domain => {
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

resource "aws_acm_certificate_validation" "alb" {
  count           = var.domain_name != "" ? 1 : 0
  certificate_arn = aws_acm_certificate.alb[0].arn

  timeouts {
    create = "5m"
  }

  depends_on = [aws_route53_record.cert_validation]
}

# Route53 A record for custom domain (when provided)
resource "aws_route53_record" "alb" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.backend_alb.dns_name
    zone_id                = aws_lb.backend_alb.zone_id
    evaluate_target_health = true
  }
}

output "alb_target_group_arn" {
  value = aws_lb_target_group.backend.arn
}

output "alb_listener_arn" {
  value = aws_lb_listener.backend.arn
}
