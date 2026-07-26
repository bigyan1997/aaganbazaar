import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


def _generate_unique_username(email: str) -> str:
    """AbstractUser still requires a username internally even though email
    is the real login identifier - derive one from the email so users never
    have to think about it."""
    base = re.sub(r"[^a-zA-Z0-9._-]", "", email.split("@")[0]) or "user"
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        suffix += 1
        username = f"{base}{suffix}"
    return username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    password2 = serializers.CharField(write_only=True, min_length=10)

    class Meta:
        model = User
        fields = ("email", "password", "password2", "first_name", "last_name")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        user = User(username=_generate_unique_username(validated_data["email"]), **validated_data)
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "is_phone_verified",
            "is_email_verified",
            "auth_provider",
            "avatar_url",
            "date_joined",
        )
        read_only_fields = fields


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=10)
    new_password2 = serializers.CharField(min_length=10)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        try:
            validate_password(attrs["new_password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs
