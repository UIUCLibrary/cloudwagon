pipeline {
    agent none
    parameters {
        string defaultValue: 'speedcloud', name: 'DOCKER_IMAGE_NAME'
        booleanParam defaultValue: false, description: 'Build Docker container', name: 'BUILD_DOCKER'
        booleanParam defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }

    stages {
        stage('Test'){
            agent {
                dockerfile {
                    filename 'ci/docker/jenkins/python/Dockerfile'
                    label 'linux && docker'
                    additionalBuildArgs '--build-arg PIP_EXTRA_INDEX_URL --build-arg PIP_INDEX_URL'
//                    args '-v npmcache:/tmp/.npm'
                  }
            }
            stages{
                stage('Set up Tests') {
                    environment {
//                        HOME = '/tmp/'
                        npm_config_cache = '/tmp/npm-cache'
                    }
                    steps{
                        cache(maxCacheSize: 1000, caches: [
                            arbitraryFileCache(path: 'node_modules', includes: '**/*', cacheName: 'npm', cacheValidityDecidingFile: 'package-lock.json')
                        ]) {
                            sh 'npm install'
                        }
                    }
                }
                stage('Perform Tests'){
                    parallel{
                        stage('PyTest'){
                            steps{
                                catchError(buildResult: 'UNSTABLE', message: 'Did not pass all pytest tests', stageResult: "UNSTABLE") {
                                    sh(
                                        script: 'coverage run --parallel-mode -m pytest --junitxml=./reports/tests/pytest/pytest-junit.xml'
                                    )
                                }
                            }
                            post {
                                always {
                                    junit 'reports/tests/pytest/pytest-junit.xml'
                                }
                            }
                        }
                        stage('MyPy') {
                            steps{
                                timeout(10){
                                    tee('logs/mypy.log') {
                                        catchError(buildResult: 'SUCCESS', message: 'MyPy found issues', stageResult: 'UNSTABLE') {
                                            sh(
                                                label: "Running MyPy",
                                                script: '''mypy --version
                                                           mkdir -p reports/mypy/html
                                                           mkdir -p logs
                                                           mypy backend/speedcloud --html-report reports/mypy/html
                                                           '''
                                                )
                                        }
                                    }
                                }
                            }
                            post {
                                always {
                                    publishHTML([allowMissing: true, alwaysLinkToLastBuild: false, keepAll: false, reportDir: "reports/mypy/html/", reportFiles: 'index.html', reportName: 'MyPy HTML Report', reportTitles: ''])
                                    recordIssues(
                                        filters: [excludeFile('/stubs/*')],
                                        tools: [myPy(name: 'MyPy', pattern: 'logs/mypy.log')]
                                        )
                                }
                            }
                        }
                        stage('Jest'){
                            environment {
                                HOME = '/tmp/'
                                JEST_JUNIT_OUTPUT_NAME='js-junit.xml'
                                JEST_JUNIT_ADD_FILE_ATTRIBUTE='true'
                                JEST_JUNIT_OUTPUT_DIR="${WORKSPACE}/reports"
                                npm_config_cache = '/tmp/npm-cache'
                            }
                            steps{
                                sh 'npm run test -- --reporters=default --reporters=jest-junit --collectCoverage --watchAll=false  --collectCoverageFrom="frontend/src/*.tsx" --coverageDirectory=reports/'
                            }
                            post{
                                always{
                                    junit 'reports/*.xml'
                                    sh 'mkdir -p main && cp -R ./frontend ./main/frontend'
                                }
                            }
                        }
                        stage('ESlint'){
                            steps{
                                timeout(10){
                                    catchError(buildResult: 'SUCCESS', message: 'ESlint found issues', stageResult: 'UNSTABLE') {
                                        sh(
                                            label:  "Running ESlint",
                                            script: 'npm run eslint-output'
                                        )
                                    }
                                }
                            }
                            post{
                                always{
                                    sh 'ls reports'
                                    archiveArtifacts allowEmptyArchive: true, artifacts: "reports/*.xml"
                                    recordIssues(tools: [esLint(pattern: 'reports/eslint_report.xml')])
                                }
                            }
                        }
                    }
                     post{
                        always{
                            sh(label: 'combining coverage data',
                               script: '''coverage combine
                                          coverage xml -o ./reports/coverage-python.xml
                                          '''
                            )
                            stash(includes: 'reports/coverage*.xml', name: 'PYTHON_COVERAGE_REPORT')
                            publishCoverage(
                                adapters: [
                                        coberturaAdapter(mergeToOneReport: true, path: 'reports/coverage*.xml')
                                    ],
                                sourceFileResolver: sourceFiles('STORE_ALL_BUILD'),
                           )
                           archiveArtifacts( allowEmptyArchive: true, artifacts: 'reports/')
                        }
                        cleanup{
                            cleanWs(
                                deleteDirs: true,
                                patterns: [
                                    [pattern: 'main/', type: 'INCLUDE'],
                                    [pattern: 'coverage/', type: 'INCLUDE'],
                                    [pattern: 'reports/', type: 'INCLUDE'],
                                    [pattern: 'node_modules/', type: 'INCLUDE'],
                                ]
                            )
                        }
                    }
                }
            }
        }
        stage('Packaging'){
            parallel{
                stage('Build npm package'){
                    agent {
                        docker {
                            image 'node'
                            label 'linux && docker'
                        }
                    }
                    steps{
                        cache(maxCacheSize: 1000, caches: [
                            arbitraryFileCache(path: 'node_modules', includes: '**/*', cacheName: 'npm', cacheValidityDecidingFile: 'package-lock.json')
                        ]) {
                            sh 'npm install'
                        }
//                        todo: make this into a webpack package
                        sh(label: 'Building npm production', script: 'npm run build')
                    }
                }
                stage('Build wheel'){
                    agent {
                        label 'linux && docker'
                    }
                    steps{
                        script{
                            docker.image('python').inside('-v pipcache_speedwagon:/.cache/pip'){
                                sh '''python -m venv venv
                                      venv/bin/python -m pip install pip --upgrade
                                      venv/bin/pip install wheel
                                      venv/bin/pip install build
                                      venv/bin/python -m build  --outdir dist
                                    '''
                            }
                        }
                    }
                    post{
                        success{
                            stash includes: 'dist/*,whl', name: 'wheel'
                        }
                    }
                }
            }
        }
        stage('Build'){
            when{
                equals expected: true, actual: params.BUILD_DOCKER
                beforeInput true
            }
            matrix {
                axes {
                    axis {
                        name 'ARCH'
//                         values 'x86'
                        values 'arm', 'x86'
                    }
                }
                stages{
                    stage('Build for Architecture'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        environment {
                            DOCKER_IMAGE_TEMP_NAME = UUID.randomUUID().toString()
                        }
                        stages{
                            stage('Building Docker Container'){

                                steps{
                                    unstash 'wheel'
                                    echo "DOCKER_IMAGE_TEMP_NAME = ${env.DOCKER_IMAGE_TEMP_NAME}"

                                    withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                        configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                            script{
                                                docker.build(
                                                    env.DOCKER_IMAGE_TEMP_NAME,
                                                    "-f backend/Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                                    ).inside('-v pipcache_speedwagon:/.cache/pip'){
                                                        sh 'cd Speedwagon && pytest'
                                                    }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        post{
                            cleanup{
                                sh(returnStatus: true, script:"docker image rm ${env.DOCKER_IMAGE_TEMP_NAME}")
                            }
                        }
                    }
                }
            }
        }
        stage('Publish'){
            when{
                allOf{
                    equals expected: true, actual: params.PUBLISH_DOCKER
                    equals expected: true, actual: params.BUILD_DOCKER
                }
                beforeInput true
            }
            input {
                message 'Push to docker registry?'
                parameters {
                    string defaultValue: 'latest', name: 'DOCKER_TAG', trim: true
                }
            }
             matrix {
                axes {
                    axis {
                        name 'ARCH'
//                         values 'x86'
                        values 'arm', 'x86'
                    }
                }
                stages{
                    stage('Publish docker Image'){
                        agent {
                            label "linux && docker && ${ARCH}"
                        }
                        steps{
                            unstash 'wheel'
                            withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                    script{
                                        docker.build(
                                            params.DOCKER_IMAGE_NAME,
                                            "-f backend/Dockerfile --secret id=netrc,src=\$NETRC --build-arg PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']} ."
                                            ).inside{
                                                sh 'pip list'
                                            }
                                    }
                                }
                            }
                            configFileProvider([configFile(fileId: 'docker_props', variable: 'CONFIG_FILE')]) {
                                script{
                                    def deploySettings = readProperties(file: CONFIG_FILE)
                                    def registryUrl = "https://${deploySettings['registry']}"
                                    echo "Using Docker registry: ${registryUrl} "
                                    docker.withRegistry(registryUrl, deploySettings['credentialsId']){
                                        docker.image(params.DOCKER_IMAGE_NAME).push(DOCKER_TAG)
                                    }
                                }
                            }
                        }
                        post{
                            cleanup{
                                sh "docker image rm ${params.DOCKER_IMAGE_NAME}"
                            }
                        }
                    }
                }
            }
        }
    }
}
