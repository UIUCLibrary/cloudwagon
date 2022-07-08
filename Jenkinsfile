pipeline {
    agent none
    parameters {
        string defaultValue: 'speedcloud', name: 'DOCKER_IMAGE_NAME'
        booleanParam  defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }

    stages {
        stage('Test'){
            parallel{
                stage('Jest'){
                    agent{
                        docker{
                            image 'node'
                            label 'docker && linux'
                            args '-v npmcache:/tmp/.npm'
                        }
                    }
                    environment {
                        HOME = '/tmp/'
                        JEST_JUNIT_OUTPUT_NAME="js-junit.xml"
                        JEST_JUNIT_ADD_FILE_ATTRIBUTE="true"
                        JEST_JUNIT_OUTPUT_DIR="${WORKSPACE}/reports"
                        npm_config_cache = '/tmp/npm-cache'
                    }
                    steps{
                        sh 'npm install --prefer-offline --no-audit'
                        sh 'npm run test -- --reporters=default --reporters=jest-junit --coverageReporters=cobertura --coverageReporters=lcov --collectCoverage'
                    }
                    post{
                        always{
                            junit "reports/*.xml"
                            archiveArtifacts allowEmptyArchive: true, artifacts: "coverage/*.xml"
                            publishCoverage(
                                adapters: [
                                    coberturaAdapter('coverage/cobertura-coverage.xml'),
                                ],
                                sourceFileResolver: sourceFiles('STORE_ALL_BUILD')
                            )
                        }
                        cleanup{
                            cleanWs(
                                deleteDirs: true,
                                patterns: [
                                    [pattern: 'coverage/', type: 'INCLUDE'],
                                    [pattern: 'reports/', type: 'INCLUDE'],
                                    [pattern: 'node_modules/', type: 'INCLUDE'],
                                ]
                            )
                        }
                    }
                }
            }
        }
        stage('Build wheel'){
            agent {
                label 'linux && docker'
            }
            steps{
                script{
                    docker.image('python').inside('-v pipcache_speedwagon:/.cache/pip'){
                        sh '''python -m venv venv
                              venv/bin/python -m pip install pip --upgrade
                              venv/bin/pip install wheel
                              venv/bin/pip install build
                              venv/bin/python -m build Speedwagon --outdir dist
                              venv/bin/python -m build backend --outdir dist
                            '''
                    }
                }
            }
            post{
                success{
                    stash includes: 'dist/*,whl', name: 'wheel'
                }
            }
        }
        stage('Build'){
            matrix {
                axes {
                    axis {
                        name 'ARCH'
                        values 'arm', 'x86'
                    }
                }
                stages{
                    stage('Build for Architecture'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        environment {
                            DOCKER_IMAGE_TEMP_NAME = UUID.randomUUID().toString()
                        }
                        stages{
                            stage('Building Docker Container'){

                                steps{
                                    unstash 'wheel'
                                    echo "DOCKER_IMAGE_TEMP_NAME = ${env.DOCKER_IMAGE_TEMP_NAME}"

                                    withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                        configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                            script{
                                                docker.build(
                                                    env.DOCKER_IMAGE_TEMP_NAME,
                                                    "-f backend/Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                                    ).inside('-v pipcache_speedwagon:/.cache/pip'){
                                                        sh 'cd Speedwagon && pytest'
                                                    }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        post{
                            cleanup{
                                sh(returnStatus: true, script:"docker image rm ${env.DOCKER_IMAGE_TEMP_NAME}")
                            }
                        }
                    }
                }
            }
        }
        stage('Publish'){
            when{
                equals expected: true, actual: params.PUBLISH_DOCKER
                beforeInput true
            }
            input {
                message 'Push to docker registry?'
                parameters {
                    string defaultValue: 'latest', name: 'DOCKER_TAG', trim: true
                }
            }
             matrix {
                axes {
                    axis {
                        name 'ARCH'
                        values 'arm', 'x86'
                    }
                }
                stages{
                    stage('Publish docker Image'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        steps{
                            unstash 'wheel'
                            withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                    script{
                                        docker.build(
                                            params.DOCKER_IMAGE_NAME,
                                            "-f backend/Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                            ).inside{
                                                sh 'pip list'
                                            }
                                    }
                                }
                            }
                            configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                                script{
                                    def deploySettings = readProperties(file: CONFIG_FILE)
                                    docker.withRegistry(deploySettings['registry'], deploySettings['credentialsId']){
                                        docker.image(params.DOCKER_IMAGE_NAME).push(DOCKER_TAG)
                                    }
                                }
                            }
                        }
                        post{
                            cleanup{
                                sh "docker image rm ${params.DOCKER_IMAGE_NAME}"
                            }
                        }
                    }
                }
            }
        }
    }
}