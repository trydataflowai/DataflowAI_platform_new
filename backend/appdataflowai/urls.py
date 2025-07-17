# urls.py
from django.urls import path
from .views import LoginView, ProductosUsuarioView, ImportarDatosView, UsuarioInfoView, ProductoListView, AdquirirDashboardView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('usuario/productos/', ProductosUsuarioView.as_view()),
    # urls.py
    path('importar/<int:id_producto>/', ImportarDatosView.as_view(), name='importar-datos'),
    path('usuario/info/', UsuarioInfoView.as_view(), name='usuario-info'),
    path('productos/', ProductoListView.as_view(), name='producto-list'),
    path('productos/adquirir/', AdquirirDashboardView.as_view(), name='producto-adquirir'),
]