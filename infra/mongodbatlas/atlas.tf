# MongoDB Atlas M0 (Free) cluster provisioning

resource "mongodbatlas_project" "main" {
  name   = var.project_name
  org_id = var.mongodb_org_id
}

resource "mongodbatlas_cluster" "main" {
  project_id   = mongodbatlas_project.main.id
  name         = var.mongodb_cluster_name
  provider_name = "AWS"
  provider_region_name = "AP_SOUTHEAST_1"
  cluster_type = "REPLICASET"
  
  # M0 Free tier configuration
  backing_provider_name = "AWS"
  provider_instance_size_name = "M0"

  # Disable backups for free tier
  auto_scaling_disk_gb_enabled = false
  auto_scaling_compute_enabled = false

  tags = {
    Name = "${var.project_name}-mongodb"
    Env  = "dev"
  }
}

# Database user
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

# IP Whitelist - allow all (0.0.0.0/0) for development
# In production, restrict to specific IPs or use VPC peering
resource "mongodbatlas_project_ip_access_list" "all" {
  project_id = mongodbatlas_project.main.id
  cidr_block = "0.0.0.0/0"
  comment    = "Allow all (dev environment)"
}

# Construct connection string
locals {
  connection_string = "mongodb+srv://${var.mongodb_db_username}:${urlencode(var.mongodb_db_password)}@${mongodbatlas_cluster.main.connection_strings[0].standard_srv}/?retryWrites=true&w=majority&appName=${var.project_name}"
}
