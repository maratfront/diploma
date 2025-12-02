from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from apps.security.models import UserOperationHistory
from apps.security.serializers import UserOperationHistorySerializer


@extend_schema(
    tags=['История операций'],
    summary='История криптографических операций пользователя',
)
class UserOperationHistoryView(APIView):
    """
    Просмотр и управление историей криптографических операций текущего пользователя.

    - GET: вернуть последние N операций (по умолчанию 100)
    - POST: добавить новую операцию
    - DELETE: полностью очистить историю пользователя
    """
    permission_classes = [permissions.IsAuthenticated]

    @staticmethod
    def get(request):
        limit = 100
        queryset = (
            UserOperationHistory.objects.filter(user=request.user)
            .order_by('-timestamp')[:limit]
        )
        serializer = UserOperationHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @staticmethod
    def post(request):
        serializer = UserOperationHistorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @staticmethod
    def delete(request):
        UserOperationHistory.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
