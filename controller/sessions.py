from accounts.models import Agent, Team
from iris.models import Message, Presence
from django.contrib.auth.models import User
from tenant_schemas.utils import get_public_schema_name
from tenant_schemas.utils import schema_context

from channels.db import database_sync_to_async
import json
import logging
from django.http import parse_cookie
from .models import Client
import tldextract
from django.contrib.sessions.models import Session
from django.contrib.auth.models import User

@database_sync_to_async
def fetch_schema(headers):
    try:
        for name, value in headers:
            if name == b"host":
               host = value.decode("ascii")

        ext = tldextract.extract(host)
        url = "{}.{}".format(ext.subdomain, ext.registered_domain)
        #logging.info("URL is {}".format(url))
        tenant = Client.objects.get(domain_url=url)  
        return tenant.schema_name
    except Exception:
        return get_public_schema_name()
 

@database_sync_to_async
def fetch_user(schema, headers):
    try:
        #logging.info("Headers {}".format(headers))
        cookies = None
        for name, value in headers:
            if name == b"cookie":
                cookies = parse_cookie(value.decode("ascii"))
        #logging.info("Cookies {}".format(cookies))
        if cookies is None or 'sessionid' not in cookies:
            return None
       
     
        with schema_context(schema):
            session = Session.objects.get(session_key=cookies['sessionid']) 
            uid = session.get_decoded().get('_auth_user_id')
            user = User.objects.get(pk=uid)
            print("{} {}".format(user.username, user.email))
            return user

    except Exception as err:
        logging.warning("fetch warning {}".format(str(err)))
        return get_public_schema_name()
    
