from django.contrib import admin
from apps.security.models import AlgorithmComparison


@admin.register(AlgorithmComparison)
class AlgorithmComparisonAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'security',
        'speed',
        'key_size',
        'type',
        'type',
        'year',
        'explanation',
        'use_case',
    )
    search_fields = (
        'name',
    )
    ordering = (
        'id',
        'name',
        'security',
        'speed',
        'year',
        'key_size',
    )
    list_per_page = 20

    fieldsets = (
        ('Заполните поля', {
            'fields': (
                'name',
                'security',
                'speed',
                'key_size',
                'type',
                'year',
                'explanation',
                'use_case',
            ),
        }),
    )
