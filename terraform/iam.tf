# -------------------------------------------------------
# Base Lambda execution role
# -------------------------------------------------------
data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# -------------------------------------------------------
# Lambda role - Task operations (read + write DynamoDB, SES)
# -------------------------------------------------------
resource "aws_iam_role" "lambda_task_ops" {
  name               = "${var.project_name}-lambda-task-ops"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = { Project = var.project_name }
}

resource "aws_iam_role_policy" "lambda_task_ops_policy" {
  name = "task-ops-policy"
  role = aws_iam_role.lambda_task_ops.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid    = "DynamoDBTasksAndAssignments"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.tasks.arn,
          "${aws_dynamodb_table.tasks.arn}/index/*",
          aws_dynamodb_table.assignments.arn,
          "${aws_dynamodb_table.assignments.arn}/index/*",
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*"
        ]
      },
      {
        Sid    = "SESEmailSend"
        Effect = "Allow"
        Action = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Sid    = "CognitoListUsers"
        Effect = "Allow"
        Action = ["cognito-idp:ListUsers", "cognito-idp:AdminGetUser", "cognito-idp:ListUsersInGroup"]
        Resource = aws_cognito_user_pool.main.arn
      }
    ]
  })
}

# -------------------------------------------------------
# Lambda role - Pre-signup trigger (no DynamoDB needed)
# -------------------------------------------------------
resource "aws_iam_role" "lambda_pre_signup" {
  name               = "${var.project_name}-lambda-pre-signup"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = { Project = var.project_name }
}

resource "aws_iam_role_policy" "lambda_pre_signup_policy" {
  name = "pre-signup-policy"
  role = aws_iam_role.lambda_pre_signup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# -------------------------------------------------------
# Lambda role - Post-confirmation (sync user to DynamoDB)
# -------------------------------------------------------
resource "aws_iam_role" "lambda_post_confirm" {
  name               = "${var.project_name}-lambda-post-confirm"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = { Project = var.project_name }
}

resource "aws_iam_role_policy" "lambda_post_confirm_policy" {
  name = "post-confirm-policy"
  role = aws_iam_role.lambda_post_confirm.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Sid    = "DynamoDBUsers"
        Effect = "Allow"
        Action = ["dynamodb:PutItem", "dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.users.arn
      },
      {
        Sid    = "SESVerifyEmail"
        Effect = "Allow"
        Action = ["ses:VerifyEmailIdentity"]
        Resource = "*"
      }
    ]
  })
}
