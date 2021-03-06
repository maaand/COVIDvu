import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { useLocation } from 'react-router'

import { useHandleHistory } from '../hooks/nav'

import { actions } from '../ducks/services'

import { Message } from "rbx"

import TwoGraphLayout from '../layouts/TwoGraphLayout'
import TabbedCompareGraphs from '../components/TabbedCompareGraphs'

import CheckboxRegionComponent from '../components/CheckboxRegionComponent'
import HeroElement from '../components/HeroElement'
import BoxWithLoadingIndicator from '../components/BoxWithLoadingIndicator'

import ReactGA from 'react-ga';

const countriesRegions = require('../constants/countries_regions.json');

export const RegionGraphContainer = ({region, uniqueRegion = [], graph = 'Cases', showLogParam = false}) => {

    const dispatch = useDispatch()
    const { search } = useLocation()
    const handleHistory = useHandleHistory(`/covid/region/${region}`)

    const [showLog, setShowLog] = useState(showLogParam)
    const [selectedRegions, setSelectedRegions] = useState(uniqueRegion)
    const [secondaryGraph, setSecondaryGraph] = useState(graph)
    
    // TODO look into using the hook for this as well, somehow
    const confirmed = useSelector(state => state.services.region.hasOwnProperty(region) ? state.services.region[region].confirmed : undefined)
    const sortedConfirmed = useSelector(state => state.services.region.hasOwnProperty(region) ? state.services.region[region].sortedConfirmed : undefined)
    const deaths = useSelector(state => state.services.region.hasOwnProperty(region) ? state.services.region[region].deaths : undefined)
    const mortality = useSelector(state => state.services.region.hasOwnProperty(region) ? state.services.region[region].mortality : undefined)

    const [regionNotFound, setRegionNotFound] = useState(undefined)

    /**
     * Fetch all the data
     */
    useEffect(() => {
        const uniqueRegionSet = Object.values(countriesRegions).filter((value, index, self) => self.indexOf(value) === index)

        if(uniqueRegionSet.indexOf(region) !== -1) {
            dispatch(actions.fetchRegion({region}))
        } else {
            setRegionNotFound(true)
        }
    }, [dispatch, region, showLog])

    // Select the Top 3 confirmed from list if nothing is selected
    useEffect(() => {
        if(sortedConfirmed && uniqueRegion.length === 0) {
            setSelectedRegions(sortedConfirmed.slice(0, 3).map(confirmed => confirmed.region))
        }
    }, [sortedConfirmed])

    const handleSelectedRegion = (regionList) => {
        setSelectedRegions(regionList)
        handleHistory(regionList, secondaryGraph, showLog)

        ReactGA.event({
            category: `Region:${region}`,
            action: `Changed selected regions to ${regionList.join(', ')}`
        })        
    }

    const handleSelectedGraph = (selectedGraph) => {
        setSecondaryGraph(selectedGraph)
        handleHistory(selectedRegions, selectedGraph, showLog)

        ReactGA.event({
            category: `Region:${region}`,
            action: `Changed selected graph to ${selectedGraph}`
        })
    }    

    const handleGraphScale = (logScale) => {
        setShowLog(logScale)
        handleHistory(selectedRegions, secondaryGraph, logScale)

        ReactGA.event({
            category: `Region:${region}`,
            action: `Changed graph scale to ${logScale ? 'logarithmic' : 'linear'}`
        })
    }

    if(regionNotFound) {
        return (
            <Message color="danger">
                <Message.Header>
                    Region not found
                </Message.Header>
                <Message.Body>
                    The region entered in the location bar was not found
                </Message.Body>
            </Message>
        )
    }

    return (
        <>
        <HeroElement
            subtitle={region}
            title={
                <>Coronavirus Cases <br />by Country</>
            }
        />

        <BoxWithLoadingIndicator hasData={sortedConfirmed}>
            <TwoGraphLayout>

                <>
                    <CheckboxRegionComponent
                        data={sortedConfirmed}
                        selected={selectedRegions}
                        handleSelected={dataList => handleSelectedRegion(dataList)} 
                        defaultSelected={uniqueRegion}
                        showLog={showLog}
                        parentRegion={region}
                    />

                </>

                <TabbedCompareGraphs
                    secondaryGraph={secondaryGraph}
                    confirmed={confirmed}
                    deaths={deaths}
                    mortality={mortality}
                    selected={selectedRegions}
                    handleSelectedGraph={handleSelectedGraph}
                    handleGraphScale={handleGraphScale}
                    showLog={showLog}
                />

            </TwoGraphLayout>
        </BoxWithLoadingIndicator>

        </>
    )    
}

export default RegionGraphContainer