from django.contrib import admin
from iris.models import *

# Register your models here.
admin.site.register(Message)
admin.site.register(DirectMessage)
admin.site.register(Meeting)
admin.site.register(Call)
admin.site.register(Presence)
