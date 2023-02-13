pipeline {
    agent none
    parameters {
        string defaultValue: 'speedcloud', name: 'DOCKER_IMAGE_NAME'
        booleanParam defaultValue: true, description: 'Run checks', name: 'RUN_CHECKS'
        booleanParam defaultValue: false, description: 'Build Docker container', name: 'BUILD_DOCKER'
        booleanParam defaultValue: false, description: 'Package', name: 'PACKAGE'
        booleanParam defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }
    stages {
        stage('Test'){
            when{
                equals expected: true, actual: params.RUN_CHECKS
                beforeInput true
                beforeAgent true
            }
            agent {
                dockerfile {
                    filename 'ci/docker/jenkins/python/Dockerfile'
                    label 'linux && docker && x86'
                    additionalBuildArgs '--build-arg PIP_EXTRA_INDEX_URL --build-arg PIP_INDEX_URL'
//                    args '-v npmcache:/tmp/.npm'
                  }
            }
            stages{
                stage('Set up Tests') {
                    environment {
                        npm_config_cache = '/tmp/npm-cache'
                    }
                    steps{
                        cache(maxCacheSize: 1000, caches: [
                            arbitraryFileCache(path: 'frontend/node_modules', includes: '**/*', cacheName: 'npm', cacheValidityDecidingFile: 'package-lock.json')
                        ]) {
                            sh 'npm --prefix frontend install'
                        }
                        sh 'mkdir -p logs'
                        sh 'mkdir -p main && ln -s $PWD/frontend/src main/src'
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
                        stage('Flake8') {
                            steps{
                                catchError(buildResult: 'SUCCESS', message: 'Flake8 found issues', stageResult: "UNSTABLE") {
                                    sh script: 'flake8 backend/speedcloud --tee --output-file=logs/flake8.log'
                                }
                            }
                            post {
                                always {
                                      recordIssues(tools: [flake8(pattern: 'logs/flake8.log')])
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
                        stage('Pylint') {
                            steps{
                                withEnv(['PYLINTHOME=.']) {
                                    sh 'pylint --version'
                                    catchError(buildResult: 'SUCCESS', message: 'Pylint found issues', stageResult: 'UNSTABLE') {
                                        tee('reports/pylint_issues.txt'){
                                            sh(
                                                label: 'Running pylint',
                                                script: 'pylint speedwagon -r n --msg-template="{path}:{module}:{line}: [{msg_id}({symbol}), {obj}] {msg}"',
                                            )
                                        }
                                    }
                                    sh(
                                        label: 'Running pylint for sonarqube',
                                        script: 'pylint backend/speedcloud -d duplicate-code --output-format=parseable | tee reports/pylint.txt',
                                        returnStatus: true
                                    )
                                }
                            }
                            post{
                                always{
                                    recordIssues(tools: [pyLint(pattern: 'reports/pylint_issues.txt')])
                                }
                            }
                        }
                        stage('Task Scanner'){
                            steps{
                                recordIssues(tools: [taskScanner(highTags: 'FIXME', includePattern: 'backend/**/*.py,frontend/**/*.tsx', normalTags: 'TODO')])
                            }
                        }
                        stage('Hadolint'){
                            steps{
                                catchError(buildResult: 'SUCCESS', message: 'hadolint found issues', stageResult: "UNSTABLE") {
                                    sh 'hadolint --format json backend/Dockerfile frontend/Dockerfile > logs/hadolint.log'
                                }
                            }
                            post{
                                always{
                                    recordIssues(tools: [hadoLint(pattern: 'logs/hadolint.log')])
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
                                sh 'npm --prefix frontend run test -- --reporters=default --reporters=jest-junit --collectCoverage --watchAll=false  --collectCoverageFrom="src/*.tsx" --coverageDirectory=../reports/ --coverageReporters=cobertura'
                            }
                            post{
                                always{
                                    junit 'reports/*.xml'
                                }
                            }
                        }
                        stage('ESlint'){
                            steps{
                                timeout(10){
                                    catchError(buildResult: 'SUCCESS', message: 'ESlint found issues', stageResult: 'UNSTABLE') {
                                        sh(
                                            label:  "Running ESlint",
                                            script: 'npm --prefix frontend run eslint-output'
                                        )
                                    }
                                }
                            }
                            post{
                                always{
                                    sh 'ls reports'
                                    archiveArtifacts allowEmptyArchive: true, artifacts: "reports/*.xml"
                                    recordIssues(tools: [esLint(pattern: 'frontend/reports/eslint_report.xml')])
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
                                        coberturaAdapter(mergeToOneReport: true, path: 'reports/*coverage*.xml')
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
                                    [pattern: '**/node_modules/', type: 'INCLUDE'],
                                ]
                            )
                        }
                    }
                }
            }
        }
        stage('Packaging'){
            when{
                equals expected: true, actual: params.PACKAGE
            }
            parallel{
                stage('Create Production Build'){
                    agent {
                        docker {
                            image 'node'
                            label 'linux && docker'
                        }
                    }
                    environment {
                        npm_config_cache = '/tmp/npm-cache'
                    }
                    steps{
                        cache(maxCacheSize: 1000, caches: [
                            arbitraryFileCache(path: 'frontend/node_modules', includes: '**/*', cacheName: 'npm', cacheValidityDecidingFile: 'frontend/package-lock.json')
                        ]) {
                            sh 'npm --prefix frontend install'
                        }
//                        todo: make this into a webpack package
                        sh 'cd frontend && npx --yes browserslist@latest --update-db'
                        catchError(buildResult: 'SUCCESS', message: 'There are issues with building production build', stageResult: 'UNSTABLE') {
                            sh(label: 'Creating production build', script: 'npm --prefix frontend  run build')
                        }
                    }
                }
                stage('Build wheel'){
                    agent {
                        docker {
                            image 'python'
                            label 'linux && docker'
                        }
                    }

                    steps{
                        sh '''python -m venv venv
                              venv/bin/python -m pip install pip --upgrade
                              venv/bin/pip install wheel
                              venv/bin/pip install build
                              venv/bin/python -m build  --outdir dist
                            '''
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
                                    echo "DOCKER_IMAGE_TEMP_NAME = ${env.DOCKER_IMAGE_TEMP_NAME}"

                                    withCredentials([file(credentialsId: 'private_pypi', variable: 'NETRC')]) {
                                        configFileProvider([configFile(fileId: 'pypi_props', variable: 'PYPI_PROPS')]) {
                                            script{
                                                withEnv(["PIP_EXTRA_INDEX_URL=${readProperties(file: PYPI_PROPS)['PYPI_URL']}"]) {
                                                    docker.build(
                                                        env.DOCKER_IMAGE_TEMP_NAME,
                                                        '-f backend/Dockerfile --secret id=netrc,src=$NETRC --build-arg PIP_EXTRA_INDEX_URL .'
                                                        ).withRun('-p 8000:80'){ c->
                                                            docker.image('python').inside("--link ${c.id}:db") {
                                                                withEnv(['PIP_NO_CACHE_DIR=off']) {
                                                                    sh '''
                                                                        python -m venv venv --upgrade-deps
                                                                        . ./venv/bin/activate
                                                                        pip install --no-cache-dir pytest requests
                                                                        pytest tests/test_integration.py --server-url=http://db
                                                                        rm -rf venv
                                                                        '''
                                                                }
                                                            }
                                                        }
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
