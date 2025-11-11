# PSO_Final - Production-Ready Terraform Infrastructure

Production-grade Terraform configuration for deploying the MERN "Material Management System" on AWS.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   AWS (ap-southeast-1)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React)                  │   │
│  │  S3 Bucket (Static Files) → CloudFront (HTTPS CDN)  │   │
│  │  Custom Domain (Optional): example.com              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    BACKEND (Node/Express)            │   │
│  │  ALB (HTTPS) → ECS Fargate Tasks                    │   │
│  │  Port 5001 (Private) in VPC                          │   │
│  │  Auto-scaling: 1-3 tasks based on CPU/Memory         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  NETWORKING & SECURITY               │   │
│  │  VPC (10.0.0.0/16) with 2 AZs                        │   │
│  │  Public Subnets (2) for ALB                          │   │
│  │  Private Subnets (2) for ECS (no NAT by default)     │   │
│  │  Security Groups: ALB (80/443), ECS (5001 from ALB)  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               DATA & SECRETS MANAGEMENT              │   │
│  │  MongoDB Atlas (M0 Free) in ap-southeast-1           │   │
│  │  AWS Secrets Manager: MONGODB_URI, SESSION_SECRET    │   │
│  │  CloudWatch Logs for ECS & ALB                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              STATE MANAGEMENT & LOGS                 │   │
│  │  Terraform State: S3 + DynamoDB (remote)             │   │
│  │  ALB Access Logs: S3                                 │   │
│  │  CloudWatch: ECS, ALB, CloudFront metrics            │   │
│  │  Alarms: CPU/Memory, Unhealthy Targets, 5XX Errors   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

✅ **Backend (Node/Express)**
- ECS Fargate on private subnets (no direct internet)
- Auto-scaling (1-3 tasks, scales on CPU/Memory)
- Application Load Balancer (ALB) with HTTPS
- CloudWatch logs aggregation
- Health checks every 30s

✅ **Frontend (React)**
- S3 static file hosting (gzipped, versioned)
- CloudFront CDN with HTTPS
- SPA routing (404 → index.html)
- Cache busting for static assets (1-year TTL)
- Optional custom domain + SSL

✅ **Security**
- Least-privilege IAM roles/policies
- Secrets Manager for MONGODB_URI, SESSION_SECRET, CLOUDINARY_URL
- All secrets injected at container startup
- Security groups: 80/443 on ALB only, 5001 on ECS from ALB
- VPC isolation (public/private subnets)
- No hardcoded secrets in code/configs

✅ **Database**
- MongoDB Atlas M0 (Free) cluster
- Provisioned via mongodbatlas provider
- Auto-connects to Secrets Manager
- IP whitelisting enabled (configure in atlas.tf)

✅ **Monitoring & Logging**
- CloudWatch log groups for ECS & ALB
- CloudFront metrics tracking
- Alarms: High CPU, High Memory, Unhealthy Targets, 5XX Errors
- ALB access logs to S3

✅ **State Management**
- Remote state in S3 + DynamoDB locks
- Prevents concurrent applies
- Versioning & encryption enabled

✅ **Cost Optimization**
- Fargate Spot for additional savings (optional)
- M0 free MongoDB tier
- No NAT by default (reduce costs)
- 7-day log retention (adjustable)
- Auto-scaling to handle traffic spikes

---

## Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
# https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

# Configure credentials
aws configure
# Enter: Access Key, Secret Key, Region (ap-southeast-1), Format (json)

# Verify
aws sts get-caller-identity
```

### 2. MongoDB Atlas Account & API Key
```
1. Go to https://cloud.mongodb.com/v2/account/login
2. Create a new project (or use existing)
3. Note Organization ID (Settings → Organization Settings)
4. Create API Key:
   - Settings → Account → API Keys
   - Create API Key → Select "Organization Owner"
   - Note: Public Key, Private Key (keep private!)
5. Whitelist your IP:
   - API Keys → Actions → Edit Whitelist
   - Add your public IP (or 0.0.0.0/0 for testing)
```

### 3. Terraform Installation
```bash
# macOS/Linux
brew install terraform

# Windows (PowerShell)
choco install terraform

# Verify
terraform -v  # Should be >= 1.5.0
```

### 4. Prepare Backend Docker Image
```bash
# Build backend image locally
cd backend
docker build -t pso-backend:latest .

# Option A: Push to Docker Hub (easier for development)
docker tag pso-backend:latest akhtar2344/pso-backend:latest
docker login
docker push akhtar2344/pso-backend:latest

# Option B: Push to AWS ECR (for production)
# Create ECR repo first:
aws ecr create-repository --repository-name pso-backend --region ap-southeast-1

# Then:
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com
docker tag pso-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/pso-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/pso-backend:latest
```

### 5. Node/npm for Frontend Build
```bash
# Ensure Node.js is installed
node -v  # >= 14.x
npm -v   # >= 6.x

# Test build
cd frontend
npm install
npm run build
```

---

## Getting Started (Step-by-Step)

### Step 1: Initialize Bootstrap State (First Time Only)

The bootstrap step creates the S3 bucket and DynamoDB table for Terraform state.

```bash
cd infra/backend-state

# Initialize with local state
terraform init

# Apply bootstrap resources
terraform apply

# Note the outputs:
# - terraform_state_bucket
# - terraform_locks_table

cd ..
```

### Step 2: Create Backend Configuration

Create `infra/backend.tf` with the values from Step 1:

```hcl
terraform {
  backend "s3" {
    bucket         = "pso-final-terraform-state-123456789"  # From Step 1
    key            = "pso-final/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pso-final-terraform-locks"            # From Step 1
    encrypt        = true
  }
}
```

### Step 3: Prepare Variables

```bash
cd infra

# Copy example to working file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars  # or use your editor

# Required values:
# - container_image: Docker image URI
# - mongodb_org_id, mongodb_public_key, mongodb_private_key
# - mongodb_db_username, mongodb_db_password
# - session_secret
# - cloudinary_url (if using image uploads)
```

### Step 4: Validate & Plan

```bash
cd infra

# Initialize (download providers)
terraform init

# Validate syntax
terraform validate

# Plan changes (review before applying)
terraform plan -out=tfplan

# Review the output carefully!
```

### Step 5: Apply Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# Wait for completion (~15-20 minutes for all resources)

# Save outputs
terraform output > outputs.txt

# Capture key values:
terraform output alb_dns_name
terraform output cloudfront_domain_name
terraform output s3_frontend_bucket
```

### Step 6: Verify Deployment

```bash
# Check ECS cluster
aws ecs list-clusters --region ap-southeast-1

# Check ALB status
aws elbv2 describe-load-balancers --region ap-southeast-1

# Check CloudFront distribution
aws cloudfront list-distributions

# Monitor logs (wait ~5 min for first logs)
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

---

## Post-Deployment: Deploy Application Code

### Option 1: Deploy Frontend

```bash
# Build React app
cd frontend
npm install
npm run build

# Upload to S3
BUCKET=$(cd ../infra && terraform output -raw s3_frontend_bucket)
aws s3 sync build/ s3://$BUCKET/ --delete --region ap-southeast-1

# Invalidate CloudFront cache
DIST_ID=$(cd ../infra && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*" --region ap-southeast-1

# Access frontend
echo "https://$(cd ../infra && terraform output -raw cloudfront_domain_name)"
```

### Option 2: Deploy Backend (Force ECS Redeploy)

If you update the Docker image in ECR/Docker Hub:

```bash
cd infra

# Update container_image in terraform.tfvars
nano terraform.tfvars

# Update ECS task definition
terraform plan -out=tfplan
terraform apply tfplan

# Or force a new deployment without changing Terraform
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region ap-southeast-1

# Monitor logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

---

## Testing

### Test API Health Check

```bash
# Get ALB DNS
ALB_DNS=$(cd infra && terraform output -raw alb_dns_name)

# Test (self-signed cert warning is expected)
curl -k https://$ALB_DNS/api/auth/register

# Expected: 404 or similar (not connection refused)
```

### Test Frontend

```bash
# Get CloudFront domain
CF_DOMAIN=$(cd infra && terraform output -raw cloudfront_domain_name)

# Open in browser
echo "https://$CF_DOMAIN"

# Check CloudFront cache
curl -I https://$CF_DOMAIN/ | grep CloudFront
```

### View Logs

```bash
# Backend logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1

# ALB logs (in S3)
S3_BUCKET=$(cd infra && terraform output -raw s3_alb_logs_bucket)
aws s3 ls s3://$S3_BUCKET/alb-logs/ --region ap-southeast-1

# CloudWatch alarms
aws cloudwatch describe-alarms --region ap-southeast-1
```

---

## Rotating Secrets

### Update MongoDB Password

```bash
cd infra

# Update variable
nano terraform.tfvars
# Edit: mongodb_db_password = "new_password"

# Apply changes
terraform plan -out=tfplan
terraform apply tfplan

# Force ECS redeploy (to pick up new secret)
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region ap-southeast-1
```

### Update Session Secret

```bash
cd infra

# Generate new secret
openssl rand -base64 32

# Update terraform.tfvars
nano terraform.tfvars
# Edit: session_secret = "new_secret_here"

# Apply
terraform plan
terraform apply

# Force ECS redeploy
aws ecs update-service --cluster $(terraform output -raw ecs_cluster_name) --service $(terraform output -raw ecs_service_name) --force-new-deployment --region ap-southeast-1
```

---

## Scaling

### Manual Scaling

```bash
cd infra

# Edit terraform.tfvars
nano terraform.tfvars
# Change: desired_count = 3

# Apply
terraform plan
terraform apply
```

### Auto-Scaling (Automatic)

The module includes auto-scaling policies:
- **CPU**: Scales up when avg CPU > 70% for 2 consecutive 5-min periods
- **Memory**: Scales up when avg memory > 80% for 2 consecutive 5-min periods
- **Min**: 1 task, **Max**: 3 tasks

Monitor scaling:

```bash
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --region ap-southeast-1
```

---

## Debugging

### View ECS Task Logs

```bash
# List running tasks
aws ecs list-tasks --cluster pso-final-backend --region ap-southeast-1

# Get task details
aws ecs describe-tasks \
  --cluster pso-final-backend \
  --tasks <task-arn> \
  --region ap-southeast-1

# View logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

### Check ALB Target Health

```bash
ALB_ARN=$(cd infra && terraform output -raw alb_arn)
TG_ARN=$(cd infra && terraform output -raw alb_target_group_arn)

aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --region ap-southeast-1
```

### Verify Secrets in Secrets Manager

```bash
# List secrets
aws secretsmanager list-secrets --region ap-southeast-1

# View secret (without value)
aws secretsmanager describe-secret \
  --secret-id pso-final/mongodb-uri \
  --region ap-southeast-1

# Note: Cannot view actual values (by design for security)
```

---

## Cleanup & Destruction

### Destroy All Infrastructure

**WARNING**: This will delete ALL resources, including databases. Use only if you want to stop incurring costs.

```bash
cd infra

# Plan destruction
terraform destroy -auto-approve

# Wait for completion (~10 minutes)

# Verify CloudFormation stacks are deleted
aws cloudformation list-stacks --region ap-southeast-1 --query 'StackSummaries[?StackStatus==`DELETE_COMPLETE`]'
```

### Destroy Specific Resources

```bash
cd infra

# Destroy only MongoDB Atlas
terraform destroy -target="module.mongodb_atlas" -auto-approve

# Destroy only ALB
terraform destroy -target="aws_lb.backend_alb" -auto-approve
```

### Keep State, Destroy Resources

If you want to preserve Terraform state but destroy infrastructure:

```bash
cd infra

# Remove resources from state without deleting them
terraform state rm aws_lb.backend_alb
terraform state rm aws_cloudfront_distribution.frontend

# This requires manual cleanup in AWS console
```

---

## Cost Estimation

### Monthly Costs (Approximate, ap-southeast-1)

| Service | Config | Cost |
|---------|--------|------|
| ECS Fargate | 1 task (512 CPU, 1GB RAM) | $9-15 |
| ALB | Always on | $16 |
| CloudFront | 10 GB/month | $1-5 |
| S3 (Frontend) | 100 MB + requests | $1-2 |
| S3 (Logs) | 1 GB logs | <$1 |
| MongoDB Atlas | M0 (Free) | $0 |
| CloudWatch | Logs (7-day retention) | $1-2 |
| VPC | Minimal usage | <$1 |
| **Total** | | **~$30-45/month** |

### Cost Optimization Tips

1. **Enable NAT only if needed** (adds $32/month)
2. **Use CloudFront for static assets** (reduces ALB bandwidth)
3. **Reduce log retention** to 3-5 days
4. **Use Fargate Spot** for non-critical workloads (up to 70% savings)
5. **Consolidate AZs** if not needed for HA
6. **Close unused ALBs** immediately

---

## Security Checklist

- [ ] Secrets in Secrets Manager (not in code/config)
- [ ] IAM roles with least privilege
- [ ] Security groups restrict access (80/443 on ALB, 5001 on ECS)
- [ ] HTTPS everywhere (ALB, CloudFront)
- [ ] VPC with private subnets for ECS
- [ ] No public IP on ECS tasks
- [ ] S3 bucket access via CloudFront OAI (not direct)
- [ ] Enable CloudTrail for audit logging
- [ ] Enable VPC Flow Logs for network debugging
- [ ] Rotate secrets periodically
- [ ] Monitor CloudWatch alarms
- [ ] Review IAM policies monthly

---

## Troubleshooting

### ALB Shows Unhealthy Targets

```bash
# Check target health
TG_ARN=$(cd infra && terraform output -raw alb_target_group_arn)
aws elbv2 describe-target-health --target-group-arn $TG_ARN --region ap-southeast-1

# Common causes:
# 1. Task not running (check ECS service)
# 2. Health check path wrong (change in ecs.tf)
# 3. Security group blocks ALB (check sg rules)
# 4. App not responding on health check path
```

### ECS Tasks Keep Stopping

```bash
# Check logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1

# Common causes:
# 1. Out of memory (increase container_memory)
# 2. Unhandled exceptions (check app code)
# 3. Missing secrets (verify in Secrets Manager)
# 4. Network issues (check security groups, VPC)
```

### CloudFront Returns 403/404

```bash
# Check CloudFront origin
aws cloudfront get-distribution --id $(cd infra && terraform output -raw cloudfront_distribution_id) --region ap-southeast-1

# Common causes:
# 1. S3 bucket policy missing (check s3_cloudfront_frontend.tf)
# 2. OAI not properly set up (check OAI in CloudFront distribution)
# 3. SPA routing not configured (check custom_error_response)
```

### Terraform State Locked

```bash
# If you get "Error acquiring the lock", someone else is applying
# Wait ~30 minutes for lock to expire, or:

aws dynamodb scan --table-name pso-final-terraform-locks --region ap-southeast-1

# Manually delete lock (use only if safe):
aws dynamodb delete-item \
  --table-name pso-final-terraform-locks \
  --key '{"LockID": {"S": "pso-final/terraform.tfstate"}}' \
  --region ap-southeast-1
```

---

## File Structure

```
infra/
├── main.tf                          # Data sources, MongoDB module
├── versions.tf                      # Provider versions
├── providers.tf                     # Provider configuration
├── variables.tf                     # Input variables
├── outputs.tf                       # Output values
├── vpc.tf                           # VPC, subnets, security groups
├── ecs.tf                           # ECS cluster, task definition, service
├── alb.tf                           # ALB, listeners, target groups, HTTPS
├── s3_cloudfront_frontend.tf        # S3, CloudFront, SPA routing
├── secrets.tf                       # AWS Secrets Manager
├── iam.tf                           # IAM roles, policies
├── cloudwatch.tf                    # Log groups, alarms
├── terraform.tfvars.example         # Example variables
├── backend.tf                       # (Create after Step 2)
├── backend-state/
│   ├── main.tf                      # (local state for bootstrap)
│   ├── state.tf                     # S3 bucket, DynamoDB table
│   └── outputs.tf                   # (auto-generated)
└── mongodbatlas/
    ├── atlas.tf                     # MongoDB cluster, user
    ├── variables.tf                 # Module variables
    └── outputs.tf                   # Connection string
```

---

## Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform MongoDB Atlas Provider](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs)
- [AWS ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-cpu-memory-error.html)
- [MongoDB Atlas M0 Limitations](https://docs.mongodb.com/manual/reference/free-tier/)
- [CloudFront SPA Routing](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-web-values-specify.html)
- [AWS Security Best Practices](https://docs.aws.amazon.com/security/)

---

## Support

For issues:
1. Check Terraform logs: `TF_LOG=DEBUG terraform apply`
2. View AWS service logs in CloudWatch
3. Check MongoDB Atlas docs for DB issues
4. Review AWS documentation for service-specific problems

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Maintained By**: Akhtar Widodo
