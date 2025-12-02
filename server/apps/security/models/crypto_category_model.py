from django.db import models
from django.utils.translation import gettext_lazy as _


class CryptoCategory(models.Model):
    key = models.SlugField(
        max_length=50,
        unique=True,
        verbose_name=_('Ключ категории'),
        help_text=_('Уникальный идентификатор категории (symmetric, asymmetric, hash, modern и т.д.)'),
    )
    title = models.CharField(
        max_length=150,
        verbose_name=_('Заголовок'),
        help_text=_('Название категории'),
    )
    description = models.TextField(
        verbose_name=_('Описание'),
        help_text=_('Краткое описание категории'),
    )
    icon = models.CharField(
        max_length=50,
        verbose_name=_('Иконка'),
        help_text=_('Ключ иконки (например: key, key-round, hash, cpu)'),
    )
    color = models.CharField(
        max_length=50,
        verbose_name=_('Цветовой градиент'),
        help_text=_('Классы Tailwind для градиента (например: from-blue-500 to-blue-600)'),
    )

    class Meta:
        verbose_name = _('Категория криптографии')
        verbose_name_plural = _('Категории криптографии')
        ordering = ['id']

    def __str__(self):
        return self.title
