pipeline {
    environment {
        NETRC  = credentials('netrc')
    }
    agent any
    stages {
        stage('Checks'){
        agent {
            dockerfile {
                filename 'Dockerfile'
                label 'linux'
                additionalBuildArgs "--secret id=netrc,src=${credentials('netrc')}"
            }
        }
            steps{
                echo "here"
            }
        }
    }
}