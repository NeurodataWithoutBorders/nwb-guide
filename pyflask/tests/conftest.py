import pytest
import app as flask

@pytest.fixture()
def app(): 
    app = flask.app
    app.config.update({
        "TESTING": True,
    })

    yield app

@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()

@pytest.fixture()
def all_interfaces(client):
    response = client.get("/neuroconv", follow_redirects=True)
    return response.json