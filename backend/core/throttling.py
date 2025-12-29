from rest_framework.throttling import UserRateThrottle, AnonRateThrottle

class BurstAnonRateThrottle(AnonRateThrottle):
    scope = 'anon_burst'

class SustainedAnonRateThrottle(AnonRateThrottle):
    scope = 'anon_sustained'

class BurstUserRateThrottle(UserRateThrottle):
    scope = 'user_burst'

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            return None
        return super().get_cache_key(request, view)

class SustainedUserRateThrottle(UserRateThrottle):
    scope = 'user_sustained'

    def get_cache_key(self, request, view):
        if not request.user.is_authenticated:
            return None
        return super().get_cache_key(request, view)