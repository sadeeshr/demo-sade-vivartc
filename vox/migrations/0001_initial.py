# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-05-07 18:28
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SwitchModel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('desc', models.TextField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='TelProfile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('extension', models.CharField(max_length=20)),
                ('pswd', models.CharField(blank=True, max_length=100, null=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tel_profiles', to='accounts.Enterprise')),
            ],
        ),
        migrations.CreateModel(
            name='TelSwitch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('domain', models.CharField(blank=True, max_length=100, null=True)),
                ('address', models.CharField(blank=True, max_length=100, null=True)),
                ('account', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tel_exchanges', to='accounts.Enterprise')),
                ('make', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tel_exchanges', to='vox.SwitchModel')),
            ],
        ),
        migrations.AddField(
            model_name='telprofile',
            name='switch',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tel_profiles', to='vox.TelSwitch'),
        ),
    ]
