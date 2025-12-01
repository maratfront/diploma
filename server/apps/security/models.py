from django.db import models
from django.utils.translation import gettext_lazy as _


class AlgorithmComparison(models.Model):
    name = models.CharField(
        max_length=50,
        verbose_name=_("Алгоритм"),
        help_text=_("Введите название алгоритма"),
        blank=False,
    )
    security = models.PositiveIntegerField(
        verbose_name=_('Уровень безопасности'),
        help_text=_('Введите уровень безопасности'),
    )
    speed = models.PositiveIntegerField(
        verbose_name=_('Скорость'),
        help_text=_('Введите скорость работы'),
    )
    key_size = models.PositiveIntegerField(
        verbose_name=_('Размер ключа'),
        help_text=_('Введите размер ключа'),
    )
    type = models.CharField(
        max_length=50,
        verbose_name=_("Тип"),
        help_text=_("Введите тип"),
        blank=False,
        unique=False,
        null=False,
    )
    year = models.IntegerField(
        verbose_name=_('Год создания'),
        help_text=_('Введите год создания'),
    )
    explanation = models.TextField(
        verbose_name=_('Определение'),
        help_text=_('Введите текст определения')
    )
    use_case = models.TextField(
        verbose_name=_('Применение'),
        help_text=_('Введите способы применения')
    )

    class Meta:
        indexes = [
            models.Index(fields=['name']),
        ]
        verbose_name = _('Алгоритм для сравнения')
        verbose_name_plural = _('Алгоритмы для сравнения')
        ordering = ['id']

    def __str__(self):
        return self.name
