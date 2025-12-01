from django.contrib import admin
from apps.security.models import (
    AlgorithmComparison,
    WebImplementationExample,
    CryptoCategory,
    CryptoAlgorithm,
)


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


@admin.register(WebImplementationExample)
class WebImplementationExampleAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'key',
        'title',
    )
    search_fields = ('key', 'title')
    ordering = ('id', 'key')
    list_per_page = 20


@admin.register(CryptoCategory)
class CryptoCategoryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'key',
        'title',
        'icon',
        'color',
    )
    search_fields = ('key', 'title')
    ordering = ('id', 'key')
    list_per_page = 20


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
    list_filter = ('category', 'security')
    search_fields = ('name', 'category__title')
    ordering = ('id', 'name')
    list_per_page = 20
