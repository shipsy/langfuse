@Library('jenkins-library@master') _

// Langfuse ECR image build & deploy pipeline
//
// Given a Langfuse version (git tag), checks out shipsy/langfuse (our fork
// of https://github.com/langfuse/langfuse) at that tag, builds and pushes
// langfuse-web and langfuse-worker to ECR in parallel, then updates ECS —
// worker first (it's the backend), and only once worker's rollout is
// confirmed stable does web get updated. This ordering is sequential on
// purpose, not parallel.
//
// ClickHouse is NOT part of this pipeline. Our langfuse-clickhouse ECR
// image is stock clickhouse-server, unrelated to the Langfuse version —
// see langfuse-v4-upgrade.md §3. If ClickHouse ever needs a version bump,
// that's a separate pipeline/decision.
//
// No Vault usage here — the image tag is just the given LANGFUSE_VERSION,
// not a Vault-derived config version, so generateDockerImageName (which is
// Vault-backed) isn't used. No config validation stage either — Langfuse's
// config is plain ECS task-definition env vars, not a vault-sourced config
// file, so there's nothing here for validateConfig to check.
//
// Deploying to the live PROD ECS services is gated behind a manual Jenkins
// approval ("Approve deploy") — a person confirms the backups in
// langfuse-v4-upgrade.md §4 were taken before either task definition is
// touched.

def repository = "langfuse"
def projectEnv = "prod"

def awsRegion = "us-west-2"
def forkRepoUrl = "git@github.com:shipsy/langfuse.git"

def clusterName = "projectx-fargate-cluster"
def webServiceName = "langfuse-web-service"
def workerServiceName = "langfuse-worker-service"
def webTaskDefinitionName = "langfuse-web-task-definition"
def workerTaskDefinitionName = "langfuse-worker-task-definition"

def webImageName
def workerImageName
def workerTaskRevision
def webTaskRevision

pipeline {
    agent any

    parameters {
        string(
            name: 'LANGFUSE_VERSION',
            defaultValue: 'v4.6.0',
            description: 'Upstream Langfuse git tag to build from shipsy/langfuse (e.g. v4.6.0, v4.9.0). Must exist as a tag in the fork — sync the fork with upstream first if it does not.'
        )
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {

        stage("Send Build started message") {
            steps {
                sendSlackMessage(
                    messageType: "start",
                    slackEnvironment: projectEnv
                )
            }
        }

        stage('Checkout fork at tag') {
            steps {
                script {
                    webImageName = "langfuse-web:${params.LANGFUSE_VERSION}"
                    workerImageName = "langfuse-worker:${params.LANGFUSE_VERSION}"
                }
                git branch: "refs/tags/${params.LANGFUSE_VERSION}",
                    url: forkRepoUrl,
                    credentialsId: 'github-shipsy-ssh'
                sh 'git rev-parse HEAD && git log -1 --oneline'
                stash name: 'source', includes: '**', useDefaultExcludes: false
            }
        }

        stage('Build & push (parallel)') {
            parallel {

                stage('web') {
                    steps {
                        unstash 'source'
                        buildDockerImage(
                            awsRegion: awsRegion,
                            imageName: webImageName,
                            dockerfilePath: 'web/Dockerfile',
                            directoryPath: '.'
                        )
                        pushDockerImage(
                            awsRegion: awsRegion,
                            imageName: webImageName
                        )
                    }
                }

                stage('worker') {
                    steps {
                        unstash 'source'
                        buildDockerImage(
                            awsRegion: awsRegion,
                            imageName: workerImageName,
                            dockerfilePath: 'worker/Dockerfile',
                            directoryPath: '.'
                        )
                        pushDockerImage(
                            awsRegion: awsRegion,
                            imageName: workerImageName
                        )
                    }
                }
            }
        }

        stage('Approve deploy') {
            steps {
                input message: "Both images pushed as :${params.LANGFUSE_VERSION}. Update ${workerTaskDefinitionName} and ${webTaskDefinitionName} and deploy to PROD ECS (${clusterName})? Confirm backups (RDS snapshot + EFS/ClickHouse backup) were taken per langfuse-v4-upgrade.md §4 before proceeding.",
                      ok: 'Deploy'
            }
        }

        stage('Update worker task definition') {
            steps {
                script {
                    workerTaskRevision = updateTaskDefinition(
                        taskDefinitionName: workerTaskDefinitionName,
                        dockerImageName: workerImageName,
                        awsRegion: awsRegion
                    )
                }
            }
        }

        stage('Deploy worker service') {
            options {
                timeout(time: 600, unit: "SECONDS")
            }
            steps {
                script {
                    try {
                        updateServiceOnECS(
                            ecsClusterName: clusterName,
                            ecsServiceName: workerServiceName,
                            taskDefinitionName: workerTaskDefinitionName,
                            currentTaskRevision: workerTaskRevision,
                            awsRegion: awsRegion
                        )
                    } catch (e) {
                        def slackMessage = getPipelineFailSlackAlertMessage(e, currentBuild, 'Langfuse Worker Prod Service')
                        wrap([$class: 'BuildUser']) {
                            slackSend channel: '#production-deployments', attachments: slackMessage
                        }
                        currentBuild.result = 'FAILURE'
                        error('deploy langfuse worker prod service failure — web task definition was not touched')
                    }
                }
            }
        }

        // Only reached once the worker service above is confirmed stable.
        stage('Update web task definition') {
            steps {
                script {
                    webTaskRevision = updateTaskDefinition(
                        taskDefinitionName: webTaskDefinitionName,
                        dockerImageName: webImageName,
                        awsRegion: awsRegion
                    )
                }
            }
        }

        stage('Deploy web service') {
            options {
                timeout(time: 600, unit: "SECONDS")
            }
            steps {
                script {
                    try {
                        updateServiceOnECS(
                            ecsClusterName: clusterName,
                            ecsServiceName: webServiceName,
                            taskDefinitionName: webTaskDefinitionName,
                            currentTaskRevision: webTaskRevision,
                            awsRegion: awsRegion
                        )
                    } catch (e) {
                        def slackMessage = getPipelineFailSlackAlertMessage(e, currentBuild, 'Langfuse Web Prod Service')
                        wrap([$class: 'BuildUser']) {
                            slackSend channel: '#production-deployments', attachments: slackMessage
                        }
                        currentBuild.result = 'FAILURE'
                        error('deploy langfuse web prod service failure — worker is already on the new version, web is not; align both before leaving it in this state')
                    }
                }
            }
        }
    }

    post {
        always {
            sendSlackMessage(
                messageType: "post",
                slackEnvironment: projectEnv
            )
            script {
                String ecrRegistry = "989674740158.dkr.ecr.${awsRegion}.amazonaws.com"
                sh """
                    docker rmi ${ecrRegistry}/${webImageName} || true
                    docker rmi ${ecrRegistry}/${workerImageName} || true
                """
            }
        }
    }
}
