# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-07-06 05:34
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_auto_20180611_1957'),
        ('iris', '0005_auto_20180629_1116'),
    ]

    operations = [
        migrations.CreateModel(
            name='Call',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('peer', models.CharField(max_length=40)),
                ('start', models.DateTimeField()),
                ('end', models.DateTimeField()),
                ('status', models.CharField(choices=[('0', 'Idle'), ('1', 'Ringing'), ('2', 'Dialing'), ('3', 'Missed'), ('4', 'In Call'), ('5', 'Completed')], default='0', max_length=2)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='accounts.Agent')),
            ],
        ),
        migrations.CreateModel(
            name='CallActivity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('subject', models.TextField()),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('call', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activities', to='iris.Call')),
            ],
        ),
    ]