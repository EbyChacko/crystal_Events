from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_message_replied_at_message_reply_text'),
    ]

    operations = [
        migrations.AddField(
            model_name='expense',
            name='event',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='expenses',
                to='api.event',
            ),
        ),
    ]
