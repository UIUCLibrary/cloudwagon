import flask
app = flask.Flask(__name__)

@app.route('/')
def index():
    return 'hello speedwagon in the cloud!'

app.run(host='0.0.0.0', port=81)
