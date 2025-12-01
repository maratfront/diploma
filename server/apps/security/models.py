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


class UserOperationHistory(models.Model):
    """
    История криптографических операций пользователя.

    Хранит те же данные, которые сейчас сохраняются в клиентском приложении:
    - type: encrypt/decrypt/sign/verify
    - algorithm: человекочитаемое название/код алгоритма
    - input: исходные данные (обрезка и защита приватности выполняются на клиенте)
    - output: результат операции
    - timestamp: время выполнения операции (генерируется на сервере)
    """

    OPERATION_TYPE_CHOICES = (
        ("encrypt", "Encrypt"),
        ("decrypt", "Decrypt"),
        ("sign", "Sign"),
        ("verify", "Verify"),
    )

    user = models.ForeignKey(
        'user.User',
        on_delete=models.CASCADE,
        related_name='operation_history',
        verbose_name=_('Пользователь'),
    )
    operation_type = models.CharField(
        max_length=20,
        choices=OPERATION_TYPE_CHOICES,
        verbose_name=_('Тип операции'),
    )
    algorithm = models.CharField(
        max_length=100,
        verbose_name=_('Алгоритм'),
        help_text=_('Название или код алгоритма, использованного в операции'),
    )
    input_data = models.TextField(
        verbose_name=_('Входные данные'),
        help_text=_('Входные данные операции (может быть обрезано на клиенте)'),
    )
    output_data = models.TextField(
        verbose_name=_('Результат'),
        help_text=_('Результат операции (может быть обрезано на клиенте)'),
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Время операции'),
    )

    class Meta:
        verbose_name = _('История операций пользователя')
        verbose_name_plural = _('История операций пользователей')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['operation_type']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.operation_type} - {self.algorithm}"