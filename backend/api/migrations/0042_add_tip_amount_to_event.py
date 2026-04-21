from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0041_add_amount_to_foodmenuitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='tip_amount',
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=12),
        ),
    ]
