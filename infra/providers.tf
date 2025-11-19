# Provider utama (region project)
provider "aws" {
  region  = var.aws_region
  profile = "akhtar"

  default_tags {
    tags = {
      Project   = var.project_name
      Owner     = "Akhtar"
      Env       = "dev"
      ManagedBy = "Terraform"
    }
  }
}

# Provider alias khusus us-east-1 (wajib untuk CloudFront ACM)
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "akhtar"
}

# MongoDB Atlas provider
provider "mongodbatlas" {
  public_key  = var.mongodb_public_key
  private_key = var.mongodb_private_key
}
