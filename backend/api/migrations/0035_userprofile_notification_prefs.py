from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_event_event_uid'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='notify_new_event',
            field=models.BooleanField(default=True, help_text='Receive email when a new event is created'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='notify_quote_accepted',
            field=models.BooleanField(default=True, help_text='Receive email when a quote is accepted'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='notify_weekly_report',
            field=models.BooleanField(default=False, help_text='Receive weekly summary report'),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='notify_daily_summary',
            field=models.BooleanField(default=False, help_text='Receive daily overview email'),
        ),
    ]
