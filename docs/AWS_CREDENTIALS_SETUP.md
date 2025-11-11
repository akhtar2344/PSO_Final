# 🔐 AWS Credentials Setup Guide

## Prerequisites Before Terraform Deploy

Sebelum menjalankan `terraform apply`, Anda harus:
1. Memiliki AWS Account (dengan akses ke region ap-southeast-1)
2. Membuat IAM User dengan akses `AdministratorAccess` atau permissions yang sesuai
3. Generate AWS Access Key dan Secret Access Key

---

## Step 1: Buat IAM User (jika belum ada)

1. Login ke AWS Console: https://console.aws.amazon.com
2. Buka **IAM** → **Users** → **Create user**
3. Masukkan username (contoh: `terraform-user`)
4. Skip "Provide user access to AWS Management Console" 
5. Next → Next
6. Attach policy: **AdministratorAccess** (untuk development)
7. Create user

---

## Step 2: Generate Access Keys

1. Buka user yang baru dibuat
2. Klik tab **Security credentials**
3. Scroll ke **Access keys** section
4. Klik **Create access key**
5. Pilih **Command Line Interface (CLI)**
6. Confirm → **Create access key**
7. **COPY dan SIMPAN dengan aman**:
   - Access Key ID
   - Secret Access Key

⚠️ **PENTING**: Secret Access Key hanya muncul sekali. Jika terlewat, buat access key baru.

---

## Step 3: Configure AWS CLI (2 Opsi)

### Option A: Interactive Configuration (Recommended)

```powershell
aws configure
```

Masukkan:
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-southeast-1
Default output format [None]: json
```

### Option B: Environment Variables

```powershell
$env:AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE"
$env:AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
$env:AWS_DEFAULT_REGION = "ap-southeast-1"
```

### Option C: AWS Credentials File

Create file: `C:\Users\Akhtar Widodo\.aws\credentials`

```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[default-config]
region = ap-southeast-1
```

---

## Step 4: Verify Configuration

```powershell
aws sts get-caller-identity
```

Output yang sukses:
```json
{
    "UserId": "AIDAI23HZ27SI6FQMGNQ2",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/terraform-user"
}
```

Jika berhasil, lanjut ke step berikutnya!

---

## Step 5: Jalankan Terraform

```powershell
cd C:\Users\Akhtar Widodo\Downloads\PSO_Final-main\infra\backend-state
terraform apply -auto-approve
```

---

## ⚠️ Security Best Practices

✅ **DO:**
- Gunakan IAM User (bukan root account)
- Gunakan strong passwords dan MFA
- Rotate access keys setiap 90 hari
- Simpan credentials di tempat aman
- Gunakan least-privilege policies

❌ **DON'T:**
- Share access keys di public repo
- Hardcode credentials di Terraform files
- Gunakan root account credentials
- Upload .aws folder ke Git

---

## Troubleshooting

### Error: "Unable to locate credentials"
```
Solution: Jalankan `aws configure` dan masukkan credentials
```

### Error: "User is not authorized to perform: iam:*"
```
Solution: Attach AdministratorAccess policy ke IAM user
          atau request permissions ke AWS admin
```

### Error: "UnauthorizedOperation" 
```
Solution: Pastikan region ap-southeast-1 dipilih dengan benar
          aws configure set region ap-southeast-1
```

---

## Useful AWS CLI Commands

```powershell
# Check current identity
aws sts get-caller-identity

# List all regions
aws ec2 describe-regions --all-regions

# Check STS credentials
aws sts get-session-token

# List IAM users
aws iam list-users

# List access keys
aws iam list-access-keys --user-name terraform-user
```

---

## Sekarang Lanjut ke Terraform!

Setelah AWS credentials configured, jalankan:

```powershell
cd C:\Users\Akhtar Widodo\Downloads\PSO_Final-main\infra\backend-state
terraform apply -auto-approve
```

Tunggu proses selesai, kemudian lanjut ke **Step 2: Bootstrap Remote State**.

---

**Status**: 📋 Setup Required  
**Next**: Configure AWS Credentials → Run `terraform apply` → Continue with Step 2
