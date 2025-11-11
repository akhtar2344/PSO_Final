data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# MongoDB Atlas module
module "mongodb_atlas" {
  source = "./mongodbatlas"

  project_name           = var.project_name
  mongodb_org_id         = var.mongodb_org_id
  mongodb_cluster_name   = var.mongodb_cluster_name
  mongodb_db_username    = var.mongodb_db_username
  mongodb_db_password    = var.mongodb_db_password
}

# Provider for us-east-1 (required for CloudFront certificates)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
      configuration_aliases = [aws.us_east_1]
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = var.project_name
      Owner     = "Akhtar"
      Env       = "dev"
      ManagedBy = "Terraform"
    }
  }
}
