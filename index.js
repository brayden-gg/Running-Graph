const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const fetch = require("node-fetch");
const app = express();
require("dotenv").config();
let config;

const server = app.listen(3000, () => {
    console.log("Listening at 3000");
});

// process.on('SIGTERM', () => {
//     server.close(() => {
//         console.log('Process terminated')
//     })
// })

fs.readFile("config.json", "utf8", (err, data) => {
    if (err) throw err;
    config = JSON.parse(data);
});

app.use(express.static("public"));
app.use(
    express.json({
        limit: "1mb",
    })
);

app.get("/weather/:loc", async (request, response) => {
    const apiResp = await fetch(`https://api.darksky.net/forecast/${process.env.WEATHER_KEY}/${request.params.loc}`);
    const json = await apiResp.json();
    response.json(json.currently);
});
// process.on('SIGTERM', () => {
//     server.close(() => {
//         process.exit();
//     });
// })

app.get("/quit", async (request, response) => {
    response.end();
    process.exit();
});

app.get("/update", async (request, response) => {
    let STRAVA_DATA = JSON.parse(await fsp.readFile("strava-data.json", "utf8"));
    let WEATHER_DATA = JSON.parse(await fsp.readFile("weather-data.json", "utf8"));

    STRAVA_DATA = STRAVA_DATA.filter(e => !e.errors);
    //WEATHER_DATA = WEATHER_DATA.filter((e, i) => STRAVA_DATA[i] && !STRAVA_DATA[i].errors);

    let most_recent_id = STRAVA_DATA[0].id;
    let page = 1;
    let found = false;
    let ids = [];

    //get all the ids of the activities from the list until we get to the last one in the database
    while (!found) {
        const resp = await fetch(`https://www.strava.com/api/v3/athlete/activities?access_token=${config.generated_token}&per_page=200&page=${page}`); //list of 200 activities
        console.log(`https://www.strava.com/api/v3/athlete/activities?access_token=${config.generated_token}&per_page=200&page=${page}`);
        const json = await resp.json();

        if (json.length == 0) {
            //got to the end, never found it: we're done
            console.log("reached end of list");
            break;
        }

        if (json.errors) {
            //need to fix code
            response.json(json);
            break;
        }

        for (let i = 0; i < json.length; i++) {
            //add all the ids to the list until we find it
            if (json[i].id == most_recent_id) {
                found = true;
                break;
            }

            ids.push(json[i].id);
        }

        page++;
    }

    console.log(ids);

    for (let i = ids.length - 1; i >= 0; i--) {
        const stravaResp = await fetch(`https://www.strava.com/api/v3/activities/${ids[i]}?access_token=${config.generated_token}`);
        const stravaJson = await stravaResp.json();
        if (WEATHER_DATA.length < STRAVA_DATA.length + 1) {
            if (stravaJson.type == "Run") {
                if (stravaJson.start_latlng) {
                    const weatherResp = await fetch(`https://api.darksky.net/forecast/${process.env.WEATHER_KEY}/${stravaJson.start_latlng[0]},${stravaJson.start_latlng[1]},${new Date(stravaJson.start_date).valueOf() / 1000}`);
                    const weatherJson = await weatherResp.json();
                    WEATHER_DATA.unshift(weatherJson.currently);
                } else {
                    WEATHER_DATA.unshift({
                        error: "No location data",
                    });
                }
            } else {
                WEATHER_DATA.unshift({
                    error: "Wrong activity type",
                });
            }
        }

        STRAVA_DATA.unshift(stravaJson);
    }

    if (ids.length > 0) {
        await fsp.writeFile("strava-data.json", JSON.stringify(STRAVA_DATA));
        console.log("Strava Data Updated Successfully");

        await fsp.writeFile("weather-data.json", JSON.stringify(WEATHER_DATA));
        console.log("Weather Data Updated Successfully");

        response.json({
            strava: STRAVA_DATA,
            weather: WEATHER_DATA,
        });
    } else {
        console.log("Everything is already up do date");
        response.json({
            strava: STRAVA_DATA,
            weather: WEATHER_DATA,
        });
    }
});

app.get("/getData", async (request, response) => {
    let STRAVA_DATA = JSON.parse(await fsp.readFile("strava-data.json", "utf8"));
    let WEATHER_DATA = JSON.parse(await fsp.readFile("weather-data.json", "utf8"));
    let ANALYSIS_DATA = JSON.parse(await fsp.readFile("race-analysis.json", "utf8"));
    response.json({
        strava: STRAVA_DATA,
        weather: WEATHER_DATA,
        equiv: ANALYSIS_DATA,
    });
});

app.get("/runCalc/:query", async (request, response) => {
    const res = await fetch("http://www.runworks.com/calculator.php?" + request.params.query);
    const txt = await res.text();
    response.send(txt);
});

app.post("/updateRaceAnalysis", async (request, response) => {
    let ANALYSIS_DATA = JSON.parse(await fsp.readFile("race-analysis.json", "utf8"));

    let newData = request.body.data;
    if (newData.length > request.body.size) {
        console.log("Hit max update size");
        return;
    }
    ANALYSIS_DATA.unshift(...newData);
    await fsp.writeFile("race-analysis.json", JSON.stringify(ANALYSIS_DATA));

    console.log("Race Analysis Updated Successfully");
    response.end();
});

app.get("/delete/:until", async (request, response) => {
    let until = request.params.until;

    let STRAVA_DATA = JSON.parse(await fsp.readFile("strava-data.json", "utf8"));
    let WEATHER_DATA = JSON.parse(await fsp.readFile("weather-data.json", "utf8"));
    let ANALYSIS_DATA = JSON.parse(await fsp.readFile("race-analysis.json", "utf8"));

    STRAVA_DATA = STRAVA_DATA.slice(until);
    WEATHER_DATA = WEATHER_DATA.slice(until);

    let equiv_del = Math.max(ANALYSIS_DATA.length - WEATHER_DATA.length, 0);

    ANALYSIS_DATA = ANALYSIS_DATA.slice(equiv_del);

    await fsp.writeFile("strava-data.json", JSON.stringify(STRAVA_DATA));
    console.log("Last " + until + " Strava Data Deleted Successfully");

    await fsp.writeFile("weather-data.json", JSON.stringify(WEATHER_DATA));
    console.log("Last " + until + " Weather Data Deleted Successfully");

    await fsp.writeFile("race-analysis.json", JSON.stringify(ANALYSIS_DATA));
    console.log("Last " + equiv_del + " Race Analysis Deleted Successfully");
    response.end();
});

app.get("/reloadAtIndex/:index/:runId", async (request, response) => {
    let index = +request.params.index;
    let runId = +request.params.runId;

    let STRAVA_DATA = JSON.parse(await fsp.readFile("strava-data.json", "utf8"));
    let WEATHER_DATA = JSON.parse(await fsp.readFile("weather-data.json", "utf8"));
    let ANALYSIS_DATA = JSON.parse(await fsp.readFile("race-analysis.json", "utf8"));

    const stravaResp = await fetch(`https://www.strava.com/api/v3/activities/${runId ? runId : STRAVA_DATA[index].id}?access_token=${config.generated_token}`);
    const stravaJson = await stravaResp.json();

    let weatherReplace;
    if (stravaJson.type == "Run") {
        if (stravaJson.start_latlng) {
            const weatherResp = await fetch(`https://api.darksky.net/forecast/${process.env.WEATHER_KEY}/${stravaJson.start_latlng[0]},${stravaJson.start_latlng[1]},${new Date(stravaJson.start_date).valueOf() / 1000}`);
            const weatherJson = await weatherResp.json();
            weatherReplace = weatherJson.error ? weatherJson : weatherJson.currently;
        } else {
            weatherReplace = {
                error: "No location data",
            };
        }
    } else {
        weatherReplace = {
            error: "Wrong activity type",
        };
    }

    STRAVA_DATA.splice(index, 1);
    STRAVA_DATA = [...STRAVA_DATA.slice(0, index), stravaJson, ...STRAVA_DATA.slice(index)];

    if (!stravaJson.error && !weatherReplace.error) {
        WEATHER_DATA.splice(index, 1);
        WEATHER_DATA = [...WEATHER_DATA.slice(0, index), weatherReplace, ...WEATHER_DATA.slice(index)];
    }

    let analysisIndex = ANALYSIS_DATA.length - STRAVA_DATA.length + index + 1;
    if (analysisIndex > 0) {
        ANALYSIS_DATA = ANALYSIS_DATA.slice(analysisIndex);
    }

    await fsp.writeFile("strava-data.json", JSON.stringify(STRAVA_DATA));
    console.log("Strava Data Reloaded Successfully");

    await fsp.writeFile("weather-data.json", JSON.stringify(WEATHER_DATA));
    console.log("Weather Data Reloaded Successfully");

    await fsp.writeFile("race-analysis.json", JSON.stringify(ANALYSIS_DATA));
    console.log("Last " + analysisIndex + " Race Analysis Deleted Successfully");
    response.end();
});

app.get("/fixCode/:code", async (request, response) => {
    const code = request.params.code;
    const stravaReq = await fetch(`https://www.strava.com/oauth/token?code=${code}&client_id=${config.client_id}&client_secret=${config.client_secret}&grant_type=authorization_code`, {
        method: "POST",
        body: {
            code,
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: "authorization_code",
        },
    });
    const stravaJson = await stravaReq.json();
    console.log(stravaJson);
    config.generated_token = stravaJson.access_token;

    await fsp.writeFile("config.json", JSON.stringify(config));
    console.log("Code updated:" + stravaJson.access_token);

    response.json({
        success: true,
        access_token: stravaJson.access_token,
    });
});

app.get("/config", async (request, response) => {
    response.json(config);
});
