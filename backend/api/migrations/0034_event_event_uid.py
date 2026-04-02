from django.db import migrations, models


def backfill_event_uids(apps, schema_editor):
    Event = apps.get_model('api', 'Event')
    for event in Event.objects.filter(event_uid='').order_by('id'):
        event.event_uid = f'CE-{event.id:05d}'
        event.save(update_fields=['event_uid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_service_show_on_website'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='event_uid',
            field=models.CharField(blank=True, default='', max_length=20),
            preserve_default=False,
        ),
        migrations.RunPython(backfill_event_uids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='event',
            name='event_uid',
            field=models.CharField(blank=True, max_length=20, unique=True),
        ),
    ]
