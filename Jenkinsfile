pipeline {
    agent none
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
                    stage('build'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        steps{
                            script{
                                def props
                                configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                    props = readProperties(file: PYPI_PROPS)
                                }
                                def dockerbuild
                                withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                    dockerbuild = docker.build('cloudwagon', "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${props['PYPI_URL']} .")
                                }
                                try{
                                    dockerbuild.inside{
                                        sh 'pip list'

                                    }
                                    def docker_props
                                    configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                                        docker_props = readProperties(file: CONFIG_FILE)
                                    }
                                    docker.withRegistry(docker_props['registry'], 'jenkins-nexus'){
                                        dockerbuild.push()
                                    }

                                } finally {
                                    sh "docker image rm ${dockerbuild.id}"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}