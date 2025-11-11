# AWS Secrets Manager for application secrets
# Stores: MONGODB_URI, SESSION_SECRET, CLOUDINARY_URL

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name                    = "${var.project_name}/mongodb-uri"
  description             = "MongoDB connection string"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-mongodb-uri"
  }
}

resource "aws_secretsmanager_secret_version" "mongodb_uri_value" {
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = module.mongodb_atlas.connection_string
}

resource "aws_secretsmanager_secret" "session_secret" {
  name                    = "${var.project_name}/session-secret"
  description             = "Express session secret for JWT/sessions"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-session-secret"
  }
}

resource "aws_secretsmanager_secret_version" "session_secret_value" {
  secret_id     = aws_secretsmanager_secret.session_secret.id
  secret_string = var.session_secret
}

resource "aws_secretsmanager_secret" "cloudinary_url" {
  name                    = "${var.project_name}/cloudinary-url"
  description             = "Cloudinary URL for image uploads"
  recovery_window_in_days = 7

  tags = {
    Name = "${var.project_name}-cloudinary-url"
  }
}

resource "aws_secretsmanager_secret_version" "cloudinary_url_value" {
  secret_id     = aws_secretsmanager_secret.cloudinary_url.id
  secret_string = var.cloudinary_url
}

# Secrets Manager policy for ECS task role to read secrets
data "aws_iam_policy_document" "secrets_policy" {
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
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = ["arn:aws:kms:${var.aws_region}:${data.aws_caller_identity.current.account_id}:key/*"]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.aws_region}.amazonaws.com"]
    }
  }
}

output "secrets_policy_document" {
  value = data.aws_iam_policy_document.secrets_policy.json
}
