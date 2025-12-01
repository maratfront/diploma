from django.urls import path
from .views import AlgorithmComparisonListView

urlpatterns = [
    path('algorithm-comparison/', AlgorithmComparisonListView.as_view(), name='algorithm-comparison'),
]