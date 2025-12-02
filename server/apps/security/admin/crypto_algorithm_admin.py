from django.contrib import admin
from apps.security.models import CryptoAlgorithm


@admin.register(CryptoAlgorithm)
class CryptoAlgorithmAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'key_size',
        'security',
        'speed',
    )
    list_filter = (
        'category',
        'security'
    )
    search_fields = (
        'name',
        'category__title'
    )
    ordering = (
        'id',
        'name'
    )
    list_per_page = 20
