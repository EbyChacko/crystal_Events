from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0044_add_checklist_note_to_event'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Remove old asset tracking fields from Expense
        migrations.RemoveField(
            model_name='expense',
            name='is_asset',
        ),
        migrations.RemoveField(
            model_name='expense',
            name='asset_current_value',
        ),
        migrations.RemoveField(
            model_name='expense',
            name='is_active_asset',
        ),

        # Add can_manage_assets to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='can_manage_assets',
            field=models.BooleanField(default=False, help_text='Allow user to manage the asset inventory'),
        ),

        # Create new Asset model
        migrations.CreateModel(
            name='Asset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('purchase_date', models.DateField()),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('value', models.DecimalField(decimal_places=2, help_text='Purchase value', max_digits=10)),
                ('current_value', models.DecimalField(blank=True, decimal_places=2, help_text='Current estimated value', max_digits=10, null=True)),
                ('depreciation_rate', models.DecimalField(decimal_places=2, default=0, help_text='Annual depreciation %', max_digits=5)),
                ('condition', models.CharField(choices=[('Excellent', 'Excellent'), ('Good', 'Good'), ('Fair', 'Fair'), ('Poor', 'Poor')], default='Good', max_length=20)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('added_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='added_assets', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
