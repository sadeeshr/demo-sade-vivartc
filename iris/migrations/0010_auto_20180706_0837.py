# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-07-06 08:37
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('iris', '0009_auto_20180706_0816'),
    ]

    operations = [
        migrations.AlterField(
            model_name='call',
            name='agent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calls', to='accounts.Agent'),
        ),
    ]
