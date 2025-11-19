data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

module "mongodb_atlas" {
  source = "./mongodbatlas"

  project_name         = var.project_name
  mongodb_org_id       = var.mongodb_org_id
  mongodb_cluster_name = var.mongodb_cluster_name
  mongodb_db_username  = var.mongodb_db_username
  mongodb_db_password  = var.mongodb_db_password
}
