from rest_framework.views import APIView,Http404
from rest_framework import permissions,status,viewsets
from rest_framework.response import Response
from django.contrib.auth import logout,login,authenticate,update_session_auth_hash
from users.models import User
from rest_framework.decorators import action
# Create your views here.
from . import serializers,permissions as  pp


class SignupView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = serializers.UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        login(request, user, backend='django.contrib.auth.backends.ModelBackend')

        # Return the response
        response = Response(status=status.HTTP_201_CREATED)
        response.set_cookie('loggedIn', 'true', httponly=True, secure=True, samesite='None')      
        return response


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        login_serializer= serializers.LoginSerializer(
            data=request.data
        )
        login_serializer.is_valid(raise_exception=True)
        user= authenticate(request, **login_serializer.data)

        if user is None:
            response= Response(
                {"detail": "Invalid Credentials"},
                status=status.HTTP_400_BAD_REQUEST,
            ) 
            response.set_cookie('loggedIn', 'false', httponly=True, secure=True, samesite='None')
            return response
        
        if not user.is_active:
            response = Response(
                {"detail": "Account disabled"}, status=status.HTTP_401_UNAUTHORIZED
            )
            response.set_cookie('loggedIn', 'false', httponly=True, secure=True, samesite='None')
            return response
        
        login(request, user)

        response = Response(status=status.HTTP_200_OK)
        response.set_cookie('loggedIn', 'true', httponly=True, secure=True, samesite='None')

        return response

class LogoutView(APIView):
    permission_classes= [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)

        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie('loggedIn', samesite='None')
        return response
    
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.UserSerializer
    permission_classes = (pp.UserViewSetPermissions,)
    queryset = User.objects.all().select_related("profile")

    def list(self, request, *args, **kwargs):
        # dont list all users
        raise Http404
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial",False)
        instance= self.get_object()
        serializer = serializers.UserSerializer(
            instance=instance,data=request.data,partial=partial
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_200_OK)


         

    @action(methods=("GET",), detail=False, url_path="me")
    def get_current_user_data(self, request):
        return Response(self.get_serializer(request.user).data)

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self,request):
        serializer = serializers.ChangePasswordSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        user= request.user
        if user.check_password(serializer.validated_data.get('current_password')):
            if serializer.validated_data.get('new_password') == serializer.validated_data.get('confirm_new_password'):
                user.set_password(serializer.validated_data.get('new_password'))
                user.save()
                update_session_auth_hash(request, user)
                return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
            return Response({'message':'Password and Confirm Password didnt match'},status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)