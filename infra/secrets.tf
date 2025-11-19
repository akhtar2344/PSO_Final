#############################################
# AWS Secrets Manager (store sensitive variables)
#############################################

resource "aws_secretsmanager_secret" "mongodb_uri" {
  name = "${var.project_name}-mongodb-uri"
}

resource "aws_secretsmanager_secret_version" "mongodb_uri_value" {
  secret_id     = aws_secretsmanager_secret.mongodb_uri.id
  secret_string = module.mongodb_atlas.mongodb_connection_string
}

resource "aws_secretsmanager_secret" "session_secret" {
  name = "${var.project_name}-session-secret"
}

resource "aws_secretsmanager_secret_version" "session_secret_value" {
  secret_id     = aws_secretsmanager_secret.session_secret.id
  secret_string = var.session_secret
}

resource "aws_secretsmanager_secret" "cloudinary_url" {
  name = "${var.project_name}-cloudinary-url"
}

resource "aws_secretsmanager_secret_version" "cloudinary_url_value" {
  secret_id     = aws_secretsmanager_secret.cloudinary_url.id
  secret_string = var.cloudinary_url
}

#############################################
# Other environment variables stored in secrets
#############################################

resource "aws_secretsmanager_secret" "backend_env" {
  name = "${var.project_name}-backend-env"
}

resource "aws_secretsmanager_secret_version" "backend_env_value" {
  secret_id = aws_secretsmanager_secret.backend_env.id
  secret_string = jsonencode({
    MONGODB_URI    = module.mongodb_atlas.mongodb_connection_string
    SESSION_SECRET = var.session_secret
    CLOUDINARY_URL = var.cloudinary_url
  })
}
