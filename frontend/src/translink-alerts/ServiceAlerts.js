import protobuf from "protobufjs"
import {useState} from "react";
import { Button } from "../components/ui/button"
import {
  DrawerActionTrigger,
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "../components/ui/drawer"
import {Text} from "@chakra-ui/react";

const TRANSLINK_SERVICE_ALERT_URL = `https://corsproxy.io/?url=https://gtfsapi.translink.ca/v3/gtfsalerts?apikey=${process.env["REACT_APP_TRANSLINK_API_KEY"]}`;
const TRANSLINK_TRIP_UPDATES_URL = `https://corsproxy.io/?url=https://gtfsapi.translink.ca/v3/gtfsrealtime?apikey=${process.env["REACT_APP_TRANSLINK_API_KEY"]}`;
export default function ServiceAlerts(){

    const [alerts, setAlerts] = useState([]);

    async function getTripUpdates(){
       try{

            const response = await fetch(TRANSLINK_TRIP_UPDATES_URL);
            if (!response.ok) throw new Error("Failed to fetch trip updates");
            const byteBuffer = await response.arrayBuffer();
            const protoRoot = await protobuf.load("gtfs-realtime.proto");
            const FeedMessage = protoRoot.lookupType("transit_realtime.FeedMessage");
            const feed = FeedMessage.decode(new Uint8Array(byteBuffer));
            const object = FeedMessage.toObject(feed, { enums: String });
            console.log(JSON.stringify(object, null, 2));

        } catch (err){
            console.log(err);
        }
    }

    async function getServiceAlerts(){

        try{

            const response = await fetch(TRANSLINK_SERVICE_ALERT_URL);
            if (!response.ok) throw new Error("Failed to fetch service alerts");
            const byteBuffer = await response.arrayBuffer();
            const protoRoot = await protobuf.load("gtfs-realtime.proto");
            const FeedMessage = protoRoot.lookupType("transit_realtime.FeedMessage");
            const feed = FeedMessage.decode(new Uint8Array(byteBuffer));
            const serviceAlerts = feed.entity.map((entity)=>{
                return {
                        header: entity.alert.headerText.translation[0].text,
                        description: entity.alert.descriptionText.translation[0].text,
                        affectedEntities: entity.alert.informedEntity,
                    };
            }).filter((alert)=>alert);

            serviceAlerts.reverse(); //Newest alerts first

            setAlerts(serviceAlerts);
        } catch (err){
            console.log(err);
        }
    }

    const interval = 5*60000; //1 minute

    getServiceAlerts();
    setInterval(getServiceAlerts, interval);

    return (

        <>
            <DrawerRoot placement="start" size ="md" >
                <DrawerBackdrop/>
                <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" width="230px">
                       View TransLink Service Alerts
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle> Service Alerts </DrawerTitle>
                    </DrawerHeader>

                        <DrawerBody>
                            <ul>

                                {alerts.length === 0 ? <Text fontSize="20px"> No Service Alerts Yet </Text> :
                                 alerts.map((alert) => (

                                    <li key={alerts.indexOf(alert)}>
                                        <div>
                                            <Text fontWeight="bold" fontSize="20px"> {alert.header} </Text>
                                            <Text fontSize="20px"> {alert.description}</Text>
                                        </div>
                                    </li>

                                ))

                                }

                            </ul>
                        </DrawerBody>
                    <DrawerFooter>
                        <DrawerActionTrigger asChild>
                            <Button variant="outline">Exit</Button>
                        </DrawerActionTrigger>
                    </DrawerFooter>
                    <DrawerCloseTrigger />
                </DrawerContent>
            </DrawerRoot>

        </>

    )
}