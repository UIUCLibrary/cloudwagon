pipeline {
    environment {
        NETRC  = credentials('private_pypi')
    }
    agent {
        label 'linux && docker && x86'
//        dockerfile {
//            filename 'Dockerfile'
//            label 'linux && docker'
////            additionalBuildArgs "--secret id=netrc,src=\${credentials('private_pypi')}"
//            additionalBuildArgs "--secret id=netrc,src=$private_pypi"
//        }
    }
    stages {
        stage('Checks'){
            steps{
                script{
                    def f = docker.build('dummy', '-f Dockerfile --secret id=netrc,src=$NETRC .')
//                    def f = docker.build('dummy', "-f Dockerfile --secret id=netrc,src=$private_pypi")
                }
                echo 'here'
            }
        }
    }
}