# -------------------------------------------------------
# DynamoDB - Tasks Table
# -------------------------------------------------------
resource "aws_dynamodb_table" "tasks" {
  name           = "${var.project_name}-tasks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "taskId"

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # GSI for querying tasks by status
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# -------------------------------------------------------
# DynamoDB - Assignments Table
# -------------------------------------------------------
resource "aws_dynamodb_table" "assignments" {
  name           = "${var.project_name}-assignments"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "taskId"
  range_key      = "userId"

  attribute {
    name = "taskId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  # GSI for querying assignments by user
  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    range_key       = "taskId"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# -------------------------------------------------------
# DynamoDB - Users Table (for tracking active/deactivated users)
# -------------------------------------------------------
resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}
