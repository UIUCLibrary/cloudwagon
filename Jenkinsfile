pipeline {
    agent none
    parameters {
        string defaultValue: 'speedcloud', name: 'DOCKER_IMAGE_NAME'
        booleanParam  defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }

    stages {
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
//         stage('Build'){
//             matrix {
//                 axes {
//                     axis {
//                         name 'ARCH'
//                         values 'arm', 'x86'
//                     }
//                 }
//                 stages{
//                     stage('Build for Architecture'){
//                         agent {
//                             label "linux && docker && ${ARCH}"
//                         }
//                         environment {
//                             DOCKER_IMAGE_TEMP_NAME = UUID.randomUUID().toString()
//                         }
//                         stages{
//                             stage('Building Docker Container'){
//
//                                 steps{
//                                     unstash 'wheel'
//                                     echo "DOCKER_IMAGE_TEMP_NAME = ${env.DOCKER_IMAGE_TEMP_NAME}"
//
//                                     withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
//                                         configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
//                                             script{
//                                                 docker.build(
//                                                     env.DOCKER_IMAGE_TEMP_NAME,
//                                                     "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
//                                                     ).inside('-v pipcache_speedwagon:/.cache/pip'){
//                                                         sh 'cd Speedwagon && pytest'
//                                                     }
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                         post{
//                             cleanup{
//                                 sh(returnStatus: true, script:"docker image rm ${env.DOCKER_IMAGE_TEMP_NAME}")
//                             }
//                         }
//                     }
//                 }
//             }
//         }
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
            stages{
                stage('Create containres'){
                     matrix {
                        axes {
                            axis {
                                name 'ARCH'
                                values 'linux-arm64', 'linux-amd64'
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
                                                    "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                                    ).inside{
                                                        sh 'pip list'
                                                    }
                                            }
                                        }
                                    }
                                    configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                                        script{
                                            def deploySettings = readProperties(file: CONFIG_FILE)
                                            docker.withRegistry("https://${deploySettings['registry']}", deploySettings['credentialsId']){
                                                docker.image(params.DOCKER_IMAGE_NAME).push(ARCH)
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
                stage('Create Manifest'){
                    agent {
                        label 'linux && docker'
                    }
                    steps{
                        configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                            script{
                                def deploySettings = readProperties(file: CONFIG_FILE)
                                docker.withRegistry("https://${deploySettings['registry']}", deploySettings['credentialsId']){
                                    sh "docker manifest create ${deploySettings['registry']}/speedcloud ${deploySettings['registry']}/speedcloud:linux-amd64 ${deploySettings['registry']}/speedcloud:linux-arm64"
                                    sh 'docker manifest inspect ${deploySettings['registry']}/speedcloud'
                                    sh 'docker manifest push ${deploySettings['registry']}/speedcloud'
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}