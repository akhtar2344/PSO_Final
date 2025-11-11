# Terraform Validation & Deployment Checklist

## Pre-Deployment Validation

Run these commands in the `infra/` directory to validate before deploying.

### 1. Syntax Validation

```bash
cd infra

# Validate all Terraform files
terraform validate

# Expected output:
# Success! The configuration is valid.
```

### 2. Format Check

```bash
# Check code formatting
terraform fmt -check -recursive

# Auto-fix formatting
terraform fmt -recursive

# This ensures consistent code style across all modules
```

### 3. Plan Review

```bash
# Generate and review the plan
terraform plan -out=tfplan

# This will show:
# - 50-60 resources to create
# - Dependencies between resources
# - Estimated time
# - Any errors or warnings

# Review carefully for:
# - Correct region (ap-southeast-1)
# - Correct instance sizes
# - Correct security group rules
# - Correct domain names
```

### 4. Security Validation

```bash
# Check for hardcoded secrets (none should be found)
grep -r "AKIA" .          # AWS Access Keys
grep -r "password" *.tf   # Should only be in variables.tf
grep -r "secret" *.tf     # Should only be in variables.tf

# All secrets must come from terraform.tfvars (which is .gitignored)
```

### 5. Variable Validation

```bash
# Check required variables are set
terraform plan -var-file=terraform.tfvars

# Verify these variables are defined:
# - project_name
# - aws_region
# - container_image
# - mongodb_org_id
# - mongodb_public_key
# - mongodb_private_key
# - mongodb_db_username
# - mongodb_db_password
# - session_secret
```

---

## Deployment Steps

### Step 1: Bootstrap Remote State (First Time Only)

```bash
cd infra/backend-state

# Initialize local state
terraform init

# Create S3 + DynamoDB for remote state
terraform apply

# Capture outputs:
terraform output terraform_state_bucket
terraform output terraform_locks_table

cd ..
```

### Step 2: Configure Remote Backend

Create `infra/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "pso-final-terraform-state-<your-account-id>"
    key            = "pso-final/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "pso-final-terraform-locks"
    encrypt        = true
  }
}
```

Then initialize with remote state:

```bash
cd infra
terraform init

# When prompted: "Do you want to copy existing state to the new backend?"
# Answer: yes
```

### Step 3: Prepare Variables

```bash
cd infra

# Copy example to working file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
# Required:
# - container_image (Docker Hub or ECR)
# - mongodb_org_id
# - mongodb_public_key
# - mongodb_private_key
# - mongodb_db_username
# - mongodb_db_password
# - session_secret
```

### Step 4: Validate & Plan

```bash
cd infra

# Validate Terraform syntax
terraform validate
# Expected: Success! The configuration is valid.

# Generate plan
terraform plan -out=tfplan

# Review output carefully!
# Should show ~50-60 resources to create
```

### Step 5: Apply Infrastructure

```bash
cd infra

# Apply the plan
terraform apply tfplan

# Expected time: 15-20 minutes
# Watch for any errors

# Once complete:
terraform output > deployment_outputs.txt

# Save these values:
echo "=== DEPLOYMENT OUTPUTS ==="
terraform output -json | jq .
```

### Step 6: Verify Deployment

Wait 5-10 minutes for services to stabilize, then:

```bash
# Check ECS cluster
aws ecs describe-clusters \
  --clusters pso-final-backend \
  --region ap-southeast-1 \
  --query 'clusters[0].{Name:clusterName,Status:status,RunningCount:runningCount,PendingCount:pendingCount}'

# Check ECS service
aws ecs describe-services \
  --cluster pso-final-backend \
  --services pso-final-backend-service \
  --region ap-southeast-1 \
  --query 'services[0].{Name:serviceName,Status:status,DesiredCount:desiredCount,RunningCount:runningCount}'

# Check ALB
aws elbv2 describe-load-balancers \
  --region ap-southeast-1 \
  --query 'LoadBalancers[?LoadBalancerName==`pso-final-alb`]'

# Check CloudFront
aws cloudfront list-distributions \
  --query 'DistributionList.Items[0].{Id:Id,Status:Status,DomainName:DomainName}'

# Check MongoDB Atlas
aws secretsmanager describe-secret \
  --secret-id pso-final/mongodb-uri \
  --region ap-southeast-1
```

---

## Post-Deployment: Application Deployment

### Build & Push Backend Image

```bash
# Build image
cd backend
docker build -t pso-backend:latest .

# Push to Docker Hub (easier for dev)
docker login
docker tag pso-backend:latest akhtar2344/pso-backend:latest
docker push akhtar2344/pso-backend:latest

# OR push to ECR (for production)
# aws ecr create-repository --repository-name pso-backend --region ap-southeast-1
# docker tag pso-backend:latest <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/pso-backend:latest
# docker push <ACCOUNT_ID>.dkr.ecr.ap-southeast-1.amazonaws.com/pso-backend:latest
```

### Deploy Backend (Update ECS)

```bash
cd infra

# If using Docker Hub image:
# The image is already pulled, just trigger a new deployment

CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region ap-southeast-1

# Monitor rollout
aws ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region ap-southeast-1 \
  --query 'services[0].deployments'

# View logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

### Deploy Frontend

```bash
cd frontend

# Build React app
npm install
npm run build

# Upload to S3
cd ../infra
BUCKET=$(terraform output -raw s3_frontend_bucket)

aws s3 sync ../frontend/build/ s3://$BUCKET/ \
  --delete \
  --region ap-southeast-1

# Invalidate CloudFront cache
DIST_ID=$(terraform output -raw cloudfront_distribution_id)

aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*" \
  --region ap-southeast-1

# Verify
echo "Frontend: https://$(terraform output -raw cloudfront_domain_name)"
```

---

## Testing Deployment

### Test API Endpoint

```bash
# Get ALB DNS
ALB_DNS=$(cd infra && terraform output -raw alb_dns_name)

# Test health check endpoint
curl -v -k https://$ALB_DNS/api/auth/register
# Expected: 400+ (method not allowed or similar, not connection refused)

# Test from CloudWatch logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

### Test Frontend

```bash
# Get CloudFront domain
CF_DOMAIN=$(cd infra && terraform output -raw cloudfront_domain_name)

# Open in browser
echo "https://$CF_DOMAIN"

# Check cache headers
curl -I https://$CF_DOMAIN/ | grep -E 'CloudFront|Cache-Control|ETag'

# Expected:
# - Via: X.X CloudFront
# - X-Cache: Hit from cloudfront
# - Cache-Control: max-age=300
```

### Test Secrets Injection

```bash
# Connect to running ECS task and verify secrets
TASK_ID=$(aws ecs list-tasks \
  --cluster pso-final-backend \
  --region ap-southeast-1 \
  --query 'taskArns[0]' \
  --output text | awk -F'/' '{print $NF}')

# Execute command in task
aws ecs execute-command \
  --cluster pso-final-backend \
  --task $TASK_ID \
  --container pso-final-backend \
  --interactive \
  --command "/bin/sh" \
  --region ap-southeast-1

# Inside task shell:
env | grep MONGODB_URI   # Should show MongoDB connection string
env | grep SESSION_SECRET
env | grep NODE_ENV      # Should be 'dev'
```

---

## Monitoring & Alerts

### View CloudWatch Dashboards

```bash
# List available alarms
aws cloudwatch describe-alarms --region ap-southeast-1 --query 'MetricAlarms[*].AlarmName'

# Expected alarms:
# - pso-final-ecs-cpu-high
# - pso-final-ecs-memory-high
# - pso-final-alb-unhealthy-targets
# - pso-final-alb-5xx-errors
# - pso-final-cloudfront-4xx-errors
# - pso-final-cloudfront-5xx-errors
```

### Create CloudWatch Dashboard (Manual)

```bash
aws cloudwatch put-dashboard \
  --dashboard-name "PSO-Final-Dashboard" \
  --dashboard-body file://dashboard.json
```

Create `dashboard.json`:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ECS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "MemoryUtilization", { "stat": "Average" } ],
          [ "AWS/ApplicationELB", "HTTPCode_Target_5XX_Count" ],
          [ "AWS/CloudFront", "4xxErrorRate" ],
          [ "AWS/CloudFront", "5xxErrorRate" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-southeast-1",
        "title": "PSO Final - Infrastructure Metrics"
      }
    }
  ]
}
```

### Check Logs

```bash
# ECS logs
aws logs tail /ecs/pso-final-backend --follow --since 1h --region ap-southeast-1

# ALB logs (in S3)
BUCKET=$(cd infra && terraform output -raw s3_alb_logs_bucket)
aws s3 ls s3://$BUCKET/alb-logs/ --recursive --region ap-southeast-1

# Get latest ALB log file
LATEST=$(aws s3 ls s3://$BUCKET/alb-logs/ --recursive | tail -1 | awk '{print $4}')
aws s3 cp s3://$BUCKET/$LATEST ./alb-logs.txt --region ap-southeast-1
cat ./alb-logs.txt
```

---

## Rotation & Updates

### Rotate MongoDB Password

```bash
cd infra

# Update terraform.tfvars
nano terraform.tfvars
# Change: mongodb_db_password = "new_secure_password"

# Plan changes
terraform plan -out=tfplan

# Apply
terraform apply tfplan

# Force ECS redeploy
CLUSTER=$(terraform output -raw ecs_cluster_name)
SERVICE=$(terraform output -raw ecs_service_name)

aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --force-new-deployment \
  --region ap-southeast-1

# Verify
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1
```

### Update Backend Image

```bash
cd backend

# Make code changes...

# Build new image
docker build -t pso-backend:v2 .

# Push to Docker Hub
docker push akhtar2344/pso-backend:v2

# Update Terraform
cd ../infra
nano terraform.tfvars
# Change: container_image = "akhtar2344/pso-backend:v2"

# Deploy
terraform plan -out=tfplan
terraform apply tfplan

# ECS service will automatically redeploy with new image
```

### Update Frontend

```bash
cd frontend

# Make code changes...

# Build
npm run build

# Upload to S3
cd ../infra
BUCKET=$(terraform output -raw s3_frontend_bucket)

aws s3 sync ../frontend/build/ s3://$BUCKET/ --delete --region ap-southeast-1

# Invalidate CloudFront
DIST_ID=$(terraform output -raw cloudfront_distribution_id)

aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths "/*" \
  --region ap-southeast-1
```

---

## Troubleshooting

### ECS Task Won't Start

```bash
# Check logs
aws logs tail /ecs/pso-final-backend --follow --region ap-southeast-1

# Common errors:
# 1. "Unable to pull image": Wrong Docker image URI
# 2. "OutOfMemory": Increase container_memory in terraform.tfvars
# 3. "Command exited with code 1": App startup error, check logs

# Check task status
aws ecs describe-tasks \
  --cluster pso-final-backend \
  --tasks $(aws ecs list-tasks --cluster pso-final-backend --query 'taskArns[0]' --output text) \
  --region ap-southeast-1 \
  --query 'tasks[0].{Status:lastStatus,StoppedReason:stoppedReason}'
```

### ALB Shows Unhealthy Targets

```bash
# Check target health
TG_ARN=$(cd infra && terraform output -raw alb_target_group_arn)

aws elbv2 describe-target-health \
  --target-group-arn $TG_ARN \
  --region ap-southeast-1

# Common causes:
# 1. Task still starting up (wait 2-3 minutes)
# 2. App not responding on health check path (check ecs.tf)
# 3. Security group blocks port 5001 (check vpc.tf)
# 4. App crashed (check logs)
```

### CloudFront Returns 403

```bash
# Check distribution origin
DIST_ID=$(cd infra && terraform output -raw cloudfront_distribution_id)

aws cloudfront get-distribution \
  --id $DIST_ID \
  --region ap-southeast-1 \
  --query 'Distribution.DistributionConfig.Origins'

# Common causes:
# 1. S3 bucket policy missing (rebuild infrastructure)
# 2. OAI not properly configured
# 3. Bucket versioning issue

# Fix: Rebuild CloudFront distribution
terraform destroy -target=aws_cloudfront_distribution.frontend -auto-approve
terraform apply -target=aws_cloudfront_distribution.frontend
```

### Terraform State Locked

```bash
# Check locks
aws dynamodb scan \
  --table-name pso-final-terraform-locks \
  --region ap-southeast-1

# Force unlock (if safe):
aws dynamodb delete-item \
  --table-name pso-final-terraform-locks \
  --key '{"LockID": {"S": "pso-final/terraform.tfstate"}}' \
  --region ap-southeast-1

# Note: Only do this if you're certain no one else is applying!
```

---

## Cleanup & Cost Reduction

### Destroy Everything

```bash
cd infra

# Review what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy -auto-approve

# Wait ~10 minutes for completion

# Verify in AWS console:
# - ECS cluster deleted
# - ALB deleted
# - CloudFront distribution disabled/deleted
# - S3 buckets deleted
# - RDS/MongoDB Atlas removed
```

### Destroy Selectively

```bash
cd infra

# Keep infrastructure, remove MongoDB
terraform destroy -target=module.mongodb_atlas -auto-approve

# Remove CloudFront (keep S3)
terraform destroy -target=aws_cloudfront_distribution.frontend -auto-approve

# Remove ALB (keep ECS)
terraform destroy -target=aws_lb.backend_alb -auto-approve
```

### Reduce Costs Without Destroying

```bash
cd infra

# Option 1: Scale down ECS tasks
nano terraform.tfvars
# Change: desired_count = 0

terraform apply

# Option 2: Disable CloudFront access logs
nano terraform.tfvars
# Change: enable_alb_access_logs = false

terraform apply

# Option 3: Increase log retention time (delete old logs)
nano terraform.tfvars
# Change: log_retention_days = 1

terraform apply
```

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] ECS cluster created and running
- [ ] ECS service has 1+ running tasks
- [ ] ALB created with HTTPS listener
- [ ] ALB targets are healthy (Healthy: 1/1)
- [ ] CloudFront distribution enabled
- [ ] S3 frontend bucket has React build files
- [ ] CloudWatch logs showing ECS task output
- [ ] Secrets Manager has MONGODB_URI, SESSION_SECRET, CLOUDINARY_URL
- [ ] MongoDB Atlas cluster created in ap-southeast-1
- [ ] Can reach ALB HTTPS endpoint
- [ ] Can reach CloudFront URL
- [ ] CloudWatch alarms created (6 total)
- [ ] No errors in CloudWatch logs
- [ ] API health check responds (not 500 error)
- [ ] Frontend loads in browser
- [ ] CloudFront cache working (X-Cache header shows "Hit from cloudfront")

---

## Common Commands Reference

```bash
# View all outputs
cd infra && terraform output -json | jq .

# View specific output
terraform output alb_dns_name
terraform output cloudfront_domain_name
terraform output s3_frontend_bucket

# Plan with auto-approve (dangerous!)
terraform apply -auto-approve

# Target specific resources
terraform plan -target=aws_ecs_service.backend
terraform apply -target=aws_ecs_service.backend

# Refresh state (sync with actual AWS)
terraform refresh

# Import existing resource
terraform import aws_lb.backend_alb arn:aws:elasticloadbalancing:...

# Enable debug logging
export TF_LOG=DEBUG
terraform plan
unset TF_LOG

# Format code
terraform fmt -recursive

# Validate syntax
terraform validate

# Check for unused variables
terraform console
```

---

**Version**: 1.0  
**Last Updated**: November 2025
