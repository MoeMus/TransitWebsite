import protobuf from "protobufjs"
import {useState, useEffect} from "react";
import apiClient from "../configurations/configAxios";
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
import { BsFillTrainFrontFill } from "react-icons/bs";

export default function ServiceAlerts(){

    const [alerts, setAlerts] = useState([]);

    async function getServiceAlerts(){

        try{

            const response = await apiClient.get('/api/translink/alerts/', {
                responseType: 'arraybuffer'
            });
            const byteBuffer = response.data;
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
            setAlerts(serviceAlerts);
        } catch (err){
            console.log(err);
        }
    }

    const interval = 60000; //1 minute

    useEffect(() => {
        getServiceAlerts();
        const timer = setInterval(getServiceAlerts, interval);
        
        // Cleanup interval on component unmount
        return () => clearInterval(timer);
    }, []);

    return (

        <>
            <DrawerRoot placement="start" size ="md" >
                <DrawerBackdrop/>
                <DrawerTrigger asChild>
                    <Button variant="outline" size="sm" width="260px">
                       <BsFillTrainFrontFill /> View TransLink Service Alerts
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