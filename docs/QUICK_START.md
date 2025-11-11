# Quick Start Guide - 10 Minutes to Production

Complete guide to deploy PSO_Final MERN app on AWS with Terraform in ~10 minutes of execution time (plus 15-20 min for infrastructure to come online).

## Prerequisites (Install First)

```powershell
# PowerShell (Windows)

# 1. Install Terraform
choco install terraform

# 2. Install AWS CLI
choco install awscli

# 3. Install Docker
choco install docker-desktop

# Verify installations
terraform -v
aws --version
docker --version
```

On **macOS/Linux**:

```bash
# Using Homebrew
brew install terraform awscli docker

# Verify
terraform -v
aws --version
docker --version
```

## Step 1: Prepare AWS Credentials (2 min)

```powershell
# Configure AWS CLI
aws configure

# Enter when prompted:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region: ap-southeast-1
# Default output format: json

# Verify connection
aws sts get-caller-identity
```

## Step 2: Get MongoDB Atlas Keys (3 min)

1. Go to https://cloud.mongodb.com/v2/account/login
2. Create project or use existing one
3. Note **Organization ID** (Settings → Organization Settings)
4. Create **API Key**:
   - Settings → Account → API Keys
   - Create API Key
   - Copy **Public Key** and **Private Key**
   - Keep Private Key safe!
5. Whitelist IP:
   - API Keys → Your Key → Actions → Edit Whitelist
   - Add your public IP (or 0.0.0.0/0 for testing)

## Step 3: Bootstrap Terraform State (3 min)

```powershell
cd infra/backend-state

terraform init
terraform apply -auto-approve

# Save these outputs:
$STATE_BUCKET = terraform output -raw terraform_state_bucket
$LOCKS_TABLE = terraform output -raw terraform_locks_table

Write-Host "State Bucket: $STATE_BUCKET"
Write-Host "Locks Table: $LOCKS_TABLE"

cd ..
```

## Step 4: Create Backend Configuration (1 min)

Create `infra/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "pso-final-terraform-state-123456789"  # From Step 3
    key            = "pso-final/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pso-final-terraform-locks"            # From Step 3
    encrypt        = true
  }
}
```

Then initialize:

```powershell
cd infra
terraform init
# Answer "yes" to migrate state
```

## Step 5: Prepare Variables (2 min)

```powershell
cd infra

# Copy example
Copy-Item terraform.tfvars.example terraform.tfvars

# Edit with your values
notepad terraform.tfvars

# Required values to fill in:
# - container_image: akhtar2344/pso-backend:latest
# - mongodb_org_id: (from Step 2)
# - mongodb_public_key: (from Step 2)
# - mongodb_private_key: (from Step 2)
# - mongodb_db_username: admin
# - mongodb_db_password: YourSecurePassword123!
# - session_secret: (generate with: openssl rand -base64 32)
```

Generate secure passwords:

```powershell
# For MongoDB password
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# For session secret
$bytes2 = New-Object Byte[] 32
$rng.GetBytes($bytes2)
[Convert]::ToBase64String($bytes2)
```

## Step 6: Validate & Deploy (5 min execution)

```powershell
cd infra

# Validate
terraform validate

# Plan
terraform plan -out=tfplan

# Review output, then apply
terraform apply tfplan

# Takes ~15-20 minutes to complete

# Save outputs
terraform output | tee outputs.txt
```

## Step 7: Deploy Application Code (3 min)

### Build & Push Backend Image

```powershell
cd backend
docker build -t pso-backend:latest .

# Push to Docker Hub
docker login
docker tag pso-backend:latest akhtar2344/pso-backend:latest
docker push akhtar2344/pso-backend:latest

# Trigger ECS update
cd ../infra
$CLUSTER = terraform output -raw ecs_cluster_name
$SERVICE = terraform output -raw ecs_service_name

aws ecs update-service `
  --cluster $CLUSTER `
  --service $SERVICE `
  --force-new-deployment `
  --region ap-southeast-1
```

### Deploy Frontend

```powershell
cd frontend
npm install
npm run build

cd ../infra
$BUCKET = terraform output -raw s3_frontend_bucket

aws s3 sync ../frontend/build/ s3://$BUCKET/ --delete --region ap-southeast-1

# Invalidate CloudFront
$DIST_ID = terraform output -raw cloudfront_distribution_id

aws cloudfront create-invalidation `
  --distribution-id $DIST_ID `
  --paths "/*" `
  --region ap-southeast-1
```

## Step 8: Verify Deployment (2 min)

```powershell
cd infra

# Get URLs
$ALB_DNS = terraform output -raw alb_dns_name
$CF_DOMAIN = terraform output -raw cloudfront_domain_name

Write-Host "Backend API: https://$ALB_DNS"
Write-Host "Frontend: https://$CF_DOMAIN"

# Test API (ignore cert warning)
curl.exe -k https://$ALB_DNS/api/auth/register

# View logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

Open in browser:
- Frontend: `https://<cloudfront-domain>`
- API endpoint: `https://<alb-dns>`

## Troubleshooting

### "Error: Failed to retrieve state..."
→ Check AWS credentials: `aws sts get-caller-identity`

### "Error: MongoDB org not found"
→ Check MongoDB API keys in terraform.tfvars

### "Unhealthy targets" on ALB
→ Wait 2-3 minutes, then check: `aws ecs describe-tasks --cluster pso-final-backend --region ap-southeast-1`

### "CloudFront returns 403"
→ Reapply: `terraform apply -target=aws_cloudfront_distribution.frontend`

### Docker push fails
→ Check Docker login: `docker login` (use Docker Hub credentials)

## Cleanup (If Needed)

```powershell
cd infra

# Destroy all resources
terraform destroy -auto-approve

# Confirms deletion of:
# - ECS cluster, tasks, service
# - ALB, target groups
# - CloudFront distribution
# - S3 buckets
# - MongoDB Atlas cluster
# - Secrets Manager secrets
# - VPC, subnets, security groups
# - IAM roles/policies
# - CloudWatch logs

# WARNING: This deletes everything!
```

## Next Steps

1. **Monitor**: Check CloudWatch dashboards
2. **Scale**: Adjust `desired_count` in terraform.tfvars for more instances
3. **Custom Domain**: Set `domain_name` in terraform.tfvars for HTTPS + Route53
4. **Update Code**: Push new Docker images and re-run ECS deployment
5. **Rotate Secrets**: Update passwords in terraform.tfvars and redeploy

## Cost Breakdown

| Service | Monthly |
|---------|---------|
| ECS Fargate (1 task) | $12 |
| ALB | $16 |
| CloudFront (10GB) | $3 |
| S3, MongoDB, CloudWatch, VPC | $2 |
| **Total** | **~$33** |

Disable NAT (default) to avoid $32 extra per month.

## Files Created

```
infra/
├── README.md                    # Full documentation
├── DEPLOYMENT_GUIDE.md          # Step-by-step deployment
├── terraform.tfvars.example     # Example variables
├── backend.tf                   # (Create in Step 4)
├── versions.tf                  # Provider versions
├── providers.tf                 # Provider config
├── variables.tf                 # Input variables
├── outputs.tf                   # Outputs
├── main.tf                      # MongoDB module reference
├── vpc.tf                       # VPC + security groups
├── ecs.tf                       # Backend (Node/Express)
├── alb.tf                       # ALB + HTTPS
├── s3_cloudfront_frontend.tf    # Frontend (React)
├── secrets.tf                   # Secrets Manager
├── iam.tf                       # IAM roles/policies
├── cloudwatch.tf                # Monitoring/alarms
├── backend-state/
│   ├── state.tf                 # S3 + DynamoDB
│   └── (other files)
└── mongodbatlas/
    ├── atlas.tf                 # MongoDB cluster
    ├── variables.tf             # Module variables
    └── outputs.tf               # Module outputs
```

## Quick Commands

```powershell
# View outputs
cd infra && terraform output -json | jq .

# Monitor ECS logs
aws logs tail /ecs/pso-final-backend --follow

# Check ALB health
aws elbv2 describe-target-health --target-group-arn $(cd infra && terraform output -raw alb_target_group_arn) --region ap-southeast-1

# Force ECS redeploy (for new image)
aws ecs update-service --cluster pso-final-backend --service pso-final-backend-service --force-new-deployment --region ap-southeast-1

# Invalidate CloudFront (for updated frontend)
aws cloudfront create-invalidation --distribution-id $(cd infra && terraform output -raw cloudfront_distribution_id) --paths "/*"

# Destroy everything
cd infra && terraform destroy -auto-approve
```

## Support

- Full docs: See `README.md`
- Deployment walkthrough: See `DEPLOYMENT_GUIDE.md`
- AWS docs: https://docs.aws.amazon.com/
- Terraform docs: https://www.terraform.io/docs

---

**Time to Deploy**: ~30 minutes (10 min setup + 20 min infrastructure provisioning)

**Start Time**: 5 minutes from now!
