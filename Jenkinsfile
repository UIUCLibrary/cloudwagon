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
                        values 'x86'
//                         values 'arm','x86'
                    }
                }
                stages{
                    stage('Building Docker Container'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        stages{
                            stage('Build'){
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
                                    script{
                                        configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                                            def docker_props = readProperties(file: CONFIG_FILE)
                                            docker.withRegistry(docker_props['registry'], 'jenkins-nexus'){
                                                docker.image(params.DOCKER_IMAGE_NAME).push()
                                            }
                                        }
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