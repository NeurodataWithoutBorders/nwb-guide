import pytest
import app as flask


def pytest_addoption(parser):
    parser.addoption("--target", action="store", help="Run the executable instead of the standard Flask app")


@pytest.fixture(scope="session")
def client(request):
    target = request.config.getoption("--target")
    if target:
        return target
    else:
        app = flask.app
        app.config.update(
            {
                "TESTING": True,
            }
        )

        return app.test_client()


@pytest.fixture()
def runner(app):
    return app.test_cli_runner()


# @pytest.fixture()
# def all_interfaces(client):
#     response = client.get("/neuroconv", follow_redirects=True)
#     return response.json
