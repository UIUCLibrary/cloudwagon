pipeline {
    agent none
    parameters {
        string defaultValue: 'cloudwagon', name: 'DOCKER_IMAGE_NAME'
    }

    stages {
        stage('Checks'){
            matrix {
                axes {
                    axis {
                        name 'ARCH'
                        values 'x86'
//                         values 'arm','x86'
                    }
                }
                stages{
                    stage('Container'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        stages{
                            stage('Build'){
                                steps{
                                    script{
                                        def props
                                        configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                            props = readProperties(file: PYPI_PROPS)
                                        }
                                        def dockerbuild
                                        withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                            dockerbuild = docker.build(params.DOCKER_IMAGE_NAME, "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${props['PYPI_URL']} .")
                                        }
                                        dockerbuild.inside{
                                            sh 'pip list'
                                        }


                                    }
                                }
                            }
                            stage('Publish Docker Image'){
                                input {
                                    message 'Push to docker index?'
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