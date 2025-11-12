import requests
from google.transit import gtfs_realtime_pb2
from google.protobuf.json_format import MessageToJson

api_key = os.environ["TRANSLINK_API_KEY"]
url = f'https://gtfsapi.translink.ca/v3/gtfsposition?apikey={api_key}'

response = requests.get(url)

feed = gtfs_realtime_pb2.FeedMessage()
feed.ParseFromString(response.content)

feed_json = MessageToJson(feed)

print(feed_json)