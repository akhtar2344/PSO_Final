output "terraform_state_bucket" {
  value       = aws_s3_bucket.terraform_state.id
  description = "S3 bucket for Terraform state"
}

output "terraform_locks_table" {
  value       = aws_dynamodb_table.terraform_locks.name
  description = "DynamoDB table for Terraform state locks"
}

output "backend_config" {
  value = <<EOT
# Add this to infra/backend.tf after applying:

terraform {
  backend "s3" {
    bucket         = "${aws_s3_bucket.terraform_state.id}"
    key            = "terraform.tfstate"
    region         = "${var.aws_region}"
    dynamodb_table = "${aws_dynamodb_table.terraform_locks.name}"
    encrypt        = true
  }
}

# Replace placeholder values above with actual outputs
EOT
  description = "Backend configuration template"
}
