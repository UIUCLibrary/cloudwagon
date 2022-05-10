pipeline {
//    environment {
//        NETRC  = credentials('netrc')
//    }
    agent any
    stages {
        stage('Checks'){
            agent {
//                dockerfile {
//                    filename 'Dockerfile'
                    label 'linux && docker'
//                    additionalBuildArgs '--secret id=netrc,src=$NETRC'
//                }
            }
            steps{
                script{
                    withCredentials([file(credentialsId: 'netrc', variable: 'NETRC')]) {
                       def f = docker.build("dummy", "-f Dockerfile", '--secret id=netrc,src=$NETRC', ".")
                        echo "here"
                    }
            }
        }
    }
}