from tenant_schemas.middleware import BaseTenantMiddleware
from tenant_schemas.utils import get_public_schema_name
import logging

from channels.auth import AuthMiddleware
from channels.sessions import CookieMiddleware, SessionMiddleware
from tenant_schemas.utils import schema_context
from channels.db import database_sync_to_async
from django.utils.functional import LazyObject
from django.conf import settings
from django.contrib.auth import (
    BACKEND_SESSION_KEY, HASH_SESSION_KEY, SESSION_KEY, _get_backends, get_user_model, load_backend, user_logged_in,
    user_logged_out,
)
from django.contrib.auth.models import AnonymousUser
from django.utils.crypto import constant_time_compare
from django.utils.functional import LazyObject
from django.utils.translation import LANGUAGE_SESSION_KEY

from channels.db import database_sync_to_async
from channels.sessions import CookieMiddleware, SessionMiddleware

@database_sync_to_async
def get_user(scope):
    with schema_context('demo'):
        """
        Return the user model instance associated with the given scope.
        If no user is retrieved, return an instance of `AnonymousUser`.
        """
        if "session" not in scope:
            raise ValueError("Cannot find session in scope. You should wrap your consumer in SessionMiddleware.")
        session = scope["session"]
        user = None
        try:
            user_id = _get_user_session_key(session)
            backend_path = session[BACKEND_SESSION_KEY]
        except KeyError:
            pass
        else:
            if backend_path in settings.AUTHENTICATION_BACKENDS:
                backend = load_backend(backend_path)
                user = backend.get_user(user_id)
                # Verify the session
                if hasattr(user, "get_session_auth_hash"):
                    session_hash = session.get(HASH_SESSION_KEY)
                    session_hash_verified = session_hash and constant_time_compare(
                        session_hash,
                        user.get_session_auth_hash()
                    )
                    if not session_hash_verified:
                        session.flush()
                        user = None
        return user or AnonymousUser()


class WsTenantMiddleware(AuthMiddleware):

    def populate_scope(self, scope):
        with schema_context('demo'):
            if "session" not in scope:
                raise ValueError("AuthMiddleware cannot find session in scope. SessionMiddleware must be above it.")
            if "user" not in scope:
                scope["user"] = LazyObject()


    async def resolve_scope(self, scope):
        with schema_context('demo'):
            scope["user"]._wrapped = await get_user(scope)
    
    
    
WsTenantMiddlewareStack = lambda inner: CookieMiddleware(SessionMiddleware(WsTenantMiddleware(inner)))
