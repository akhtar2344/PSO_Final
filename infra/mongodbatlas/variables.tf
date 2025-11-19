variable "project_name" {
  description = "Project name for MongoDB Atlas resources"
  type        = string
}

variable "mongodb_org_id" {
  description = "MongoDB Atlas Organization ID"
  type        = string
  sensitive   = true
}

variable "mongodb_cluster_name" {
  description = "Cluster name in MongoDB Atlas"
  type        = string
}

variable "mongodb_db_username" {
  description = "MongoDB Atlas database username"
  type        = string
  sensitive   = true
}

variable "mongodb_db_password" {
  description = "MongoDB Atlas database user password"
  type        = string
  sensitive   = true
}
