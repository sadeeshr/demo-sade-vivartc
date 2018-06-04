from django import template
from django.template.defaultfilters import stringfilter
from accounts.models import Agent
from iris.models import Presence

register = template.Library()

@register.filter
def bodybg(user):
    try:
        agent = user.agent
        if 'background' not in agent.settings:
            return ""
        if agent.settings['background']['mode'] == 1:
            bk = "background-image:url('"+agent.settings['background']['url']+"')"
        else:
            bk = "background-color:"+agent.settings['background']['code']

        return bk

    except Agent.DoesNotExist:
        return ""


@register.filter
def statusicon(user):
    try:
        if user.presence.status == '1':
            return "fa fa-circle text-online"
        elif user.presence.status == '2':
            return "fa fa-circle text-busy"
        elif user.presence.status == '3':
            return "fa fa-minus-circle text-busy"
        elif user.presence.status == '4':
            return "fa fa-clock-o text-away"
        else:
            return "fa fa-circle text-offline"

    except Exception:
        return "fa fa-circle text-offline"

@register.filter
def statustext(user):
    try:
        if user.presence.text is None:
             return user.presence.get_status_display()
        else:
             return user.presence.text

    except Exception:
        return "Offline"

