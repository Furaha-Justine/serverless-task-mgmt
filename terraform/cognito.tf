# -------------------------------------------------------
# Cognito User Pool
# -------------------------------------------------------
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-user-pool"

  # Require email verification before login
  auto_verified_attributes = ["email"]

  # Use email as username
  username_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # Email verification message
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Verify your Task Management account"
    email_message        = "Your verification code is {####}. Enter this in the app to confirm your email."
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Schema attributes
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    string_attribute_constraints {
      min_length = 5
      max_length = 254
    }
  }

  schema {
    name                     = "role"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    string_attribute_constraints {
      min_length = 0
      max_length = 50
    }
  }

  # Lambda triggers
  lambda_config {
    pre_sign_up       = aws_lambda_function.pre_signup.arn
    post_confirmation = aws_lambda_function.post_confirm.arn
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# -------------------------------------------------------
# Cognito User Pool Client
# -------------------------------------------------------
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # Don't generate a client secret (SPA/React frontend)
  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # Token validity
  access_token_validity  = 1   # 1 hour
  id_token_validity      = 1   # 1 hour
  refresh_token_validity = 30  # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Prevent user existence errors from leaking
  prevent_user_existence_errors = "ENABLED"
}

# -------------------------------------------------------
# Cognito Groups (RBAC)
# -------------------------------------------------------
resource "aws_cognito_user_group" "admins" {
  name         = "Admins"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator group - full task management access"
  role_arn     = aws_iam_role.cognito_admin_group.arn
  precedence   = 1
}

resource "aws_cognito_user_group" "members" {
  name         = "Members"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Member group - view and update assigned tasks only"
  role_arn     = aws_iam_role.cognito_member_group.arn
  precedence   = 2
}

# -------------------------------------------------------
# IAM roles for Cognito groups
# -------------------------------------------------------
data "aws_iam_policy_document" "cognito_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = ["cognito-identity.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "cognito-identity.amazonaws.com:aud"
      values   = ["us-east-1:*"]
    }
    condition {
      test     = "ForAnyValue:StringLike"
      variable = "cognito-identity.amazonaws.com:amr"
      values   = ["authenticated"]
    }
  }
}

resource "aws_iam_role" "cognito_admin_group" {
  name               = "${var.project_name}-cognito-admin-role"
  assume_role_policy = data.aws_iam_policy_document.cognito_assume.json
  tags = { Project = var.project_name }
}

resource "aws_iam_role" "cognito_member_group" {
  name               = "${var.project_name}-cognito-member-role"
  assume_role_policy = data.aws_iam_policy_document.cognito_assume.json
  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Lambda permission for Cognito to invoke pre-signup
# -------------------------------------------------------
resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "AllowCognitoInvokePreSignup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
