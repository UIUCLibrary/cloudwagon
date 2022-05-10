pipeline {
    environment {
        NETRC  = credentials('private_pypi')
    }
//    agent any
    agent {
        dockerfile {
            filename 'Dockerfile'
            label 'linux && docker'
            additionalBuildArgs '--secret id=netrc,src=$NETRC'
        }
    }
    stages {
        stage('Checks'){
            steps{
                script{
//                    withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
//                        sh 'ls -la $NETRC'
//                        def f = docker.build("dummy", "-f Dockerfile", '--secret id=netrc,src=$NETRC', ".")
                        echo 'here'
//                    }
                }
            }
        }
    }
}