# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-06-11 19:27
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_agent_role'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='teammembership',
            name='account',
        ),
    ]