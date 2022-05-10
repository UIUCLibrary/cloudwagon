pipeline {
    agent none
    stages {
        stage('Checks'){
            matrix {
                axes {
                    axis {
                        name 'ARCH'
                        values 'arm','x86'
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
                                    dockerbuild = docker.build('dummy', "-f Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${props['PYPI_URL']} .")
                                }
                                try{
                                    dockerbuild.inside{
                                        sh 'pip list'
                                        sh 'ls -la'
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