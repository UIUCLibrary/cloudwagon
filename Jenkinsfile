pipeline {
    agent none
    stages {
        stage('Checks'){
            environment {
                NETRC  = credentials('private_pypi')
            }
            agent {
                label 'linux && docker && x86'
            }
            steps{
                script{
                    def f = docker.build('dummy', '-f Dockerfile --secret id=netrc,src=$NETRC --build-arg PIP_EXTRA_INDEX_URL=https://jenkins.library.illinois.edu/nexus/repository/uiuc_prescon_python_internal/simple .')
                }
            }
        }
    }
}