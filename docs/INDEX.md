# 🚀 PSO_Final - Terraform Infrastructure for AWS

Welcome! This folder contains a **production-ready Terraform setup** for deploying the PSO_Final MERN app on AWS.

## ⚡ Quick Navigation

**New to this?** Start here:
1. **[QUICK_START.md](./QUICK_START.md)** - Deploy in 10 minutes (fastest path)
2. **[README.md](./README.md)** - Full documentation & architecture
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step with validation

**Need specific info?**
- Infrastructure code: See `.tf` files below
- Variables reference: See `terraform.tfvars.example`
- File descriptions: See `FILE_SUMMARY.md`

---

## 📦 What's Included

### Documentation (Start Here!)
```
QUICK_START.md          ← Start here (10 min deployment)
README.md               ← Full documentation (1500+ lines)
DEPLOYMENT_GUIDE.md     ← Step-by-step walkthrough (800+ lines)
FILE_SUMMARY.md         ← All files explained
INDEX.md                ← This file
```

### Terraform Configuration Files
```
Core Configuration:
├── versions.tf          ← Provider versions (Terraform 1.5+)
├── providers.tf         ← AWS & MongoDB Atlas configuration
├── variables.tf         ← 70+ input variables
├── outputs.tf           ← 20+ outputs with post-deployment checklist
└── main.tf              ← Data sources & MongoDB module reference

Infrastructure:
├── vpc.tf               ← VPC (10.0.0.0/16), 2 public + 2 private subnets
├── ecs.tf               ← Backend (Node/Express on Fargate, 1-3 tasks)
├── alb.tf               ← Load balancer (HTTPS, health checks, Route53)
├── s3_cloudfront_frontend.tf  ← Frontend (S3 + CloudFront CDN)
├── secrets.tf           ← AWS Secrets Manager (MONGODB_URI, SESSION_SECRET)
├── iam.tf               ← IAM roles & policies (least-privilege)
└── cloudwatch.tf        ← Monitoring (logs, alarms, metrics)

MongoDB Atlas:
└── mongodbatlas/
    ├── atlas.tf         ← MongoDB M0 cluster provisioning
    ├── variables.tf     ← Module variables
    └── outputs.tf       ← Connection string output

Remote State (Bootstrap):
└── backend-state/
    ├── state.tf         ← S3 bucket + DynamoDB table for remote state
    └── (generated files)
```

### Example Configuration
```
terraform.tfvars.example  ← Copy this to terraform.tfvars and fill in values
(backend.tf)              ← Create manually after bootstrap step
```

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                   AWS ap-southeast-1                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)            Backend (Node/Express)          │
│  ├─ S3 bucket               ├─ ECS Fargate (1-3 tasks)      │
│  ├─ CloudFront CDN          ├─ ALB (HTTPS)                  │
│  └─ SPA routing             ├─ Private subnets              │
│                             └─ Auto-scaling (CPU/Memory)    │
│                                                               │
│  Database                   Security & Monitoring            │
│  ├─ MongoDB Atlas M0        ├─ Secrets Manager              │
│  ├─ Replica set             ├─ CloudWatch Logs              │
│  └─ Free tier               ├─ 6 CloudWatch Alarms          │
│                             └─ IAM (least-privilege)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Cost**: ~$33/month (all-in, including compute, storage, CDN)

---

## ✅ Pre-Requisites

Before you start, install:

```bash
# Terraform
terraform -v          # Should be >= 1.5.0

# AWS CLI
aws --version         # Should be >= 2.0

# Docker (for building backend image)
docker --version      # Should be >= 20.x

# Node.js (for building frontend)
node -v               # Should be >= 14.x
npm -v                # Should be >= 6.x
```

Also required:
- AWS account with credentials configured
- MongoDB Atlas account with API keys
- Docker Hub account (or AWS ECR)

---

## 🚀 Getting Started (Choose One)

### Option 1: Fast Track (10 minutes)
```bash
# Read the quick start guide
cat QUICK_START.md

# Follow the 8 steps to deploy
# Execution time: ~10 minutes for setup + 15-20 minutes for infrastructure
```

### Option 2: Detailed Walkthrough (30 minutes)
```bash
# Read the full guide
cat README.md

# Follow "Getting Started" section (Step 1-6)
# Includes explanations for each command
```

### Option 3: Step-by-Step with Validation (45 minutes)
```bash
# Read deployment guide
cat DEPLOYMENT_GUIDE.md

# Follow pre-deployment validation
# Follow deployment steps
# Follow post-deployment testing
```

---

## 📋 File Organization

### Where to Find What

| What I Need | File |
|-------------|------|
| Quick deployment (10 min) | `QUICK_START.md` |
| Full architecture & features | `README.md` |
| Step-by-step with validation | `DEPLOYMENT_GUIDE.md` |
| List of all files & descriptions | `FILE_SUMMARY.md` |
| Terraform variable options | `terraform.tfvars.example` |
| Backend configuration | Create `backend.tf` (Step 4 of QUICK_START) |
| VPC, subnets, security groups | `vpc.tf` |
| ECS, Fargate, auto-scaling | `ecs.tf` |
| Load balancer, HTTPS, Route53 | `alb.tf` |
| S3, CloudFront, SPA routing | `s3_cloudfront_frontend.tf` |
| Database provisioning | `mongodbatlas/atlas.tf` |
| Secret management | `secrets.tf` |
| IAM roles & policies | `iam.tf` |
| CloudWatch logs & alarms | `cloudwatch.tf` |

---

## 🎯 Key Features

✅ **Production-Ready**
- Modular & reusable Terraform code
- AWS best practices throughout
- Comprehensive documentation
- Error handling & validation

✅ **Secure by Default**
- Least-privilege IAM policies
- AWS Secrets Manager integration
- HTTPS everywhere (ALB + CloudFront)
- VPC isolation (no public IPs on ECS)
- No hardcoded secrets

✅ **Cost-Optimized**
- Only ~$33/month all-in
- Free tier MongoDB Atlas
- Optional NAT Gateway (disable by default)
- Auto-scaling to handle spikes
- Intelligent caching on CloudFront

✅ **Scalable**
- Auto-scales ECS tasks (1-3 based on CPU/Memory)
- CloudFront CDN for frontend
- Application Load Balancer for backend
- MongoDB replica set for HA

✅ **Observable**
- CloudWatch Logs aggregation
- 6 CloudWatch Alarms (CPU, memory, errors)
- S3 access logs for ALB traffic
- ECS Container Insights metrics
- CloudFront metrics & hit rate

---

## 📖 Documentation Structure

### README.md (1500+ lines)
Comprehensive guide covering:
- Architecture overview with diagrams
- Feature summary
- Prerequisites & AWS setup
- Step-by-step getting started
- Post-deployment application deployment
- Testing procedures
- Rotating secrets
- Scaling information
- Debugging guide
- Cleanup instructions
- Cost breakdown
- Security checklist

### DEPLOYMENT_GUIDE.md (800+ lines)
Detailed deployment walkthrough:
- Pre-deployment validation
- 6-step deployment process
- Post-deployment verification
- Application code deployment
- Testing
- Monitoring & dashboards
- Rotation & updates
- Troubleshooting
- Post-deployment checklist
- 30+ common commands

### QUICK_START.md (400+ lines)
Fast-track deployment:
- Prerequisites installation
- 8-step quick start
- Troubleshooting
- Cleanup
- Cost breakdown

---

## 🔧 Terraform Workflow

### Standard Terraform Commands

```bash
cd infra

# 1. Validate syntax
terraform validate

# 2. Generate plan (review changes)
terraform plan -out=tfplan

# 3. Apply plan (deploy infrastructure)
terraform apply tfplan

# 4. View outputs
terraform output

# 5. Destroy (cleanup when done)
terraform destroy
```

### Important Notes

- **First time?** Start with `backend-state/` folder to bootstrap S3 + DynamoDB
- **Variables**: Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in values
- **Secrets**: Use `terraform.tfvars` (gitignored) for all sensitive data
- **Remote state**: Create `backend.tf` after bootstrap to use S3 + DynamoDB for state
- **Pins**: All provider versions are pinned for reproducibility

---

## 📊 Infrastructure Summary

| Component | Details |
|-----------|---------|
| **Region** | ap-southeast-1 (Singapore) |
| **VPC** | 10.0.0.0/16 (2 AZs) |
| **Backend** | ECS Fargate (1-3 tasks, 512 CPU, 1GB RAM) |
| **Frontend** | S3 + CloudFront (HTTPS) |
| **Database** | MongoDB Atlas M0 (Free tier) |
| **Load Balancer** | AWS ALB (HTTPS) |
| **Monitoring** | CloudWatch Logs + 6 Alarms |
| **Secrets** | AWS Secrets Manager (3 secrets) |
| **Cost/Month** | ~$33 (all-in) |
| **Deployment Time** | 15-20 minutes |

---

## 🆘 Need Help?

### Common Questions

**Q: Where do I start?**
A: Read `QUICK_START.md` for fastest deployment, or `README.md` for detailed explanation.

**Q: How much will this cost?**
A: ~$33/month (ECS $12, ALB $16, CDN $3, storage $2). See README for breakdown.

**Q: Can I use my own domain?**
A: Yes! Set `domain_name` in `terraform.tfvars`. Module handles Route53 + ACM automatically.

**Q: How do I update the backend code?**
A: Push new Docker image to Docker Hub/ECR, update `container_image` in tfvars, run `terraform apply`.

**Q: How do I update the frontend?**
A: Run `npm run build`, upload `build/` to S3, invalidate CloudFront cache.

**Q: Can I destroy just the database?**
A: Yes: `terraform destroy -target=module.mongodb_atlas -auto-approve`

**Q: How do I view logs?**
A: `aws logs tail /ecs/pso-final-backend --follow`

### Troubleshooting

See `DEPLOYMENT_GUIDE.md` "Troubleshooting" section for:
- ECS task won't start
- ALB shows unhealthy targets
- CloudFront returns 403
- Terraform state locked
- And 10+ other common issues

### Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [MongoDB Atlas Provider Docs](https://registry.terraform.io/providers/mongodb/mongodbatlas/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

---

## 🎯 Next Steps

1. **Read one of these first:**
   - `QUICK_START.md` (10 min, no explanation)
   - `README.md` (30 min, full explanation)
   - `DEPLOYMENT_GUIDE.md` (45 min, step-by-step validation)

2. **Prepare your values:**
   - Copy `terraform.tfvars.example` → `terraform.tfvars`
   - Fill in AWS credentials, MongoDB keys, Docker image

3. **Bootstrap remote state:**
   - `cd backend-state && terraform apply`

4. **Deploy infrastructure:**
   - `terraform init` (migrate to remote state)
   - `terraform plan`
   - `terraform apply`

5. **Deploy your app:**
   - Push backend Docker image
   - Upload frontend React build
   - Test endpoints

6. **Monitor & maintain:**
   - View CloudWatch logs
   - Check alarms
   - Rotate secrets periodically

---

## 📞 Support

For issues:
1. Check `DEPLOYMENT_GUIDE.md` troubleshooting section
2. View CloudWatch logs: `aws logs tail /ecs/pso-final-backend --follow`
3. Check AWS CloudFormation events in console
4. Search Terraform/AWS documentation
5. Enable debug: `export TF_LOG=DEBUG && terraform plan`

---

## 📝 Version & Status

- **Version**: 1.0
- **Status**: ✅ Ready for Production
- **Last Updated**: November 2025
- **Maintained By**: Akhtar Widodo
- **License**: MIT

---

## 📦 Summary

This folder contains **20 files totaling 5000+ lines** of Terraform infrastructure code and documentation to deploy a production-ready MERN application on AWS.

**Start here:**
1. `QUICK_START.md` - Fastest path (10 min)
2. `README.md` - Full details
3. `terraform.tfvars.example` - Variable reference

**Deploy in:** ~30 minutes (10 min setup + 20 min infrastructure)

**Cost:** ~$33/month

**Status:** ✅ Complete & Ready

---

**Let's deploy! 🚀**

Pick your path:
- ⚡ **Fast**: `QUICK_START.md`
- 📚 **Detailed**: `README.md`
- ✅ **Validated**: `DEPLOYMENT_GUIDE.md`
