pipeline {
    environment {
        NETRC  = credentials('netrc')
    }
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