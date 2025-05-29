"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from "react-leaflet"
import { Maximize2, Filter, Search, ThumbsUp, AlertTriangle, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import "leaflet/dist/leaflet.css"
import { riskData } from "@/data/risk-data"
import counties from "@/data/geo.json"
import { WorldMap } from "@/components/map"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

// Mock data types
interface RiskData {
    id: string
    title: string
    description: string
    country: string
    region: string
    coordinates: [number, number]
    riskScore: number
    upVotes: number
    isThreats: boolean
    uploadTime: Date
    exposureStartDate: Date
    exposureEndDate: Date
    isPublic: boolean
    userId?: string
    riskType: "environmental" | "political" | "economic" | "security" | "health"
}

interface CountryData {
    code: string
    name: string
    coordinates: [number, number]
    region: string
}

// Mock data
const mockRiskData: RiskData[] = [
    {
        id: "1",
        title: "Climate Change Impact",
        description: "Rising sea levels affecting coastal areas",
        country: "Bangladesh",
        region: "Asia",
        coordinates: [23.685, 90.3563],
        riskScore: 8.5,
        upVotes: 45,
        isThreats: true,
        uploadTime: new Date("2024-01-15"),
        exposureStartDate: new Date("2024-06-01"),
        exposureEndDate: new Date("2024-12-31"),
        isPublic: true,
        riskType: "environmental",
    },
    {
        id: "2",
        title: "Political Instability",
        description: "Ongoing civil unrest and government changes",
        country: "Myanmar",
        region: "Asia",
        coordinates: [21.9162, 95.956],
        riskScore: 9.2,
        upVotes: 67,
        isThreats: true,
        uploadTime: new Date("2024-01-10"),
        exposureStartDate: new Date("2024-03-01"),
        exposureEndDate: new Date("2024-09-30"),
        isPublic: true,
        riskType: "political",
    },
    {
        id: "3",
        title: "Economic Recession",
        description: "High inflation and unemployment rates",
        country: "Argentina",
        region: "South America",
        coordinates: [-38.4161, -63.6167],
        riskScore: 7.8,
        upVotes: 32,
        isThreats: false,
        uploadTime: new Date("2024-01-20"),
        exposureStartDate: new Date("2024-04-01"),
        exposureEndDate: new Date("2024-10-31"),
        isPublic: false,
        riskType: "economic",
    },
    {
        id: "4",
        title: "Cybersecurity Threats",
        description: "Increased cyber attacks on infrastructure",
        country: "Estonia",
        region: "Europe",
        coordinates: [58.5953, 25.0136],
        riskScore: 6.9,
        upVotes: 28,
        isThreats: true,
        uploadTime: new Date("2024-01-25"),
        exposureStartDate: new Date("2024-02-01"),
        exposureEndDate: new Date("2024-08-31"),
        isPublic: true,
        riskType: "security",
    },
    {
        id: "5",
        title: "Pandemic Preparedness",
        description: "Healthcare system capacity concerns",
        country: "India",
        region: "Asia",
        coordinates: [20.5937, 78.9629],
        riskScore: 7.5,
        upVotes: 41,
        isThreats: false,
        uploadTime: new Date("2024-01-12"),
        exposureStartDate: new Date("2024-05-01"),
        exposureEndDate: new Date("2024-11-30"),
        isPublic: true,
        riskType: "health",
    },
]

const regions = [
    { name: "Asia", countries: ["Bangladesh", "Myanmar", "India", "China", "Japan"] },
    { name: "Europe", countries: ["Estonia", "Germany", "France", "Spain", "Italy"] },
    { name: "South America", countries: ["Argentina", "Brazil", "Chile", "Colombia"] },
    { name: "North America", countries: ["United States", "Canada", "Mexico"] },
    { name: "Africa", countries: ["Nigeria", "South Africa", "Egypt", "Kenya"] },
]

export interface RiskDataRow {
    id: string
    group: string
    countries: string[]
    upVotes: number
    threatOrOpportunity: "Threat" | "Opp"
    timePosted: string
    startDate: string
    endDate: string
    displayColor: string
    colorHex: string
}

const riskDataset: RiskDataRow[] = riskData as RiskDataRow[]
export default function MapPage() {
    const [viewType, setViewType] = useState<"global" | "regions">("global")
    const [processedData, setProcessedData] = useState<RiskDataRow[]>()
    const sortByPriority = (data: RiskDataRow[]): RiskDataRow[] => {
        return data.sort((a, b) => {
            if (a.upVotes !== b.upVotes) {
                return b.upVotes - a.upVotes
            }

            if (a.threatOrOpportunity !== b.threatOrOpportunity) {
                return a.threatOrOpportunity === "Threat" ? -1 : 1
            }

            if (a.timePosted !== b.timePosted) {
                const aTime = a.timePosted.split(":").map(Number)
                const bTime = b.timePosted.split(":").map(Number)
                if (aTime[0] !== bTime[0]) {
                    return aTime[0] - bTime[0]
                }
                return aTime[1] - bTime[1]
            }

            const aStartDate = new Date(a.startDate.split("/").reverse().join("-"))
            const bStartDate = new Date(b.startDate.split("/").reverse().join("-"))
            if (aStartDate.getTime() !== bStartDate.getTime()) {
                return aStartDate.getTime() - bStartDate.getTime()
            }

            const aEndDate = new Date(a.endDate.split("/").reverse().join("-"))
            const bEndDate = new Date(b.endDate.split("/").reverse().join("-"))
            return aEndDate.getTime() - bEndDate.getTime()
        })
    }

    useEffect(() => {
        const res = filterData()
        setProcessedData(res)

    }, [viewType])

    const filterData = () => {
        const prioritySorted = sortByPriority([...riskDataset])

        if (viewType === "global") {
            return prioritySorted
        } else if (viewType === "regions") {
            //   const regionGroups = new Map<string, RiskDataRow[]>()

            //   const regionMapping: Record<string, string> = {
            //     USA: "North America",
            //     Russia: "Europe/Asia",
            //     China: "Asia",
            //     India: "Asia",
            //     Nigeria: "Africa",
            //     Algeria: "Africa",
            //     Germany: "Europe",
            //     Ethiopia: "Africa",
            //     Ghana: "Africa",
            //     Egypt: "Africa",
            //     Brazil: "South America",
            //     Chile: "South America",
            //   }
            const regions = ["North America", "Europe", "Asia", "Africa", "South America", "South America"]

            const regionGroup = prioritySorted.filter(risk => regions.includes(risk.group))

            //   prioritySorted.forEach((risk) => {
            //     const regions = new Set(risk.countries.map((country) => regionMapping[country] || "Other"))

            //     regions.forEach((region) => {
            //       if (!regionGroups.has(region)) {
            //         regionGroups.set(region, [])
            //       }
            //       regionGroups.get(region)!.push(risk)
            //     })
            //   })

            // Return highest priority risk per region
            //   const regionResults: RiskDataRow[] = []
            //   regionGroups.forEach((risks, region) => {
            //     const topRisk = sortByPriority([...risks])[0]
            //     if (topRisk) {
            //       regionResults.push({
            //         ...topRisk,
            //         group: region, 
            //       })
            //     }
            //   })

            //   return sortByPriority(regionResults)
            return sortByPriority(regionGroup)
        }

        return prioritySorted
    }
    if(!processedData){
        return null
    }
    return (
        <div className={cn("min-h-screen bg-background")}>
            <div className="container mx-auto p-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Risk Assessment Map</h1>
                        <p className="text-muted-foreground">Risks are ordered by this order, Upvotes, Threats, TimePosted, Start Date, End Date</p>
                    </div>
                </div>

                {/* Datatable */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Risk Data Table
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                                ({processedData.length} {processedData.length === 1 ? "entry" : "entries"})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="w-full border-collapse">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead >
                                            <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
                                                <SelectTrigger className="min-w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="global">Global</SelectItem>
                                                    <SelectItem value="regions">Region</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableHead>
                                        <TableHead >Countries in Group</TableHead>
                                        <TableHead >Up Votes</TableHead>
                                        <TableHead >Threat OR Opportunity</TableHead>
                                        <TableHead >Time Posted</TableHead>
                                        <TableHead >Start Date</TableHead>
                                        <TableHead >End Date</TableHead>
                                        <TableHead >Display Colour</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <tbody>
                                    {processedData.map((row, index) => (
                                        <TableRow
                                            key={row.id}
                                            className={cn(
                                                "border-b hover:bg-muted/50 transition-colors",
                                                index % 2 === 0 ? "bg-white" : "bg-gray-50",
                                            )}
                                        >
                                            <TableCell className="p-3 font-medium">{row.group}</TableCell>
                                            <TableCell className="p-3 max-w-xs">
                                                <div className="truncate" title={row.countries.join("; ")}>
                                                    {row.countries.join("; ")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-3 text-center font-semibold">{row.upVotes}</TableCell>
                                            <TableCell className="p-3 text-center">
                                                <Badge variant={row.threatOrOpportunity === "Threat" ? "destructive" : "secondary"}>
                                                    {row.threatOrOpportunity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-3 text-center font-mono">{row.timePosted}</TableCell>
                                            <TableCell className="p-3 text-center">{row.startDate}</TableCell>
                                            <TableCell className="p-3 text-center">{row.endDate}</TableCell>
                                            <TableCell className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: row.colorHex }}
                                                        title={row.displayColor}
                                                    ></div>
                                                    <span className="text-sm">{row.displayColor}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </tbody>
                            </Table>

                            {processedData.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No data available for the selected view</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div>
                    {/* Map */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Risk Map - {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {typeof window !== "undefined" && processedData && (
                                <WorldMap processedData={processedData} key={viewType}/>)}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

}
