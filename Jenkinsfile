pipeline {
    environment {
        NETRC  = credentials('netrc')
    }
    agent none
    stages {
        stage('Checks'){
            agent {
                dockerfile {
                    filename 'Dockerfile'
                    label 'linux'
                    additionalBuildArgs '--secret id=netrc,src=$NETRC'
                }
            }
            steps{
                echo "here"
            }
        }
    }
}