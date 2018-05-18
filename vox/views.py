from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.core import serializers
from django.db.models import Q
from vox.models import *

import json
import logging

# Create your views here.
@login_required
def search(request):
    try:
        if request.POST:
            q = request.POST.get("q")
            logging.info("Value-{}".format(q))
            contacts = Contact.objects.filter(Q(mobile__contains=q)|Q(work__contains=q)).values('first_name','last_name','mobile','work','title','company')
            data = list(contacts)
            logging.info("{}".format(data))
            return JsonResponse(data, safe=False)
            
    except Exception as err:
        logging.warning("Error in search {}".format(str(err)))
        return HttpResponse(status=404, reason=str(err))
