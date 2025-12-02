from django.db import models
from django.utils.translation import gettext_lazy as _
from .crypto_category_model import CryptoCategory


class CryptoAlgorithm(models.Model):
    category = models.ForeignKey(
        CryptoCategory,
        on_delete=models.CASCADE,
        related_name='algorithms',
        verbose_name=_('Категория'),
    )
    name = models.CharField(
        max_length=150,
        verbose_name=_('Название алгоритма'),
    )
    key_size = models.CharField(
        max_length=100,
        verbose_name=_('Размер ключа'),
        help_text=_('Например: 128, 192, 256 бит'),
        blank=True,
    )
    security = models.CharField(
        max_length=100,
        verbose_name=_('Уровень безопасности'),
        help_text=_('Например: Очень высокая, Высокая, Средняя, Низкая'),
        blank=True,
    )
    speed = models.CharField(
        max_length=100,
        verbose_name=_('Скорость'),
        help_text=_('Например: Высокая, Средняя, Низкая'),
        blank=True,
    )
    description = models.TextField(
        verbose_name=_('Описание'),
        help_text=_('Общее описание алгоритма'),
    )
    technical_details = models.TextField(
        verbose_name=_('Технические детали'),
        help_text=_('Более техническое описание (опционально)'),
        blank=True,
    )
    vulnerabilities = models.TextField(
        verbose_name=_('Уязвимости'),
        help_text=_('Известные уязвимости (опционально)'),
        blank=True,
    )
    simple_explanation = models.TextField(
        verbose_name=_('Простое объяснение'),
        help_text=_('Объяснение простыми словами (опционально)'),
        blank=True,
    )
    real_world_example = models.TextField(
        verbose_name=_('Примеры из реального мира'),
        help_text=_('Где используется алгоритм (опционально)'),
        blank=True,
    )
    applications = models.JSONField(
        verbose_name=_('Применение'),
        help_text=_('Список применений алгоритма'),
        default=list,
        blank=True,
    )
    advantages = models.JSONField(
        verbose_name=_('Преимущества'),
        help_text=_('Список преимуществ алгоритма'),
        default=list,
        blank=True,
    )
    disadvantages = models.JSONField(
        verbose_name=_('Недостатки'),
        help_text=_('Список недостатков алгоритма'),
        default=list,
        blank=True,
    )

    class Meta:
        verbose_name = _('Криптоалгоритм')
        verbose_name_plural = _('Криптоалгоритмы')
        ordering = ['id']

    def __str__(self):
        return self.name
