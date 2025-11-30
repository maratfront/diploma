from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(
        verbose_name=_("Электронная почта"),
        unique=True,
        help_text=_('Введите адрес электронной почты')
    )
    first_name = models.CharField(
        max_length=50,
        verbose_name=_("Имя"),
        help_text=_("Введите ваше имя"),
        blank=False,
    )
    last_name = models.CharField(
        max_length=50,
        verbose_name=_("Фамилия"),
        help_text=_("Введите вашу фамилию"),
        blank=False,
    )
    patronymic = models.CharField(
        max_length=50,
        verbose_name=_('Отчество'),
        help_text=_('Введите ваше отчество'),
        blank=True
    )
    department = models.CharField(
        max_length=50,
        verbose_name=_('Название факультета'),
        help_text=_('Введите название факультета'),
        blank=True
    )
    student_group = models.CharField(
        max_length=50,
        verbose_name=_('Группа студента'),
        help_text=_('Введите номер группы студента'),
        blank=True
    )
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        indexes = [
            models.Index(fields=['email']),
        ]
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        ordering = ['department']

    def __str__(self):
        return self.email
