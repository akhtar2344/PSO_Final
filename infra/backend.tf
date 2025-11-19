terraform {
  backend "s3" {
    bucket         = "pso-final-terraform-state-599525540225"
    key            = "terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pso-final-terraform-locks"
    encrypt        = true
  }
}
