=======================
Speedwagon in the Cloud
=======================

Just a test repo to see if speedwagon can be put into the cloud.

+++++++++++++++
Getting started
+++++++++++++++

_______________
Running Locally
_______________

------------------------
Start the backend server
------------------------

1) Generate the config file:

    python -m speedcloud create-default-config

2) Move create config file working path that server will be launched from.

3) Start the server:

    uvicorn speedcloud:app --port 8000

-------------------------
Start the frontend server
-------------------------

1) Install the node dependencies:

    npm install

2) Start the server:

    npm run start