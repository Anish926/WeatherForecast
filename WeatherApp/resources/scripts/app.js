const weatherApi = {
    key: "3c13c568e5fa599606390814852213b4",
    ForecastUrl: "https://api.openweathermap.org/data/2.5/onecall",
    indexBaseUrl : "https://api.openweathermap.org/data/2.5/uvi/forecast",
    iconBaseUrl : "https://openweathermap.org/img/w/",
    geoCodingUrl : "http://api.openweathermap.org/geo/1.0/direct"
}


const searchInputBox = document.getElementById('input-box');
const indexLabel = document.getElementById('index-0');
const rangeLabel = document.getElementById('range');
const listParent = document.getElementById('search-list');

var uvi_value=0;
var history_data;


function init(){
    history_data = localStorage.getItem('data')==null ? [] : JSON.parse(localStorage.getItem('data'));
    history_data = Array.from(new Set(history_data));
    for(let data of history_data) updateSearch(data);
}

async function searchFromHistory(event) {
    if(event.target !== event.currentTarget) return;
    await weatherForecast(event.currentTarget.id);
}

function saveSearch() {
    localStorage.setItem('data',JSON.stringify(history_data));
}

function removeSearch(event) {
    if(event.target !== event.currentTarget) return;

    let target_id = event.currentTarget.id;
    event.currentTarget.parentElement.remove();

    if (history_data.indexOf(target_id) !== -1) history_data.splice(history_data.indexOf(target_id), 1);

    saveSearch();
}

function updateSearch(city) {
    let list = document.createElement("LI");
    let span = document.createElement("SPAN");

    span.onclick = (e)=> removeSearch(e);
    span.innerHTML='&#10006;';
    span.setAttribute("id",city);

    list.onclick = (e)=>searchFromHistory(e);
    list.innerText=city;
    list.setAttribute("id",city);
    list.appendChild(span);
    listParent.appendChild(list);

    saveSearch();
}

function addSearch(city) {
    if(history_data.indexOf(city) !== -1) return;
    history_data.push(city);

    updateSearch(city);
}

function tabReset(target,tabName) {

    let tabcontent = document.getElementsByClassName("tabcontent");
    for(let i of tabcontent){
        i.style.display="none";
    }

    let tablinks = document.getElementsByClassName("tablink");
    for (let i of tablinks) {
        i.className = i.className.replace(" active", "");
    }

    target.className+=" active";
    document.getElementById(tabName).style.display = "block";
}

function tabChange(event, tabName) {
    tabReset(event.currentTarget,tabName);
}

indexLabel.onmouseover = function() {
    let color,text;

    if(uvi_value<3){
        color='green';
        text='(favorable)';
    } else if(uvi_value<6){
        color='orange';
        text = '(moderate)';
    } else {
        color = 'red';
        text= '(severe)';
    }

    this.style.color =color;
    this.style.fontWeight='bold';
    rangeLabel.innerText=text;
}

indexLabel.onmouseleave = function() {
    this.style.color='#582233';
    this.style.fontWeight='normal';
    rangeLabel.innerText='';    
}

function reset() {
    document.querySelector('.body').style.display = "none";
    document.getElementById('error').innerText=`Invalid!`;
    document.getElementById('input-box').style.backgroundColor='white';

    tabReset(document.getElementById('currenttab'),"current");
}

async function weatherForecast(val) {
    const Geo = await getGeo(val);

    if(Geo.success) {
        const weatherInfo = await getWeather(Geo.lat, Geo.lon); 

        if(weatherInfo.success){
            document.getElementById('error').innerText=``;
            document.getElementById('input-box').style.backgroundColor='rgb(245, 255, 250)';
            displayWeather(Geo.country,Geo.city,weatherInfo.data); 

            document.querySelector('.body').style.display = "block";
            addSearch(Geo.city);
        } else {
           reset();
        }

    } else {
        reset();
    }
}
searchInputBox.addEventListener('keypress', async (event)=> {
    if(event.key == "Enter") {
        await weatherForecast(searchInputBox.value);
    }
});

async function getGeo(city) {
    try{
        const response = await fetch(`${weatherApi.geoCodingUrl}?q=${city}&appid=${weatherApi.key}`);

        if(response.ok) {
            const geo = await response.json();
            const lat = geo[0].lat;
            const lon = geo[0].lon;
            const city = geo[0].name;
            const country = geo[0].country;
            return {success: true, lat: lat, lon:lon, city:city, country:country};
        }
        return {success: false, error: response.statusText};

    } catch(err){
        return {success: false, error: err.message};
    }
}

async function getWeather(lat, lon) {
    
    try {
        const response = await fetch(`${weatherApi.ForecastUrl}?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=metric&appid=${weatherApi.key}`); 

        if(response.ok) {
            
            const forecast = await response.json();
            return {success: true, data: forecast};      
        }
        return {success: false, error: response.statusText};

    } catch (err) {
        return {success: false, error: err.message};
    }

};

function displayWeather(country,city,data) {
    data.daily[0] = data.current;

    let City = document.getElementsByClassName('city');
    for(let i of City){
        i.innerText = `${city}, ${country}`;
    }

    let weatherStatus = document.getElementById('weather-0');
    weatherStatus.innerText = `${data.daily[0].weather[0].main}`;

     
    let windspeed = document.getElementById('windspeed-0');
    windspeed.innerHTML = `${Math.round(data.daily[0].wind_speed)}m/s`;

    let index = document.getElementById('index-0');
    uvi_value= Math.round(data.daily[0].uvi);
    index.innerHTML=`${uvi_value}`;
    
    for(var i=0;i<=5;i++){
       
        let temperature = document.getElementById('temp-'+i);
        temperature.innerHTML = i>0 ? `${Math.round(data.daily[i].temp.day)}&deg;C` :`${Math.round(data.daily[i].temp)}&deg;C` ;

        let humidity = document.getElementById('humidity-'+i);
        humidity.innerHTML = i>0 ? `Humidity: ${Math.round(data.daily[i].humidity)}%` : `${Math.round(data.daily[i].humidity)}%`;
       

        let date = document.getElementById('date-'+i);
        let todayDate = new Date();
        todayDate.setDate(todayDate.getDate()+i);
        date.innerText = dateManage(todayDate,i);

        let iconUrl = weatherApi.iconBaseUrl+data.daily[i].weather[0].icon+".png";
        document.getElementById("weather-icon-"+i).src =iconUrl;
    }
}

function dateManage(dateArg,i) {
    let days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
    let months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    let year = dateArg.getFullYear();
    let month = months[dateArg.getMonth()];
    let date = dateArg.getDate()    ;
    let day = days[dateArg.getDay()];

    return i>0 ? `${month} ${date}` :`${day}, ${month} ${date}, ${year}` ;
} 

init();
