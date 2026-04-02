from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_add_paid_by_paid_back_to_expense_income'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='replies',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
