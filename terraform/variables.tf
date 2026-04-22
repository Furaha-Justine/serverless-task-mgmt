variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-west-1"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "serverless-task-mgmt"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "allowed_email_domains" {
  description = "Allowed email domains for Cognito signup"
  type        = list(string)
  default     = ["amalitech.com", "amalitechtraining.org"]
}

variable "admin_email" {
  description = "Initial admin user email for notifications"
  type        = string
}

variable "ses_verified_domain" {
  description = "SES verified domain for sending emails"
  type        = string
  default     = "gmail.com"
}
variable "github_token" {
  description = "GitHub token with repo access for Amplify"
  type        = string
  sensitive   = true
}
