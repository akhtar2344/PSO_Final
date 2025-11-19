terraform {
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.15"
    }
  }
}

#############################################
# MongoDB Atlas Project
#############################################

resource "mongodbatlas_project" "main" {
  name   = var.project_name
  org_id = var.mongodb_org_id
}

#############################################
# MongoDB Atlas Cluster (M0 Free Tier)
#############################################

resource "mongodbatlas_cluster" "main" {
  project_id                = mongodbatlas_project.main.id
  name                      = var.mongodb_cluster_name

  provider_name             = "AWS"
  provider_region_name      = "AP_SOUTHEAST_1"
  backing_provider_name     = "AWS"
  provider_instance_size_name = "M0"

  cluster_type              = "REPLICASET"

  auto_scaling_disk_gb_enabled = false
  auto_scaling_compute_enabled = false
}

#############################################
# MongoDB User
#############################################

resource "mongodbatlas_database_user" "main" {
  username           = var.mongodb_db_username
  password           = var.mongodb_db_password
  project_id         = mongodbatlas_project.main.id
  auth_database_name = "admin"

  roles {
    role_name     = "readWriteAnyDatabase"
    database_name = "admin"
  }

  scopes {
    name = mongodbatlas_cluster.main.name
    type = "CLUSTER"
  }
}

#############################################
# IP Access List (Allow All for Dev)
#############################################

resource "mongodbatlas_project_ip_access_list" "all" {
  project_id = mongodbatlas_project.main.id
  cidr_block = "0.0.0.0/0"
  comment    = "Allow all IPs for development"
}

#############################################
# Connection String
#############################################

locals {
  mongodb_connection = "mongodb+srv://${var.mongodb_db_username}:${urlencode(var.mongodb_db_password)}@${mongodbatlas_cluster.main.connection_strings[0].standard_srv}/?retryWrites=true&w=majority"
}

#############################################
# Module Outputs
#############################################

output "mongodb_project_id" {
  value = mongodbatlas_project.main.id
}

output "mongodb_cluster_name" {
  value = mongodbatlas_cluster.main.name
}

output "mongodb_connection_string" {
  value     = local.mongodb_connection
  sensitive = true
}
