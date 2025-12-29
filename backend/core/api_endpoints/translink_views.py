import requests
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_service_alerts(request):
    CACHE_KEY = 'translink_service_alerts'

    # Try to get from cache first, cache for 1 minute
    cached_data = cache.get(CACHE_KEY)
    if cached_data:
        return HttpResponse(cached_data, content_type="application/octet-stream", status=status.HTTP_200_OK)

    api_key = settings.TRANSLINK_API_KEY
    if not api_key:
        return HttpResponse("Server configuration error", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Translink GTFS Alerts URL
    url = f"https://gtfsapi.translink.ca/v3/gtfsalerts?apikey={api_key}"

    try: # Fetch alerts from Translink GTFS Alerts API
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        # Cache the content for 60 seconds
        cache.set(CACHE_KEY, response.content, timeout=60)

        return HttpResponse(response.content, content_type="application/octet-stream", status=status.HTTP_200_OK)

    except requests.RequestException:
        return HttpResponse("Failed to fetch alerts", status=status.HTTP_502_BAD_GATEWAY)