
"use client"

import { RiskDataRow } from "@/app/map/page"
import counties from "@/data/geo.json"
import "leaflet/dist/leaflet.css"
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet"

type Props = {
    processedData: RiskDataRow[]
}
export const WorldMap = ({ processedData }: Props) => {
    const allCountries: any = []
    processedData.forEach(data => allCountries.push(data.countries))
    const countriesSet = new Set(allCountries.flat())

    const countryColorMap = new Map();
    processedData.forEach(data => {
        data.countries.forEach(country => {
            countryColorMap.set(country, data)
        })
    })
    const mapStyle = {
        weight: 1,
        color: "black",
        fillOpacity: 0,
        zoom: 0

    };

    const onEachCountry = (country, layer) => {
        if (!countryColorMap.has(country.properties.admin)){
            return
        }
        if (countriesSet.has(country.properties.admin)) {
            layer.options.fillColor = countryColorMap.get(country.properties.admin).colorHex
            layer.options.fillOpacity = 1
        }

        layer.bindPopup(`
                Group: ${countryColorMap.get(country.properties.admin).group} <br/>
                UpVotes: ${countryColorMap.get(country.properties.admin).upVotes} <br/>
                ThreatOrOpportunity: ${countryColorMap.get(country.properties.admin).threatOrOpportunity} <br/>
        	`)


    };



    return (
        <MapContainer center={[10, 0]} zoom={2} style={{ height: '90vh', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <GeoJSON data={counties} style={mapStyle} onEachFeature={onEachCountry} />

        </MapContainer>
    )
}
