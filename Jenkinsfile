// Langfuse ECR image build & push pipeline
//
// Given a Langfuse version, builds langfuse-web and langfuse-worker in
// parallel from our shipsy/langfuse fork (a fork of
// https://github.com/langfuse/langfuse) at that tag, and pushes each to
// its own ECR repo. Build/push has no ordering dependency between the two
// images, so it runs in parallel.
//
// Deploying is NOT parallel: worker is the backend — its task definition
// is updated and its service must reach steady state first. Only once
// worker's rollout is confirmed stable does web's task definition get
// updated. This ordering is intentional and sequential on purpose.
//
// ClickHouse is NOT part of this pipeline. Our langfuse-clickhouse ECR
// image is stock clickhouse-server, unrelated to the Langfuse version —
// see langfuse-v4-upgrade.md §3. If ClickHouse ever needs a version bump,
// that's a separate pipeline/decision.
//
// Deploying to the live PROD ECS services is gated behind a manual Jenkins
// approval (the "Approve deploy" stage) — a person confirms the backups
// in langfuse-v4-upgrade.md §4 were taken before the task definitions are
// updated. This is a standing rule, not a per-run toggle.

pipeline {
    agent any

    parameters {
        string(
            name: 'LANGFUSE_VERSION',
            defaultValue: 'v4.6.0',
            description: 'Upstream Langfuse git tag to build from shipsy/langfuse (e.g. v4.6.0, v4.9.0). Must exist as a tag in the fork — sync the fork with upstream first if it does not.'
        )
        booleanParam(
            name: 'TAG_AS_LATEST',
            defaultValue: false,
            description: 'Also push each image as :latest in addition to the explicit version tag. The version tag is always pushed regardless — task definitions should reference the explicit tag, never :latest, so old versions stay available for rollback.'
        )
    }

    environment {
        AWS_ACCOUNT_ID   = '989674740158'
        AWS_REGION       = 'us-west-2'
        ECR_REGISTRY     = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        FORK_REPO_URL    = 'git@github.com:shipsy/langfuse.git'
        ECS_CLUSTER      = 'projectx-fargate-cluster'
        // Jenkins credentials store IDs — create these before first run:
        //   aws-ecr-push-creds   : AWS access key/secret (or use an IAM instance
        //                          profile / OIDC role on the Jenkins agent instead,
        //                          which is preferred over long-lived keys)
        //   github-shipsy-ssh    : SSH key with read access to shipsy/langfuse
        AWS_CREDS_ID     = 'aws-ecr-push-creds'
        GITHUB_CREDS_ID  = 'github-shipsy-ssh'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {

        stage('Checkout fork at tag') {
            steps {
                script {
                    echo "Cloning ${FORK_REPO_URL} at tag ${params.LANGFUSE_VERSION}"
                }
                git branch: "refs/tags/${params.LANGFUSE_VERSION}",
                    url: "${FORK_REPO_URL}",
                    credentialsId: "${GITHUB_CREDS_ID}"
                sh 'git rev-parse HEAD && git log -1 --oneline'
                // Stash the checked-out source so the parallel build branches
                // below (each its own workspace on possibly different
                // executors) have the exact same commit to build from.
                stash name: 'source', includes: '**', useDefaultExcludes: false
            }
        }

        stage('ECR login') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}"
                ]]) {
                    sh '''
                        aws ecr get-login-password --region "$AWS_REGION" | \
                          docker login --username AWS --password-stdin "$ECR_REGISTRY"
                    '''
                }
            }
        }

        stage('Build & push (parallel)') {
            parallel {

                stage('web') {
                    steps {
                        unstash 'source'
                        sh '''
                            docker build \
                              -f web/Dockerfile \
                              -t "$ECR_REGISTRY/langfuse-web:${LANGFUSE_VERSION}" \
                              .
                        '''
                        withCredentials([[
                            $class: 'AmazonWebServicesCredentialsBinding',
                            credentialsId: "${AWS_CREDS_ID}"
                        ]]) {
                            sh 'docker push "$ECR_REGISTRY/langfuse-web:${LANGFUSE_VERSION}"'
                            script {
                                if (params.TAG_AS_LATEST) {
                                    sh '''
                                        docker tag "$ECR_REGISTRY/langfuse-web:${LANGFUSE_VERSION}" "$ECR_REGISTRY/langfuse-web:latest"
                                        docker push "$ECR_REGISTRY/langfuse-web:latest"
                                    '''
                                }
                            }
                        }
                    }
                }

                stage('worker') {
                    steps {
                        unstash 'source'
                        sh '''
                            docker build \
                              -f worker/Dockerfile \
                              -t "$ECR_REGISTRY/langfuse-worker:${LANGFUSE_VERSION}" \
                              .
                        '''
                        withCredentials([[
                            $class: 'AmazonWebServicesCredentialsBinding',
                            credentialsId: "${AWS_CREDS_ID}"
                        ]]) {
                            sh 'docker push "$ECR_REGISTRY/langfuse-worker:${LANGFUSE_VERSION}"'
                            script {
                                if (params.TAG_AS_LATEST) {
                                    sh '''
                                        docker tag "$ECR_REGISTRY/langfuse-worker:${LANGFUSE_VERSION}" "$ECR_REGISTRY/langfuse-worker:latest"
                                        docker push "$ECR_REGISTRY/langfuse-worker:latest"
                                    '''
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Approve deploy') {
            steps {
                input message: "Both images pushed as :${params.LANGFUSE_VERSION}. Update langfuse-web-task-definition and langfuse-worker-task-definition and deploy to PROD ECS (${ECS_CLUSTER})? Confirm backups (RDS snapshot + EFS/ClickHouse backup) were taken per langfuse-v4-upgrade.md §4 before proceeding.",
                      ok: 'Deploy'
            }
        }

        stage('Update worker task definition') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}"
                ]]) {
                    deployComponent('worker', 'langfuse-worker-task-definition', 'langfuse-worker-service')
                }
            }
        }

        stage('Update web task definition') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: "${AWS_CREDS_ID}"
                ]]) {
                    deployComponent('web', 'langfuse-web-task-definition', 'langfuse-web-service')
                }
            }
        }
    }

    post {
        success {
            echo "Done. langfuse-web and langfuse-worker built, pushed, and deployed at ${params.LANGFUSE_VERSION}."
        }
        failure {
            echo "Pipeline failed — check the stage log above. Worker deploys before web; if worker deployed and stabilized but web's stage failed, worker is already on the new version and web is still on the old one — finish web's rollout manually before leaving it in that state."
        }
    }
}

// Fetches the current task def, swaps the image tag, registers a new
// revision, updates the service, and waits for the deployment to
// stabilize.
def deployComponent(String component, String taskDefFamily, String serviceName) {
    sh """
        set -euo pipefail

        aws ecs describe-task-definition \
          --task-definition ${taskDefFamily} \
          --region \$AWS_REGION \
          --query 'taskDefinition' \
          --output json > ${component}-td-current.json

        NEW_IMAGE="\$ECR_REGISTRY/langfuse-${component}:${LANGFUSE_VERSION}"

        python3 - "${component}-td-current.json" "\$NEW_IMAGE" <<'PYEOF'
import json, sys
path, new_image = sys.argv[1], sys.argv[2]
with open(path) as f:
    td = json.load(f)
for k in ("taskDefinitionArn", "revision", "status", "requiresAttributes",
          "compatibilities", "registeredAt", "registeredBy"):
    td.pop(k, None)
td["containerDefinitions"][0]["image"] = new_image
with open(path, "w") as f:
    json.dump(td, f)
PYEOF

        aws ecs register-task-definition \
          --cli-input-json file://${component}-td-current.json \
          --region \$AWS_REGION \
          --query 'taskDefinition.taskDefinitionArn' \
          --output text > ${component}-new-td-arn.txt

        NEW_TD_ARN=\$(cat ${component}-new-td-arn.txt)
        echo "Registered: \$NEW_TD_ARN"

        aws ecs update-service \
          --cluster \$ECS_CLUSTER \
          --service ${serviceName} \
          --task-definition "\$NEW_TD_ARN" \
          --region \$AWS_REGION

        aws ecs wait services-stable \
          --cluster \$ECS_CLUSTER \
          --services ${serviceName} \
          --region \$AWS_REGION

        echo "${serviceName} is stable on \$NEW_TD_ARN"
    """
}
