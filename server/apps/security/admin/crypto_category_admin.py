from django.contrib import admin
from apps.security.models import CryptoCategory


@admin.register(CryptoCategory)
class CryptoCategoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'key',
        'title',
        'icon',
        'color',
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
