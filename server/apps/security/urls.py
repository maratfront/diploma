from django.urls import path

from .views import AlgorithmComparisonListView, CryptoProcessView

urlpatterns = [
    path('algorithm-comparison/', AlgorithmComparisonListView.as_view(), name='algorithm-comparison'),
    path('crypto/', CryptoProcessView.as_view(), name='crypto-process'),
]