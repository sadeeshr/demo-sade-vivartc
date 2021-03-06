# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-05-21 16:24
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_team_conf_profile'),
    ]

    operations = [
        migrations.AlterField(
            model_name='team',
            name='members',
            field=models.ManyToManyField(related_name='teams', through='accounts.TeamMembership', to='accounts.Agent'),
        ),
    ]
