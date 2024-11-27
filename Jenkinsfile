library identifier: 'JenkinsPythonHelperLibrary@2024.1.2', retriever: modernSCM(
  [$class: 'GitSCMSource',
   remote: 'https://github.com/UIUCLibrary/JenkinsPythonHelperLibrary.git',
   ])

def get_sonarqube_unresolved_issues(report_task_file){
    script{

        def props = readProperties  file: '.scannerwork/report-task.txt'
        def response = httpRequest url : props['serverUrl'] + "/api/issues/search?componentKeys=" + props['projectKey'] + "&resolved=no"
        def outstandingIssues = readJSON text: response.content
        return outstandingIssues
    }
}

def startup(){

    parallel(
    [
        failFast: true,
        'Loading Reference Build Information': {
            node(){
                checkout scm
                discoverGitReferenceBuild(latestBuildIfNotFound: true)
            }
        },
        'Enable Git Forensics': {
            node(){
                checkout scm
                mineRepository()
            }
        },
        'Getting Distribution Info': {
            node('linux && docker') {
                timeout(2){
                    ws{
                        checkout scm
                        try{
                            docker.image('python').inside {
                                withEnv(['PIP_NO_CACHE_DIR=off']) {
                                    sh(
                                       label: 'Running setup.py with dist_info',
                                       script: 'python setup.py dist_info'
                                    )
                                }
                                stash includes: '*.dist-info/**', name: 'DIST-INFO'
                                archiveArtifacts artifacts: '*.dist-info/**'
                            }
                        } finally{
                            deleteDir()
                        }
                    }
                }
            }
        }
    ]
    )

}

pipeline {
    agent none
    parameters {
        string defaultValue: 'speedcloud', name: 'DOCKER_IMAGE_NAME'
        booleanParam defaultValue: true, description: 'Run checks', name: 'RUN_CHECKS'
        booleanParam(name: 'USE_SONARQUBE', defaultValue: true, description: 'Send data test data to SonarQube')
        credentials(name: 'SONARCLOUD_TOKEN', credentialType: 'org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl', defaultValue: 'sonarcloud_token', required: false)
        booleanParam(name: 'TEST_RUN_TOX', defaultValue: false, description: 'Run Tox Tests')
        booleanParam defaultValue: false, description: 'Build Docker container', name: 'BUILD_DOCKER'
        booleanParam defaultValue: false, description: 'Package', name: 'PACKAGE'
        booleanParam defaultValue: true, description: 'Include x86_64 in building and testing', name: 'INCLUDE-x86_64'
        booleanParam defaultValue: false, description: 'Include ARM64 in building and testing', name: 'INCLUDE-arm64'
        booleanParam defaultValue: false, description: 'Publish Docker Image to registry', name: 'PUBLISH_DOCKER'
    }
    stages {
        stage('Test'){
            stages{
                stage('Code Quality'){
                    when{
                        equals expected: true, actual: params.RUN_CHECKS
                        beforeInput true
                        beforeAgent true
                    }
                    agent {
                        dockerfile {
                            filename 'ci/docker/jenkins/Dockerfile'
                            label 'linux && docker && x86'
                            additionalBuildArgs '--build-arg PIP_EXTRA_INDEX_URL --build-arg PIP_INDEX_URL --build-arg SONAR_INSTALL_PATH=/opt/sonar'
                            args '--mount source=sonar-cache-cloud,target=/opt/sonar/.sonar/cache --mount source=pip-audit-cache-speedcloud,target=/tmp/pip-audit-cache'
                          }
                    }
                    options {
                        retry(conditions: [agent()], count: 3)
                        timeout(time: 1, unit: 'DAYS')
                    }
                    environment {
                        npm_config_cache = '/tmp/npm-cache'
                        PIP_CACHE_DIR='/tmp/pipcache'
                        UV_PYTHON = '3.11'
                        UV_CACHE_DIR='/tmp/uvcache'
                        UV_PYTHON_INSTALL_DIR='/tmp/uvpython'
                        UV_TOOL_DIR='/tmp/uvtools'
                        UV_INDEX_STRATEGY='unsafe-best-match'
                    }
                    stages{
                        stage('Set up Tests') {
                            steps{
                                sh(
                                    label: 'Create virtual environment',
                                    script: '''python3 -m venv bootstrap_uv
                                               bootstrap_uv/bin/pip install --disable-pip-version-check uv
                                               bootstrap_uv/bin/uv venv venv
                                               . ./venv/bin/activate
                                               bootstrap_uv/bin/uv pip install uv
                                               rm -rf bootstrap_uv
                                               uv pip install -r requirements-ci.txt
                                               '''
                                           )
                                sh(
                                    label: 'Install package in development mode',
                                    script: '''. ./venv/bin/activate
                                               uv pip install -e .
                                            '''
                                    )
                                cache(maxCacheSize: 1000, caches: [
                                    arbitraryFileCache(
                                        path: 'node_modules',
                                        includes: '**/*',
                                        cacheName: 'npm',
                                        cacheValidityDecidingFile: 'package-lock.json',
                                        compressionMethod: 'TARGZ'
                                        )
                                ]) {
                                    sh 'npm install'
                                }
                                sh 'mkdir -p logs'
                                sh 'mkdir -p main && ln -s $PWD/src/frontend/src main/src'
                            }
                        }
                        stage('Perform Tests'){
                            parallel{
                                stage('PyTest'){
                                    steps{
                                        catchError(buildResult: 'UNSTABLE', message: 'Did not pass all pytest tests', stageResult: "UNSTABLE") {
                                            sh(
                                                script: '''. ./venv/bin/activate
                                                           coverage run --parallel-mode -m pytest --junitxml=./reports/tests/pytest/pytest-junit.xml
                                                        '''
                                            )
                                        }
                                    }
                                    post {
                                        always {
                                            junit 'reports/tests/pytest/pytest-junit.xml'
                                        }
                                    }
                                }
                                stage('Audit Requirement Freeze File'){
                                    steps{
                                        catchError(buildResult: 'UNSTABLE', message: 'pip-audit found issues', stageResult: 'UNSTABLE') {
                                            sh './venv/bin/uvx --python-preference=only-managed --with-requirements requirements/requirements-freeze.txt pip-audit --cache-dir=/tmp/pip-audit-cache --local'
                                        }
                                    }
                                }
                                stage('Flake8') {
                                    steps{
                                        catchError(buildResult: 'SUCCESS', message: 'Flake8 found issues', stageResult: "UNSTABLE") {
                                            sh(label: 'Run Flake8',
                                               script: '''. ./venv/bin/activate
                                                          flake8 src/backend/speedcloud --tee --output-file=logs/flake8.log
                                                       ''')
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
                                                        script: '''. ./venv/bin/activate
                                                                   mypy --version
                                                                   mkdir -p reports/mypy/html
                                                                   mkdir -p logs
                                                                   mypy -p speedcloud --html-report reports/mypy/html --linecoverage-report reports/mypy/linecoverage
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
                                stage("PyDocStyle"){
                                    steps{
                                        catchError(buildResult: 'SUCCESS', message: 'Did not pass all pyDocStyle tests', stageResult: 'UNSTABLE') {
                                            tee('reports/pydocstyle-report.txt'){
                                                sh(
                                                    label: 'Run pydocstyle',
                                                    script: '''. ./venv/bin/activate
                                                               pydocstyle src/backend/speedcloud
                                                            '''
                                                )
                                            }
                                        }
                                    }
                                    post {
                                        always{
                                            recordIssues(tools: [pyDocStyle(pattern: 'reports/pydocstyle-report.txt')])
                                        }
                                    }
                                }
                                stage('Pylint') {
                                    steps{
                                        withEnv(['PYLINTHOME=.']) {
                                            catchError(buildResult: 'SUCCESS', message: 'Pylint found issues', stageResult: 'UNSTABLE') {
                                                tee('reports/pylint_issues.txt'){
                                                    sh(
                                                        label: 'Running pylint',
                                                        script: '''. ./venv/bin/activate
                                                                   pylint src/backend/speedcloud -r n --msg-template="{path}:{module}:{line}: [{msg_id}({symbol}), {obj}] {msg}"
                                                                ''',
                                                    )
                                                }
                                            }
                                            sh(
                                                label: 'Running pylint for sonarqube',
                                                script: '''. ./venv/bin/activate
                                                           pylint src/backend/speedcloud -d duplicate-code --output-format=parseable | tee reports/pylint.txt
                                                        ''',
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
                                        recordIssues(tools: [taskScanner(highTags: 'FIXME', includePattern: 'src/backend/**/*.py,src/frontend/**/*.tsx', normalTags: 'TODO')])
                                    }
                                }
                                stage('Hadolint'){
                                    steps{
                                        catchError(buildResult: 'SUCCESS', message: 'hadolint found issues', stageResult: "UNSTABLE") {
                                            sh 'hadolint --format json src/backend/Dockerfile src/frontend/Dockerfile > logs/hadolint.json'
                                        }
                                    }
                                    post{
                                        always{
                                            recordIssues(tools: [hadoLint(pattern: 'logs/hadolint.json')])
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
                                        sh 'npm run test -- --reporters=default --reporters=jest-junit --collectCoverage --watchAll=false  --coverageDirectory=../../reports/ --coverageReporters=cobertura --coverageReporters=lcov --detectOpenHandles'
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
                                                    script: 'npm run lint -- src/frontend/src --format=checkstyle -o reports/eslint_report.xml'
                                                )
                                            }
                                            sh(
                                                label:  "Running ESlint for sonar",
                                                script: 'npm run lint -- src/frontend/src --format=json -o reports/eslint_report.json',
                                                returnStatus: true
                                            )
                                        }
                                    }
                                    post{
                                        always{
                                            recordIssues(tools: [esLint(pattern: 'reports/eslint_report.xml')])
                                        }
                                    }
                                }
                            }
                            post{
                                unsuccessful{
                                    sh '''. ./venv/bin/activate
                                          uv pip list
                                       '''
                                }
                                always{
                                    sh(label: 'combining coverage data',
                                       script: '''. ./venv/bin/activate
                                                  coverage combine
                                                  coverage xml -o ./reports/python-coverage.xml
                                               '''
                                    )
                                    recordCoverage(tools: [[parser: 'COBERTURA', pattern: 'reports/coverage.xml']])
                                    archiveArtifacts( allowEmptyArchive: true, artifacts: 'reports/')
                                }
                            }
                        }
                        stage('Run Sonarqube Analysis'){
                            options{
                                lock('cloudwagon-sonarscanner')
                            }
                            environment{
                                PACKAGE_VERSION="${readTOML( file: 'pyproject.toml')['project'].version}"
                                PACKAGE_NAME="${readTOML( file: 'pyproject.toml')['project'].name}"
                                SONAR_USER_HOME='/tmp/sonar'
                            }
                            when{
                                allOf{
                                    equals expected: true, actual: params.USE_SONARQUBE
                                    expression{
                                        try{
                                            withCredentials([string(credentialsId: params.SONARCLOUD_TOKEN, variable: 'dddd')]) {
                                                echo 'Found credentials for sonarqube'
                                            }
                                        } catch(e){
                                            return false
                                        }
                                        return true
                                    }
                                }
                            }
                            steps{
                                script{
                                   withSonarQubeEnv(installationName:'sonarcloud', credentialsId: params.SONARCLOUD_TOKEN) {
                                       sh(
                                           label: 'Running Sonar Scanner',
                                           script: "./venv/bin/uvx pysonar-scanner -Dsonar.projectVersion=$PACKAGE_VERSION -Dsonar.buildString=\"$BUILD_TAG\" ${env.CHANGE_ID? '-Dsonar.pullrequest.key=$CHANGE_ID -Dsonar.pullrequest.base=$BRANCH_NAME': '-Dsonar.branch.name=$BRANCH_NAME'}"
                                       )
                                   }
                                   timeout(time: 1, unit: 'HOURS') {
                                       def sonarqube_result = waitForQualityGate(abortPipeline: false)
                                       if (sonarqube_result.status != 'OK') {
                                           unstable "SonarQube quality gate: ${sonarqube_result.status}"
                                       }
                                       def outstandingIssues = get_sonarqube_unresolved_issues('.scannerwork/report-task.txt')
                                       writeJSON file: 'reports/sonar-report.json', json: outstandingIssues
                                   }
                                   milestone label: 'sonarcloud'
                               }
                            }
                            post {
                                always{
                                    recordIssues(tools: [sonarQube(pattern: 'reports/sonar-report.json')])
                                }
                            }
                        }
                    }
                    post{
                        cleanup{
                            cleanWs(
                                deleteDirs: true,
                                patterns: [
                                    [pattern: 'venv/', type: 'INCLUDE'],
                                    [pattern: 'main/', type: 'INCLUDE'],
                                    [pattern: 'coverage/', type: 'INCLUDE'],
                                    [pattern: 'reports/', type: 'INCLUDE'],
                                    [pattern: '**/node_modules/', type: 'INCLUDE'],
                                ]
                            )
                        }
                    }
                }
                stage('Tox'){
                    when{
                        equals expected: true, actual: params.TEST_RUN_TOX
                    }
                    environment{
                            PIP_CACHE_DIR='/tmp/pipcache'
                            UV_INDEX_STRATEGY='unsafe-best-match'
                            UV_TOOL_DIR='/tmp/uvtools'
                            UV_PYTHON_INSTALL_DIR='/tmp/uvpython'
                            UV_CACHE_DIR='/tmp/uvcache'
                        }
                        steps{
                            script{
                                def envs = []
                                node('docker && linux'){
                                    docker.image('python').inside('--mount source=python-tmp-uvcache-cloudwagon,target=/tmp'){
                                        try{
                                            checkout scm
                                            sh(script: 'python3 -m venv venv && venv/bin/pip install --disable-pip-version-check uv')
                                            envs = sh(
                                                label: 'Get tox environments',
                                                script: './venv/bin/uvx --quiet --with tox-uv tox list -d --no-desc',
                                                returnStdout: true,
                                            ).trim().split('\n')
                                        } finally{
                                            cleanWs(
                                                patterns: [
                                                    [pattern: 'venv/', type: 'INCLUDE'],
                                                    [pattern: '.tox', type: 'INCLUDE'],
                                                    [pattern: '**/__pycache__/', type: 'INCLUDE'],
                                                ]
                                            )
                                        }
                                    }
                                }
                                parallel(
                                    envs.collectEntries{toxEnv ->
                                        def version = toxEnv.replaceAll(/py(\d)(\d+)/, '$1.$2')
                                        [
                                            "Tox Environment: ${toxEnv}",
                                            {
                                                node('docker && linux'){
                                                    docker.image('python').inside('--mount source=python-tmp-cloudwagon,target=/tmp'){
                                                        checkout scm
                                                        try{
                                                            sh( label: 'Running Tox',
                                                                script: """python3 -m venv venv
                                                                           trap "rm -rf venv" EXIT
                                                                           venv/bin/pip install --disable-pip-version-check uv
                                                                           venv/bin/uv python install cpython-${version}
                                                                           venv/bin/uvx -p ${version} --with tox-uv tox run -e ${toxEnv}
                                                                        """
                                                                )
                                                        } catch(e) {
                                                            sh(script: '''. ./venv/bin/activate
                                                                  uv python list
                                                                  '''
                                                                    )
                                                            throw e
                                                        } finally{
                                                            cleanWs(
                                                                patterns: [
                                                                    [pattern: 'venv/', type: 'INCLUDE'],
                                                                    [pattern: '.tox', type: 'INCLUDE'],
                                                                    [pattern: '**/__pycache__/', type: 'INCLUDE'],
                                                                ]
                                                            )
                                                        }
                                                    }
                                                }
                                            }
                                        ]
                                    }
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
                    options{
                        retry(2)
                    }
                    environment {
                        npm_config_cache = '/tmp/npm-cache'
                    }
                    steps{
                        cache(maxCacheSize: 1000, caches: [
                            arbitraryFileCache(path: 'node_modules', includes: '**/*', cacheName: 'npm', cacheValidityDecidingFile: 'frontend/package-lock.json')
                        ]) {
                            sh 'npm install'
                        }
//                        todo: make this into a webpack package
                        sh 'npx --yes browserslist@latest --update-db'
                        catchError(buildResult: 'SUCCESS', message: 'There are issues with building production build', stageResult: 'UNSTABLE') {
                            sh(label: 'Creating production build', script: 'npm run build')
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
                        values 'arm64', 'x86_64'
                    }
                }
                when{
                    equals expected: true, actual: params["INCLUDE-${ARCH}"]
                    beforeAgent true
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
                                                        '-f src/backend/Dockerfile --secret id=netrc,src=$NETRC --build-arg PIP_EXTRA_INDEX_URL .'
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
