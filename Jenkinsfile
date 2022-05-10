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
                                def dockerbuild
                                withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                    dockerbuild = docker.build('dummy', '-f Dockerfile --secret id=netrc,src=$NETRC --build-arg PIP_EXTRA_INDEX_URL=https://jenkins.library.illinois.edu/nexus/repository/uiuc_prescon_python_internal/simple .')
                                }
                                dockerbuild.inside{
                                    sh 'pip list'
                                }
                                echo "dockerbuild = ${dockerbuild}"
                            }
                        }
                    }
                }
            }
            }
    }
}