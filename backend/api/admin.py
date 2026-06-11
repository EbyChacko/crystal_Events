from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['name', 'place', 'rating', 'date', 'created_at']
    list_filter = ['rating']
    search_fields = ['name', 'place', 'review']
