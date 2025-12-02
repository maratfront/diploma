from django.contrib import admin
from apps.security.models import WebImplementationExample


@admin.register(WebImplementationExample)
class WebImplementationExampleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'key',
        'title',
    )
    search_fields = (
        'key',
        'title'
    )
    ordering = (
        'id',
        'key'
    )
    list_per_page = 20
