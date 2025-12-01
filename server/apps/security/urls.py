from django.urls import path

from .views import (
    AlgorithmComparisonListView,
    CryptoProcessView,
    RSAGenerateKeyPairView,
    RSASignView,
    RSAVerifyView,
    UserOperationHistoryView,
    WebImplementationExampleListView,
    CryptoCategoryListView,
    CryptoAlgorithmListView,
)

urlpatterns = [
    path('algorithm-comparison/', AlgorithmComparisonListView.as_view(), name='algorithm-comparison'),
    path('crypto/', CryptoProcessView.as_view(), name='crypto-process'),
    path('rsa/keypair/', RSAGenerateKeyPairView.as_view(), name='rsa-keypair'),
    path('rsa/sign/', RSASignView.as_view(), name='rsa-sign'),
    path('rsa/verify/', RSAVerifyView.as_view(), name='rsa-verify'),
    path('history/', UserOperationHistoryView.as_view(), name='user-operation-history'),
    path('web-implementations/', WebImplementationExampleListView.as_view(), name='web-implementations'),
    path('crypto-categories/', CryptoCategoryListView.as_view(), name='crypto-categories'),
    path('crypto-algorithms/', CryptoAlgorithmListView.as_view(), name='crypto-algorithms'),
]