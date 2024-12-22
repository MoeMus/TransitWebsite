import protobuf from "protobufjs"
import {useState} from "react";

const TRANSLINK_ALERTS_URL = `https://corsproxy.io/?url=https://gtfsapi.translink.ca/v3/gtfsalerts?apikey=${process.env["REACT_APP_TRANSLINK_API_KEY"]}`;

export default function ServiceAlerts(){

    const [alerts, setAlerts] = useState([]);
    async function getServiceAlerts(){

        try{

            const response = await fetch(TRANSLINK_ALERTS_URL);
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
            setAlerts(serviceAlerts);
        } catch (err){
            console.log(err);
        }
    }

    const interval = 60000; //1 minute

    getServiceAlerts();
    setInterval(getServiceAlerts, interval);

    return (

        <>
            <ul>
                {alerts.map((alert)=>(

                    <li>
                        <div>
                            <h3> ${alert.header} </h3>
                            <p> ${alert.description}</p>
                        </div>
                    </li>

                ))
                }

            </ul>
        </>

    )
}