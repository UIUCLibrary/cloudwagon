pipeline {
    environment {
        netrc  = credentials('netrc')
    }
    agent {
        dockerfile {
            filename 'Dockerfile'
            label 'linux'
            additionalBuildArgs '--secret id=netrc,src=$netrc'
        }
    }
    stages {
        stage('Checks'){
            steps{
                echo "here"
            }
        }
    }
}