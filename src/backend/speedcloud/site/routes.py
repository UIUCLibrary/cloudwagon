from flask import Flask, render_template
site = Flask(__name__)


@site.route('/')
def index() -> str:
    return render_template("frontpage.html")
