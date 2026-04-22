# Serverless Task Management System

Production-grade serverless application on AWS — Cognito auth, Lambda, API Gateway, DynamoDB, SES, React on Amplify. Full role-based access control (Admin / Member).

---

## Architecture

```
React (Amplify)
    │
    │  HTTPS + Cognito JWT
    ▼
API Gateway ──── Cognito Authorizer
    │
    ├── GET  /tasks              → getTasks Lambda
    ├── POST /tasks              → createTask Lambda       [Admin]
    ├── GET  /tasks/{id}         → getTaskById Lambda
    ├── PUT  /tasks/{id}         → updateTask Lambda
    ├── POST /tasks/{id}/assign  → assignTask Lambda       [Admin]
    └── POST /tasks/{id}/close   → closeTask Lambda        [Admin]
         │
         ├── DynamoDB (tasks, assignments, users tables)
         └── SES (email notifications)

Cognito Triggers:
    pre-signup   → domain restriction (@amalitech.com / @amalitechtraining.org)
    post-confirm → sync verified user to DynamoDB users table
```

---

## Project Structure

```
serverless-task-mgmt/
├── terraform/
│   ├── main.tf            # Provider + S3/DynamoDB remote backend
│   ├── variables.tf
│   ├── outputs.tf
│   ├── cognito.tf         # User Pool, client, groups, triggers
│   ├── dynamodb.tf        # tasks, assignments, users tables
│   ├── iam.tf             # Scoped IAM roles per Lambda
│   ├── lambda.tf          # All Lambda functions + log groups
│   ├── apigateway.tf      # REST API, Cognito authorizer, all routes, CORS
│   ├── amplify.tf         # React frontend hosting
│   └── terraform.tfvars.example
├── lambdas/
│   ├── package.json
│   ├── shared/
│   │   ├── auth.js        # Caller identity + admin guard + response helper
│   │   ├── db.js          # DynamoDB document client helpers
│   │   └── email.js       # SES notification helpers
│   ├── preSignup/         # Domain restriction trigger
│   ├── postConfirm/       # Sync user to DynamoDB
│   ├── createTask/        # Admin: create task
│   ├── updateTask/        # Admin: full update | Member: status only
│   ├── assignTask/        # Admin: assign members, notify via SES
│   ├── closeTask/         # Admin: close task, notify via SES
│   ├── getTasks/          # Admin: all tasks | Member: assigned only
│   └── getTaskById/       # Admin: any | Member: assigned only
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx            # Routes + auth guard
        ├── cognitoConfig.js   # Reads VITE_ env vars
        ├── index.css
        ├── contexts/
        │   └── AuthContext.jsx    # Cognito login/signup/confirm/logout
        ├── services/
        │   └── api.js             # All API calls with JWT injection
        └── pages/
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── ConfirmPage.jsx    # Email verification
            ├── TasksPage.jsx      # Task list with status filter
            ├── TaskDetail.jsx     # View + update + assign + close
            └── CreateTask.jsx     # Admin only
```

---

## Prerequisites

- AWS CLI configured with your sandbox account credentials
- Terraform >= 1.5.0
- Node.js >= 20.x
- A verified SES domain or email address in your AWS account

---

## Deployment

### 1. Bootstrap Terraform Remote State

Run once before `terraform init` to create the S3 bucket and DynamoDB lock table:

```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket serverless-task-mgmt-tfstate \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket serverless-task-mgmt-tfstate \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket serverless-task-mgmt-tfstate \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

# Create DynamoDB lock table
aws dynamodb create-table \
  --table-name serverless-task-mgmt-tflock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. Configure Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set admin_email and ses_verified_domain
```

### 3. Install Lambda Dependencies

Each Lambda function directory that uses shared code needs the `node_modules` from the lambdas root.
The Terraform `archive_file` zips each function directory independently, so copy shared deps:

```bash
cd lambdas
npm install

# Copy node_modules and shared into each function dir before terraform apply
for dir in preSignup postConfirm createTask updateTask assignTask closeTask getTasks getTaskById; do
  cp -r node_modules "lambdas/$dir/"
  cp -r shared       "lambdas/$dir/"
done
```

Or use the provided helper script:

```bash
bash scripts/bundle.sh
```

### 4. Deploy Infrastructure

```bash
cd terraform
mkdir -p .zip          # archive_file output directory

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

Note the outputs — you will need `api_gateway_url`, `cognito_user_pool_id`, and `cognito_user_pool_client_id`.

### 5. Verify SES Domain / Email

If your SES domain is not yet verified:

```bash
aws ses verify-email-identity \
  --email-address noreply@amalitech.com \
  --region us-east-1
```

Check your inbox and click the verification link. SES sandbox mode limits sending to verified addresses only — request production access if needed.

### 6. Deploy Frontend Locally (Development)

```bash
cd frontend
npm install

# Create .env.local with Terraform outputs
cat > .env.local <<EOF
VITE_USER_POOL_ID=<cognito_user_pool_id>
VITE_USER_POOL_CLIENT_ID=<cognito_user_pool_client_id>
VITE_API_URL=<api_gateway_url>
VITE_REGION=us-east-1
EOF

npm run dev
```

### 7. Deploy Frontend via Amplify

Amplify reads environment variables from `terraform/amplify.tf` automatically during build.
Push your frontend code to the GitHub repo specified in `amplify.tf`, then trigger a build:

```bash
aws amplify start-job \
  --app-id <amplify_app_id> \
  --branch-name main \
  --job-type RELEASE
```

---

## Post-Deployment: Assign User Roles

After a user signs up and verifies their email, an Admin must add them to the correct Cognito group:

```bash
# Add user to Admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <user_pool_id> \
  --username user@amalitech.com \
  --group-name Admins

# Add user to Members group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id <user_pool_id> \
  --username user@amalitech.com \
  --group-name Members
```

---

## API Reference

All endpoints require `Authorization: <Cognito ID Token>` header.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET    | /tasks | All | List tasks (Admin: all, Member: assigned) |
| POST   | /tasks | Admin | Create task |
| GET    | /tasks/{id} | All | Get task detail with assignees |
| PUT    | /tasks/{id} | All | Update task (Admin: any field, Member: status only) |
| POST   | /tasks/{id}/assign | Admin | Assign users to task |
| POST   | /tasks/{id}/close | Admin | Close task |

### Task Object

```json
{
  "taskId":      "uuid",
  "title":       "Fix login bug",
  "description": "Users cannot log in on mobile",
  "priority":    "HIGH",
  "status":      "OPEN",
  "dueDate":     "2026-03-01",
  "createdBy":   "cognito-sub-uuid",
  "createdAt":   "2026-01-15T09:00:00.000Z",
  "updatedAt":   "2026-01-15T09:00:00.000Z"
}
```

### Status Values

| Value | Settable by |
|-------|------------|
| OPEN | Admin |
| IN_PROGRESS | Admin, Member |
| DONE | Admin, Member |
| CLOSED | Admin (via /close only) |

---

## Email Notifications

| Event | Recipients |
|-------|-----------|
| Task assigned | Newly assigned member(s) |
| Task status changed | All assigned members |
| Task closed | All assigned members |

Emails are sent via Amazon SES from `noreply@<ses_verified_domain>`.

---

## Security Controls Summary

| Constraint | Enforcement |
|-----------|------------|
| Only @amalitech.com / @amalitechtraining.org signups | Cognito pre-signup Lambda |
| Email verification required before login | Cognito `auto_verified_attributes` |
| Unauthenticated API access blocked | API Gateway Cognito Authorizer |
| Member cannot create/assign/close tasks | Lambda RBAC check on Cognito group claims |
| Member can only update tasks they're assigned to | Lambda checks assignments table |
| Duplicate assignments prevented | Lambda checks existing assignment before insert |
| Deactivated users cannot be assigned | Lambda checks `active` flag in users table |
| IAM roles scoped per function | Separate IAM role per Lambda with least-privilege policies |
| DynamoDB encryption at rest | `server_side_encryption` enabled |
| State file encrypted | S3 bucket encryption + versioning |

---

## Teardown

```bash
cd terraform
terraform destroy
```

Then delete the bootstrap resources:

```bash
# Empty and delete state bucket
aws s3 rm s3://serverless-task-mgmt-tfstate --recursive
aws s3api delete-bucket --bucket serverless-task-mgmt-tfstate

# Delete lock table
aws dynamodb delete-table --table-name serverless-task-mgmt-tflock
```
