pipeline {
    agent none
    parameters {
        string defaultValue: 'cloudwagon', name: 'DOCKER_IMAGE_NAME'
        booleanParam  defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }

    stages {
        stage('Build'){
            matrix {
                axes {
                    axis {
                        name 'ARCH'
//                         values 'x86'
                        values 'arm','x86'
                    }
                }
                stages{
                    stage('Build for Architecture'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        stages{

                            stage('Building Docker Container'){
                                environment {
                                    DOCKER_IMAGE_TEMP_NAME = UUID.randomUUID().toString()
                                }
                                steps{
                                    echo "DOCKER_IMAGE_TEMP_NAME = ${env.DOCKER_IMAGE_TEMP_NAME}"
                                    withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                        configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                            script{
                                                docker.build(
                                                    env.DOCKER_IMAGE_TEMP_NAME,
                                                    "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                                    ).inside{
                                                        sh 'pip list'
                                                    }
                                            }
                                        }
                                    }
                                }
                                post{
                                    cleanup{
                                        sh "docker image rm ${env.DOCKER_IMAGE_TEMP_NAME}"
                                    }
                                }
                            }
                            stage('Publish Docker Image'){
                                when{
                                    equals expected: true, actual: params.PUBLISH_DOCKER
                                    beforeInput true
                                }
                                input {
                                    message 'Push to docker registry?'
                                }
                                steps{
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
                                            docker.withRegistry(readProperties(file: CONFIG_FILE)['registry'], 'jenkins-nexus'){
                                                docker.image(params.DOCKER_IMAGE_NAME).push()
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
    }
}