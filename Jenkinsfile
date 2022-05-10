pipeline {
//    environment {
//        NETRC  = credentials('netrc')
//    }
    agent {
        dockerfile {
            filename 'Dockerfile'
            label 'linux'
            additionalBuildArgs "--secret id=netrc,src=${credentials(\'netrc\')}"
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