# -------------------------------------------------------
# Lambda packaging - zip each function directory
# -------------------------------------------------------
data "archive_file" "pre_signup" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/preSignup"
  output_path = "${path.module}/.zip/preSignup.zip"
}

data "archive_file" "post_confirm" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/postConfirm"
  output_path = "${path.module}/.zip/postConfirm.zip"
}

data "archive_file" "create_task" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/createTask"
  output_path = "${path.module}/.zip/createTask.zip"
}

data "archive_file" "update_task" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/updateTask"
  output_path = "${path.module}/.zip/updateTask.zip"
}

data "archive_file" "assign_task" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/assignTask"
  output_path = "${path.module}/.zip/assignTask.zip"
}

data "archive_file" "close_task" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/closeTask"
  output_path = "${path.module}/.zip/closeTask.zip"
}

data "archive_file" "get_tasks" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/getTasks"
  output_path = "${path.module}/.zip/getTasks.zip"
}

data "archive_file" "get_task_by_id" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/getTaskById"
  output_path = "${path.module}/.zip/getTaskById.zip"
}

# -------------------------------------------------------
# Common environment variables
# -------------------------------------------------------
locals {
  common_env = {
    TASKS_TABLE       = aws_dynamodb_table.tasks.name
    ASSIGNMENTS_TABLE = aws_dynamodb_table.assignments.name
    USERS_TABLE       = aws_dynamodb_table.users.name
    USER_POOL_ID      = aws_cognito_user_pool.main.id
    SES_FROM_EMAIL    = var.ses_from_email
    REGION            = var.aws_region
  }
}

# -------------------------------------------------------
# Pre-signup trigger
# -------------------------------------------------------
resource "aws_lambda_function" "pre_signup" {
  function_name    = "${var.project_name}-pre-signup"
  role             = aws_iam_role.lambda_pre_signup.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.pre_signup.output_path
  source_code_hash = data.archive_file.pre_signup.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      ALLOWED_DOMAINS = join(",", var.allowed_email_domains)
    }
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Post-confirmation trigger (sync verified user to DynamoDB)
# -------------------------------------------------------
resource "aws_lambda_function" "post_confirm" {
  function_name    = "${var.project_name}-post-confirm"
  role             = aws_iam_role.lambda_post_confirm.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.post_confirm.output_path
  source_code_hash = data.archive_file.post_confirm.output_base64sha256
  timeout          = 10

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      REGION      = var.aws_region
    }
  }

  tags = { Project = var.project_name }
}

resource "aws_lambda_permission" "cognito_post_confirm" {
  statement_id  = "AllowCognitoInvokePostConfirm"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirm.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

# -------------------------------------------------------
# Create Task (Admin only)
# -------------------------------------------------------
resource "aws_lambda_function" "create_task" {
  function_name    = "${var.project_name}-create-task"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.create_task.output_path
  source_code_hash = data.archive_file.create_task.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Update Task (Member updates status; Admin full update)
# -------------------------------------------------------
resource "aws_lambda_function" "update_task" {
  function_name    = "${var.project_name}-update-task"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.update_task.output_path
  source_code_hash = data.archive_file.update_task.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Assign Task (Admin only)
# -------------------------------------------------------
resource "aws_lambda_function" "assign_task" {
  function_name    = "${var.project_name}-assign-task"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.assign_task.output_path
  source_code_hash = data.archive_file.assign_task.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Close Task (Admin only)
# -------------------------------------------------------
resource "aws_lambda_function" "close_task" {
  function_name    = "${var.project_name}-close-task"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.close_task.output_path
  source_code_hash = data.archive_file.close_task.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Get Tasks (Admin sees all; Member sees assigned only)
# -------------------------------------------------------
resource "aws_lambda_function" "get_tasks" {
  function_name    = "${var.project_name}-get-tasks"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_tasks.output_path
  source_code_hash = data.archive_file.get_tasks.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# Get Task By ID
# -------------------------------------------------------
resource "aws_lambda_function" "get_task_by_id" {
  function_name    = "${var.project_name}-get-task-by-id"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_task_by_id.output_path
  source_code_hash = data.archive_file.get_task_by_id.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

# -------------------------------------------------------
# CloudWatch Log Groups (explicit, with retention)
# -------------------------------------------------------
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    aws_lambda_function.pre_signup.function_name,
    aws_lambda_function.post_confirm.function_name,
    aws_lambda_function.create_task.function_name,
    aws_lambda_function.update_task.function_name,
    aws_lambda_function.assign_task.function_name,
    aws_lambda_function.close_task.function_name,
    aws_lambda_function.get_tasks.function_name,
    aws_lambda_function.get_task_by_id.function_name,
  ])

  name              = "/aws/lambda/${each.value}"
  retention_in_days = 30
  tags              = { Project = var.project_name }
}

# -------------------------------------------------------
# Get Users (Admin only)
# -------------------------------------------------------
data "archive_file" "get_users" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/getUsers"
  output_path = "${path.module}/.zip/getUsers.zip"
}

resource "aws_lambda_function" "get_users" {
  function_name    = "${var.project_name}-get-users"
  role             = aws_iam_role.lambda_task_ops.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_users.output_path
  source_code_hash = data.archive_file.get_users.output_base64sha256
  timeout          = 30

  environment {
    variables = local.common_env
  }

  tags = { Project = var.project_name }
}

resource "aws_cloudwatch_log_group" "get_users" {
  name              = "/aws/lambda/${aws_lambda_function.get_users.function_name}"
  retention_in_days = 30
  tags              = { Project = var.project_name }
}

resource "aws_lambda_permission" "apigw_get_users" {
  statement_id  = "AllowAPIGatewayGetUsers"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
