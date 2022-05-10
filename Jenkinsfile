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
                echo "here"
            }
        }
    }
}