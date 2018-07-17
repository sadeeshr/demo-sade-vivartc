# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-06-29 04:35
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('vox', '0008_auto_20180628_2002'),
        ('iris', '0002_presence'),
    ]

    operations = [
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.CharField(max_length=200)),
                ('start', models.DateTimeField()),
                ('end', models.DateTimeField()),
                ('description', models.TextField(blank=True, null=True)),
                ('type', models.CharField(choices=[('0', 'Tele'), ('1', 'Direct')], default='1', max_length=2)),
                ('conf_profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conferences', to='vox.ConfProfile')),
            ],
        ),
    ]