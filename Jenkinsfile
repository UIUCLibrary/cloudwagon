pipeline {
    environment {
        NETRC  = credentials('private_pypi')
    }
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
                echo 'here'
            }
        }
    }
}