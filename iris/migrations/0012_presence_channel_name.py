# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-07-17 17:14
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('iris', '0011_auto_20180717_0846'),
    ]

    operations = [
        migrations.AddField(
            model_name='presence',
            name='channel_name',
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
    ]
