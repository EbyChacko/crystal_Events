from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0032_message_replies'),
    ]

    operations = [
        migrations.AddField(
            model_name='service',
            name='show_on_website',
            field=models.BooleanField(default=True),
        ),
    ]
