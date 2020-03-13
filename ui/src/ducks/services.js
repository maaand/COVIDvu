// Action Types
import {call, put, takeEvery} from "redux-saga/effects"

import DataService from '../services'

import { createAction } from '@reduxjs/toolkit'

// Action Types
export const types = {
    FETCH_GLOBAL: 'FETCH_GLOBAL',
    FETCH_GLOBAL_SUCCESS: 'FETCH_GLOBAL_SUCCESS',
    FETCH_GLOBAL_ERROR: 'FETCH_GLOBAL_ERROR',

    FETCH_US_STATES: 'FETCH_US_STATES',
    FETCH_US_STATES_SUCCESS: 'FETCH_US_STATES_SUCCESS',
    FETCH_US_STATES_ERROR: 'FETCH_US_STATES_ERROR',

    FETCH_US_REGIONS: 'FETCH_US_REGIONS',
    FETCH_US_REGIONS_SUCCESS: 'FETCH_US_REGIONS_SUCCESS',
    FETCH_US_REGIONS_ERROR: 'FETCH_US_REGIONS_ERROR',

    FETCH_LAST_UPDATE: 'FETCH_LAST_UPDATE',
    FETCH_LAST_UPDATE_SUCCESS: 'FETCH_LAST_UPDATE_SUCCESS',
    FETCH_LAST_UPDATE_ERROR: 'FETCH_LAST_UPDATE_ERROR',

}

// Action Creators
export const actions = {
    fetchGlobal: createAction(types.FETCH_GLOBAL),
    fetchUSStates: createAction(types.FETCH_US_STATES),
    fetchUSRegions: createAction(types.FETCH_US_REGIONS),
    fetchLastUpdate: createAction(types.FETCH_LAST_UPDATE),
}

// Reducers
export const initialState = {
    global: {},
    usStates: {},
    usRegions: {},
    lastUpdate: undefined
}

export default function (state = initialState, action) {
    // const message = action && action.error ? action.error.message : null
    switch (action.type) {
        case types.FETCH_GLOBAL_SUCCESS:
            return {
                ...state,
                global: { 
                    confirmed: action.confirmed,
                    sortedConfirmed: action.sortedConfirmed,
                    statsTotals: action.statsTotals,
                    deaths: action.deaths,
                    recovered: action.recovered,
                    mortality: action.mortality,
                    recovery: action.recovery
                }
            }
        case types.FETCH_US_STATES_SUCCESS:
            return {
                ...state,
                usStates: { 
                    confirmed: action.confirmed,
                    sortedConfirmed: action.sortedConfirmed,
                    statsTotals: action.statsTotals,
                    deaths: action.deaths,
                    recovered: action.recovered,
                    mortality: action.mortality,
                    recovery: action.recovery
                }
            }
        case types.FETCH_US_REGIONS_SUCCESS:
            return {
                ...state,
                usRegions: { 
                    confirmed: action.confirmed,
                    sortedConfirmed: action.sortedConfirmed,
                    deaths: action.deaths,
                    recovered: action.recovered,
                    mortality: action.mortality,
                    recovery: action.recovery
                }
            }
        case types.FETCH_LAST_UPDATE_SUCCESS:
            return {
                ...state,
                lastUpdate: action.payload,
            }
        default:
            return state
    }
}

const calculateMortalityAndRecovery = (deaths, confirmed, recovered) => {
    let mortality = {}
    let recovery = {}

    if(deaths !== null && confirmed !== null && recovered !== null) {
    
        for(const country of Object.keys(deaths)) {
            for(const date of Object.keys(deaths[country])) {
                let deathAtDate = deaths[country][date]

                if(!confirmed.hasOwnProperty(country)) {
                    continue
                }
                let confirmedAtDate = confirmed[country][date]

                if(!recovered.hasOwnProperty(country)) {
                    continue
                }
                let recoveredAtDate = recovered[country][date]

                if(!mortality.hasOwnProperty(country)) {
                    mortality[country] = {}
                }
                if(!recovery.hasOwnProperty(country)) {
                    recovery[country] = {}
                }
                mortality[country][date] = deathAtDate / confirmedAtDate
                recovery[country][date] = recoveredAtDate / confirmedAtDate
            }
        }
    }

    return { mortality, recovery }
}

const extractLatestCounts = (stats) => {
    const regionWithLatestCounts = []

    for(const region of Object.keys(stats)) {
        const dates = Object.keys(stats[region])

        const lastDate = dates[dates.length - 1]

        regionWithLatestCounts.push({ region: region, stats: stats[region][lastDate] })
    }

    return regionWithLatestCounts
}

const filterCountries = ['!Outside Mainland China', 'Mainland China', 'Korea, South', 'United Kingdom', 'Czechia', 'Taiwan*', 'Iran (Islamic Republic of)', 'Viet Nam']

// Sagas
export function* fetchGlobal() {
    console.time('fetchGlobal')

    const dataService = new DataService()

    try {
        let confirmed = yield call(dataService.getConfirmed)
        let deaths = yield call(dataService.getDeaths)
        let recovered = yield call(dataService.getRecovered)
        
        for(let filterCountry of filterCountries) {
            if(confirmed.hasOwnProperty(filterCountry)) {
                 delete confirmed[filterCountry]
            }
            if(deaths.hasOwnProperty(filterCountry)) {
                 delete deaths[filterCountry]
            }
            if(recovered.hasOwnProperty(filterCountry)) {
                 delete recovered[filterCountry]
            }
        }
        
        const { mortality, recovery } = calculateMortalityAndRecovery(deaths, confirmed, recovered)

        const confirmedCounts = extractLatestCounts(confirmed)
        const deathsCounts = extractLatestCounts(deaths)
        const recoveredCounts = extractLatestCounts(recovered)
        const mortalityCounts = extractLatestCounts(mortality)
        const recoveryCounts = extractLatestCounts(recovery)
        const sortedConfirmed = confirmedCounts.sort((a, b) => b.stats - a.stats)
        
        const deathByCountryKey = deathsCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const recoveredByCountryKey = recoveredCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const mortalityByCountryKey = mortalityCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const recoveryByCountryKey = recoveryCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        let statsTotals = []
        
        for(const confirmData of sortedConfirmed) {
            const region = confirmData.region
            statsTotals.push({
                region: region,
                confirmed: confirmData.stats,
                deaths: deathByCountryKey[region].stats,
                recovered: recoveredByCountryKey[region].stats,
                mortality: mortalityByCountryKey[region].stats,
                recovery: recoveryByCountryKey[region].stats
            })
        }

        yield put(
            { 
                type: types.FETCH_GLOBAL_SUCCESS, 
                confirmed: confirmed, 
                sortedConfirmed: sortedConfirmed,
                statsTotals: statsTotals,
                deaths: deaths, 
                recovered: recovered,
                mortality: mortality,
                recovery: recovery
            }
        )    
    } catch(error) {
        console.error(error)
    }

    console.timeEnd('fetchGlobal')
}

const filterStates = ['Unassigned']

export function* fetchUSStates() {
    const dataService = new DataService()

    try {
        let confirmed = yield call(dataService.getConfirmed, '-US')
        let deaths = yield call(dataService.getDeaths, '-US')
        let recovered = yield call(dataService.getRecovered, '-US')

        for(let filterState of filterStates) {
            if(confirmed.hasOwnProperty(filterState)) {
                 delete confirmed[filterState]
            }
            if(deaths.hasOwnProperty(filterState)) {
                 delete deaths[filterState]
            }
            if(recovered.hasOwnProperty(filterState)) {
                 delete recovered[filterState]
            }
        }

        const { mortality, recovery } = calculateMortalityAndRecovery(deaths, confirmed, recovered)

        const confirmedCounts = extractLatestCounts(confirmed)

        const deathsCounts = extractLatestCounts(deaths)
        const recoveredCounts = extractLatestCounts(recovered)
        const mortalityCounts = extractLatestCounts(mortality)
        const recoveryCounts = extractLatestCounts(recovery)
        const sortedConfirmed = confirmedCounts.sort((a, b) => b.stats - a.stats)

        const deathByRegionKey = deathsCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const recoveredByRegionKey = recoveredCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const mortalityByRegionKey = mortalityCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        const recoveryByRegionKey = recoveryCounts.reduce((obj, item) => {
            obj[item.region] = item
            return obj
        }, {})

        let statsTotals = []
        
        for(const confirmData of sortedConfirmed) {
            const region = confirmData.region
            statsTotals.push({
                region: region,
                confirmed: confirmData.stats,
                deaths: deathByRegionKey[region].stats,
                recovered: recoveredByRegionKey[region].stats,
                mortality: mortalityByRegionKey[region].stats,
                recovery: recoveryByRegionKey[region].stats
            })
        }

        yield put(
            { 
                type: types.FETCH_US_STATES_SUCCESS, 
                confirmed: confirmed, 
                sortedConfirmed: sortedConfirmed,
                statsTotals: statsTotals,
                deaths: deaths, 
                recovered: recovered,
                mortality: mortality,
                recovery: recovery
            }
        )    
    } catch(error) {
        console.error(error)
    }
}

export function* fetchLastUpdate() {
    const dataService = new DataService()

    const lastUpdate = yield call(dataService.fetchLastUpdate)

    yield put({ type: types.FETCH_LAST_UPDATE_SUCCESS, payload: lastUpdate})
}


export function* fetchUSRegions() {
    const dataService = new DataService()

    try {
        const confirmed = yield call(dataService.getConfirmed, '-US-Regions')
        const deaths = yield call(dataService.getDeaths, '-US-Regions')
        const recovered = yield call(dataService.getRecovered, '-US-Regions')

        const latestCounts = extractLatestCounts(confirmed)

        const sortedConfirmed = latestCounts.sort((a, b) => b.confirmed - a.confirmed)

        const { mortality, recovery } = calculateMortalityAndRecovery(deaths, confirmed, recovered)

        yield put(
            { 
                type: types.FETCH_US_REGIONS_SUCCESS,
                confirmed: confirmed, 
                sortedConfirmed: sortedConfirmed,
                deaths: deaths, 
                recovered: recovered,
                mortality: mortality,
                recovery: recovery
            }
        )    
    } catch(error) {
        console.error(error)
    }
}

export const sagas = [
    takeEvery(types.FETCH_GLOBAL, fetchGlobal),
    takeEvery(types.FETCH_US_STATES, fetchUSStates),
    takeEvery(types.FETCH_US_REGIONS, fetchUSRegions),
    takeEvery(types.FETCH_LAST_UPDATE, fetchLastUpdate),
]