from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.generics import ListAPIView
from apps.security.models import WebImplementationExample
from apps.security.serializers import WebImplementationExampleSerializer


@extend_schema(
    tags=['Обучающие материалы'],
    summary='Примеры веб-реализации криптографии',
)
class WebImplementationExampleListView(ListAPIView):
    """
    Список примеров веб-реализаций (раздел WebImplementation).
    """

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WebImplementationExampleSerializer
    queryset = WebImplementationExample.objects.all()
