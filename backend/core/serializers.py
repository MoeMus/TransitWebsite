from rest_framework import serializers
from .models import User, Course


# extra_kwargs is for extra keyword arguments on 'password' to make it 128 characters
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        # Password length is set to 128 characters per OWASP
        # https://owasp.deteact.com/cheat/cheatsheets/Authentication_Cheat_Sheet.html#password-length
        extra_kwargs = {
            'password': {'write_only': True, 'max_length': 128},
            'username': {'max_length': 50}
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class CourseSerializer(serializers.ModelSerializer):

