from django.db import models
from django.utils.translation import gettext_lazy as _


class WebImplementationExample(models.Model):
    key = models.SlugField(
        max_length=50,
        unique=True,
        verbose_name=_('Ключ примера'),
        help_text=_('Уникальный идентификатор примера (например: jwt, aes, oauth)'),
    )
    title = models.CharField(
        max_length=150,
        verbose_name=_('Заголовок'),
        help_text=_('Краткое название примера'),
    )
    description = models.TextField(
        verbose_name=_('Описание'),
        help_text=_('Краткое текстовое описание примера'),
    )
    code = models.TextField(
        verbose_name=_('Код примера'),
        help_text=_('Фрагмент кода, который будет показан на фронтенде'),
    )

    class Meta:
        verbose_name = _('Веб-пример реализации криптографии')
        verbose_name_plural = _('Веб-примеры реализации криптографии')
        ordering = ['id']

    def __str__(self):
        return self.title
