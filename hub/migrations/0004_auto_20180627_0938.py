# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-06-27 09:38
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hub', '0003_auto_20180627_0934'),
    ]

    operations = [
        migrations.AlterField(
            model_name='channel',
            name='name',
            field=models.CharField(max_length=120, unique=True),
        ),
    ]