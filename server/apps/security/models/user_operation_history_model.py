from django.db import models
from django.utils.translation import gettext_lazy as _


class UserOperationHistory(models.Model):
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
