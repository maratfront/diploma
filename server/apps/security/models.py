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


class WebImplementationExample(models.Model):
    """
    Пример веб-реализации криптографии (используется в разделе WebImplementation).
    """

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


class CryptoCategory(models.Model):
    """
    Категория криптографии (симметричное, асимметричное, хеш-функции, современные методы).
    """

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


class CryptoAlgorithm(models.Model):
    """
    Описание конкретного криптоалгоритма для раздела CryptoInfo.
    """

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
