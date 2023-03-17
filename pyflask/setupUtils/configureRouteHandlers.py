from apis import (
    startup_resource,
    neuroconv_resource,
)


def configureRouteHandlers(api):
    """
    Configure the route handlers for the Flask application.
    """
    api.add_namespace(startup_resource)
    api.add_namespace(neuroconv_resource)
