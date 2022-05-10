pipeline {
    environment {
        NETRC  = credentials('private_pypi')
    }
    agent {
        dockerfile {
            filename 'Dockerfile'
            label 'linux && docker'
//            additionalBuildArgs "--secret id=netrc,src=\${credentials('private_pypi')}"
            additionalBuildArgs "--secret id=netrc,src=\$private_pypi"
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