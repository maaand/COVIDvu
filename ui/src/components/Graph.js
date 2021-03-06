import React, { useEffect, useState } from 'react'

import Plot from 'react-plotly.js'

import { useMobileDetect } from '../hooks/ui'

import { Generic } from 'rbx'
import LogoElement from './LogoElement'

export const Graph = ({title, data, y_type='numeric', y_title, x_title, selected, config, showLog = false, ref=null}) => {

    const [plotsAsValues, setPlotsAsValues] = useState([])

    const detectMobile = useMobileDetect()

    const graphEl = React.createRef()

    useEffect(() => {
        let plots = {}

        const selectedData = Object.keys(data).filter(entry => selected.indexOf(entry) !== -1)

        for(const region of selectedData) {
            const normalizedRegion = region.startsWith('!') ? region.substring(1) : region
            plots[normalizedRegion] = {
                x: [],
                y: [],
                type: 'scatter',
                mode: 'lines+markers',
                name: normalizedRegion,
                showlegend: true,
                marker: {
                    size: 3
                }
            }

            const regionData = data[region]
            
            for(const key of Object.keys(regionData).sort()) {
                plots[normalizedRegion].x.push(key)
                plots[normalizedRegion].y.push(regionData[key])
            }
        }
    
        setPlotsAsValues(Object.values(plots))
    }, [selected, data, y_type])

    let mergeConfig = { ...config,
        displayModeBar: false,
        responsive: true,
    }

    let layout = {
        title: title,
        autosize: true,
        width: undefined,
        height: undefined,
        margin: {
            l: 70,
            t: 5,
            r: 10,
        }
    }
    
    if(showLog) {
        layout['yaxis'] = {
            type: 'log',
            autorange: true
        }
    }

    if(detectMobile.isMobile()) {
        layout = {
            ...layout,
            xaxis: {
                fixedrange: true
            }
        }

        if(!showLog) {
            layout = {
                ...layout,
                yaxis: {
                    fixedrange: true
                }
            }
        }
    }

    if(y_title) {
        layout = {
            ...layout,
            yaxis: {...layout.yaxis, title: y_title}
        }
    }

    if(y_title === 'Case Fatality Rate Percentage') {
        layout['yaxis'] = { ...layout['yaxis'], tickformat: '.1%'}
    }

    if(x_title) {
        layout['xaxis'].title = x_title
    }

    layout['legend'] = {
        xanchor: 'center',
        yanchor: 'top',
        y:-0.1,
        x:0.5,
    }


    return (
        <>
        <Generic id="graphPlot" ref={ref} className="vt-graph" tooltipPosition="top" tooltip="Clicking on legend items will remove them from graph">
            <div className="vt-graph-logo"><LogoElement url /></div>
            <Plot 
                data={plotsAsValues}
                layout={layout}
                config={mergeConfig}
                useResizeHandler={true}
                style={{width: '100%', height: '100%', minHeight: '45rem'}}
            />
        </Generic>
        </>
    )
}

export default Graph