variable "project_name" {
  description = "Project name"
  type        = string
}

variable "mongodb_org_id" {
  description = "MongoDB Atlas Organization ID"
  type        = string
  sensitive   = true
}

variable "mongodb_cluster_name" {
  description = "MongoDB Atlas cluster name"
  type        = string
}

variable "mongodb_db_username" {
  description = "MongoDB database username"
  type        = string
  sensitive   = true
}

variable "mongodb_db_password" {
  description = "MongoDB database password"
  type        = string
  sensitive   = true
}
