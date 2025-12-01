from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'email',
        'first_name',
        'last_name',
        'patronymic',
        'department',
        'student_group'
    )
    list_filter = (
        'department',
        'student_group'
    )
    search_fields = (
        'email',
        'first_name',
        'last_name',
        'patronymic'
    )
    ordering = (
        'department',
        'student_group'
    )
    list_per_page = 20
