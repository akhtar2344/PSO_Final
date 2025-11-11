provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project = var.project_name
      Owner   = "Akhtar"
      Env     = "dev"
      ManagedBy = "Terraform"
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.mongodb_public_key
  private_key = var.mongodb_private_key
}
