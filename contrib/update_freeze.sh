#!/usr/bin/env bash

# Use this to update freeze files

VENV_PATH=/tmp/venv_freeze

generate_freeze() {
    mv $FREEZE_FILE $FREEZE_FILE.old

    trap clean_up_on_failure ERR SIGINT SIGTERM
    touch $FREEZE_FILE
    echo 'Installing CI packages into temp virtual env'
    $VENV_PATH/bin/pip install -r $SOURCE_FILE

    echo 'Exporting frozen requirements'
    $VENV_PATH/bin/pip freeze > $FREEZE_FILE
}

clean_up_on_failure(){
    echo 'cleaning up from failure'
    mv -f $FREEZE_FILE.old $FREEZE_FILE
    exit 255
}

clean_up(){
    echo 'Removing temp virtual env'
    rm -rf $VENV_PATH
}

usage(){
    echo '================================================================================'
    echo 'Usage:'
    echo ''
    echo '  update_freeze.sh [SOURCE_FILE] [FREEZE_FILE]'
    echo ''
    echo ''
    echo 'Example:'
    echo ''
    echo '  update_freeze.sh ./requirements-ci.txt ./requirements/requirements-ci-freeze.txt'
    echo ''
    echo '================================================================================'
}
check_args(){
    if [ ! -f "$SOURCE_FILE" ]
    then
        echo "no valid source file"
        usage
        exit 1
    fi
    if [ ! -f "$FREEZE_FILE" ]
    then
        echo "no valid freeze file"
        usage
        exit 1
    fi
}

SOURCE_FILE=$1
FREEZE_FILE=$2
check_args

echo 'Creating temp virtual env'
python3 -m venv $VENV_PATH --upgrade-deps
trap clean_up EXIT

generate_freeze
