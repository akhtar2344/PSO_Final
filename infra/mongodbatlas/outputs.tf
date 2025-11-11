output "project_id" {
  value = mongodbatlas_project.main.id
}

output "cluster_name" {
  value = mongodbatlas_cluster.main.name
}

output "cluster_id" {
  value = mongodbatlas_cluster.main.id
}

output "connection_string" {
  value     = local.connection_string
  sensitive = true
}

output "srv_address" {
  value = mongodbatlas_cluster.main.connection_strings[0].standard_srv
}

output "standard_address" {
  value = mongodbatlas_cluster.main.connection_strings[0].standard
}
