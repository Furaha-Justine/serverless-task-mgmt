
# -------------------------------------------------------
# IAM Role for Amplify
# -------------------------------------------------------
resource "aws_iam_role" "amplify" {
  name = "${var.project_name}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "amplify.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = { Project = var.project_name }
}

resource "aws_iam_role_policy_attachment" "amplify" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

# -------------------------------------------------------
# Amplify App - React frontend hosting
# -------------------------------------------------------
resource "aws_amplify_app" "frontend" {
  name       = "${var.project_name}-frontend"
  repository = "https://github.com/Furaha-Justine/${var.project_name}-frontend"
  access_token = var.github_token  
  iam_service_role_arn = aws_iam_role.amplify.arn

  build_spec = <<-EOT
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: dist
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
  EOT

  environment_variables = {
    VITE_USER_POOL_ID        = aws_cognito_user_pool.main.id
    VITE_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.main.id
    VITE_API_URL             = aws_api_gateway_stage.main.invoke_url
    VITE_REGION              = var.aws_region
  }

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  tags = { Project = var.project_name }
}

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.frontend.id
  branch_name = "main"
  stage       = "PRODUCTION"
  framework   = "React"

  tags = { Project = var.project_name }
}
