from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0045_assets_refactor'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='can_add_asset',
            field=models.BooleanField(default=False, help_text='Allow user to add, edit, and delete assets'),
        ),
    ]
