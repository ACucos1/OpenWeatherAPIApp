const OPEN_WEATHER_KEY = 'ed7b4eecbe0c58373393d2c6f8ab5ec2'

let displayData = []
let pageNum = 0
let globalDir = 'next'


const onSearchClick = async () => {
    let cityName = $('#search').val()
    if(cityName.length == 0)
        console.log('Must input city name!')
    else{
        try {
            let cityData = await fetchCityData(cityName)
            populateDataDisplay(cityData)
        } catch (err) {
          console.log(err) 
        }
    }   
    
}
const fetchFlags = async (countryIds) => {
    let url = 'https://restcountries.com/v2/alpha?codes='
    countryIds.forEach(country =>{
        url += country + ","
    })

    try{
        let flags = await $.ajax(url)
        console.log(flags)
        let flagsMap = {}
        flags.forEach(country =>{ 
            // console.log(country.alpha2Code, country.flag)
            flagsMap[country.alpha2Code] = country.flag
        })

        return flagsMap
    }
    catch(err){
        console.log(err)
    }
}

const fetchCityData = async (cityName) => {
    let cityIds = []
    let countryIds = []

    try {
        let cityList = await $.getJSON('city.list.json')
    
        //Get list of city ids where name matches user search
        cityList.forEach(city => {
            if(city.name.match(cityName)){
                cityIds.push(city.id)
                countryIds.push(city.country) 
            }
        })

        //Fetch flags while exposed to country Ids
        let flags = await fetchFlags(countryIds)

        //compile all city data into array
        let weatherData = []
        await Promise.all(cityIds.map(async (cityId) => {
            console.log(cityId)
            let url = `https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${OPEN_WEATHER_KEY}`
            let data = await $.ajax(url)
            weatherData.push(data)
        }))

        return {weatherData, flags}
    } catch (err) {
        console.log(err)
    }

    
    
}

const populateDataDisplay = ({weatherData, flags}) => {
    console.log(weatherData)
    displayData = []
    weatherData.forEach((city) => {
        displayData.push(
        `<div class="city-card">
            <h1>${city.name}, ${city.sys.country} <img src="${flags[city.sys.country]}"/> ${city.weather[0].description}</h1>
            <span class="city-info">${kelvinToCelsius(city.main.temp)}°C temperature from ${kelvinToCelsius(city.main.temp_min)}°C tp ${kelvinToCelsius(city.main.temp_max)}°C, 
            wind ${city.wind.speed} m/s. clouds ${city.clouds.all}%, ${city.main.pressure}hpa</span>
            <br>
            <span class="sun">Sunrise: ${unixToHours(city.sys.sunrise)} - Sunset: ${unixToHours(city.sys.sunset)}</span>
            <br>
            <span class="city-coords">Geo coords <strong>[${city.coord.lat}, ${city.coord.lon}]</strong></span>
        </div>`)
    })

    paginateData()

}

const loadPage = (direction) => {
    $('.city-card').removeClass('scrolling-forward2')
    $('.city-card').removeClass('scrolling-backward2')
    if(direction == 'back' && pageNum - 1 >= 0){
        $('.city-card').addClass('scrolling-backward')
        globalDir = 'back'
        pageNum--
    }
    else if(direction == 'back' && pageNum -1 < 0){
        $('.city-card').addClass('scrolling-backward')
        globalDir = 'back'
        pageNum = displayData.length - 4;
    }
    else if(direction == 'next' && pageNum + 1 <= displayData.length - 3){
        $('.city-card').addClass('scrolling-forward')
        globalDir = 'next'
        pageNum++
    }
    else if(direction == 'next' && pageNum + 1 > displayData.length - 3){
        globalDir = 'next'
        $('.city-card').addClass('scrolling-forward')
        pageNum = 0
    }

    // console.log(pageNum)
    setTimeout(() => {
        paginateData()
    }, 450)

    //TODO: When card is loaded give it scrolling animation class based on scroll direction
}

const paginateData = () => {

    $('#data').empty()
    let page = pageNum
    for(let i = page; i < page + 3; i++){
        $('#data').append(displayData[i])
    }

    $('.city-card').addClass(globalDir == 'next' ? 'scrolling-forward2' : 'scrolling-backward2')
}

const kelvinToCelsius = (temp) =>{
    return (temp - 273.15).toPrecision(2)
}

const unixToHours = (unixTime) => {
    let date = new Date(unixTime * 1000)

    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}