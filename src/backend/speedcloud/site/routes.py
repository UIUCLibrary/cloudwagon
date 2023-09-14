"""Site for front page.

This module is pending removal.
"""
from flask import Flask, render_template
site = Flask(__name__)
__all__: list[str] = []


@site.route('/')
def index() -> str:
    return render_template("frontpage.html")
