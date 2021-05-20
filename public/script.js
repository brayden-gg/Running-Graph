document.getElementById("graph").width = window.outerWidth - 500;

const SLOW = new Time("12:00");

let points = [[], [], [], []];

let commonEvents = [
    {
        names: ["100", "x1", "split"],
        distance: 100,
    },
    {
        names: ["200", "x2", "split"],
        distance: 200,
    },
    {
        names: ["400", "x4", "relay", "split"],
        distance: 400,
    },
    {
        names: ["600y", "600"],
        distance: 548.64,
    },
    {
        names: ["600m", "600"],
        distance: 600,
    },
    {
        names: ["800", "x8"],
        distance: 800,
    },
    {
        names: ["1000y", "1000"],
        distance: 914.4,
    },
    {
        names: ["1000m", "1000"],
        distance: 1000,
    },
    {
        names: ["1600", "DMR", "7min"],
        distance: 1600,
    },
    {
        names: ["mile", "1 mile", "invite", "scrimmage"],
        distance: 1609.34,
    },
    {
        names: ["3k", "3000", "3000m", "invite"],
        distance: 3000,
    },
    {
        names: ["2 mile", "miles", "2mile", "2 "],
        distance: 3218.68,
    },
    {
        names: ["2.5 miles", "2.5", "boathouse"],
        distance: 4023.35,
    },
    {
        names: ["invite"],
        distance: 5000,
    },
];

let units = {
    temperature: {
        TITLE: "Temperature",
        SYMBOL: "℉`",
        DISPLAY: val => val.toFixed(1) + " ℉",
        GENERATE: (_, weather) => weather.temperature,
    },
    apparentTemperature: {
        TITLE: "Apparent Temperature",
        SYMBOL: "℉`",
        DISPLAY: val => val.toFixed(1) + " ℉",
        GENERATE: (_, weather) => weather.apparentTemperature,
    },
    humidity: {
        TITLE: "Humidity",
        SYMBOL: "%",
        DISPLAY: val => (val * 100).toFixed(0) + "%",
        GENERATE: (_, weather) => weather.humidity,
    },
    date: {
        TITLE: "Date",
        SYMBOL: "M/D/YY",
        DISPLAY: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 2000}`;
        },
        GENERATE: run => new Date(run.start_date).valueOf(),
    },
    date_of_year: {
        TITLE: "Date of Year",
        SYMBOL: "M/D",
        DISPLAY: val => {
            let d = new Date(val);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        },
        GENERATE: run => new Date(run.start_date).setYear(1970),
    },
    day_of_week: {
        TITLE: "Day of Week",
        SYMBOL: "M/D",
        DISPLAY: val => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][val],
        GENERATE: run => (new Date(run.start_date).getDay() == 0 ? 6 : new Date(run.start_date).getDay() - 1),
    },
    windSpeed: {
        TITLE: "Wind Speed",
        SYMBOL: "mph",
        DISPLAY: val => val + "mph",
        GENERATE: (_, weather) => weather.windSpeed,
    },
    pace: {
        TITLE: "Pace",
        SYMBOL: "min/mi",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            let total = 0;
            let len = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        total += pace;
                        len++;
                    }
                }
                if (len != 0) {
                    return total / len;
                }
            }
            let pace = calcPace(run.distance, run.moving_time);
            return pace < new Time("30:00") ? pace.valueOf() : undefined;
        },
    },
    average_speed: {
        TITLE: "Speed",
        SYMBOL: "m/s",
        DISPLAY: val => val.toFixed(1),
        GENERATE: run => {
            let meters = 0;
            let seconds = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        meters += s.distance;
                        seconds += s.moving_time;
                    }
                }
                if (seconds != 0) {
                    return meters / seconds;
                }
            }
            return run.average_speed;
        },
    },
    distance: {
        TITLE: "Distance",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => run.distance / 1609.34,
    },

    moving_time: {
        TITLE: "Moving Time",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.moving_time,
    },
    elapsed_time: {
        TITLE: "Elapsed Time",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.elapsed_time,
    },
    average_cadence: {
        TITLE: "Cadence",
        SYMBOL: "SPM",
        DISPLAY: val => val.toFixed(1) + " SPM",
        GENERATE: run => {
            let steps = 0;
            let time = 0;
            if (run.laps && run.workout_type == 3) {
                for (let s of run.laps) {
                    let pace = calcPace(s.distance, s.moving_time);
                    if (pace < SLOW) {
                        steps += s.average_cadence * s.moving_time;
                        time += s.moving_time;
                    }
                }
                if (time != 0) {
                    return (steps / time) * 2;
                }
            }
            return run.average_cadence * 2;
        },
    },
    total_elevation_gain: {
        TITLE: "Elevation Gain",
        SYMBOL: "ft",
        DISPLAY: val => val.toFixed(1) + "ft",
        GENERATE: (run, weather) => run.total_elevation_gain * 3.28083989501,
    },
    perceived_exertion: {
        TITLE: "Perceived Exertion",
        SYMBOL: "1-10",
        DISPLAY: val => val,
        GENERATE: run => run.perceived_exertion,
    },
    relative_effort: {
        TITLE: "Relative Effort",
        SYMBOL: "",
        DISPLAY: val => val,
        GENERATE: run => run.suffer_score,
    },
    calories: {
        TITLE: "Calories",
        SYMBOL: "Cal",
        DISPLAY: val => val,
        GENERATE: run => run.calories,
    },
    average_heartrate: {
        TITLE: "Average Heartrate",
        SYMBOL: "bpm",
        DISPLAY: val => val,
        GENERATE: run => run.average_heartrate,
    },
    best_efforts: {
        TITLE: "Best Efforts",
        DROP_DOWN: [""],
    },

    equivalent_times: {
        TITLE: "Equivalent Race Times",
    },

    flat_equivalent: {
        TITLE: "Equivalent Race Times (Flat)",
    },

    temp_equivalent: {
        TITLE: "Equivalent Race Times (at 60℉)",
    },

    flat_temp_equivalent: {
        TITLE: "Equivalent Race Times (Flat and at 60℉)",
    },

    toFlat: {
        TITLE: "Race Time (Flat)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run?.race_analysis.toFlat,
    },

    to60: {
        TITLE: "Race Time at (at 60℉)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run.race_analysis?.to60,
    },

    toFlat_and_to60: {
        TITLE: "Race Time (Flat and at 60℉)",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => run?.race_analysis.toFlat_and_to60,
    },

    race_split_times: {
        TITLE: "Race Split Times",
        SYMBOL: "Seconds",
        DISPLAY: val => Time.stringify(val, 1),
        GENERATE: run => {
            if (run.workout_type !== 1) {
                return;
            }
            let matches = run.description.match(/(?<!\d)(?:\d{1,2}\:){1,2}\d{2}(?:\.\d+)?(?!\d)/g);
            if (matches && matches.length > 1) {
                matches = matches.map(e => Time.parse(e));
                let index = 0;

                return matches;
            }

            let laps = run.laps?.length > 2 ? run.laps : run.splits_standard?.length > 2 ? run.splits_standard : undefined;
            return laps?.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00") && e.elapsed_time < new Time("12:30")).map((_, i, a) => a.filter(e => e.split - 1 <= i).reduce((p, c) => p + c.elapsed_time, 0));
        },
        COLOR: data => {
            let point = data.dataset.data[data.dataIndex];
            return `rgba(${Math.min(point.y / predictTime(point.run), 1) * 255}, 28, 28, 0.6)`;
        },
    },

    workout_split_times: {
        TITLE: "Workout Splits",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            if (run.workout_type !== 3) {
                return;
            }
            let matches = run.description.match(/(?:\d{1,2}\:){1,2}\d{2}(?:\.\d+)?/g);
            if (run.name.match(/[1-4][05]0/)) {
                //distance is 100m-450m: allow time formats without colon separator
                let seconds = run.description.match(/(?<![\d.:])(?:\d{2})(?:\.\d+)?(?![\d.])/g);
                matches = matches && seconds ? matches.concat(seconds) : matches ?? seconds;
            }

            if (matches) {
                return matches.map(e => Time.parse(e)).filter(e => e < new Time("12:30"));
            }

            if (run?.laps?.length > 3) {
                return run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00") && e.elapsed_time < new Time("12:30")).map(e => e.elapsed_time);
            }
        },
    },

    workout_split_paces: {
        TITLE: "Workout Splits (Pace)",
        SYMBOL: "min/mi",
        DISPLAY: Time.stringify,
        GENERATE: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => calcPace(e.distance, e.elapsed_time)) : undefined),
    },

    workout_split_distances: {
        TITLE: "Workout Splits (Distance)",
        SYMBOL: "m",
        DISPLAY: val => val + "m",
        GENERATE: run => (run.workout_type == 3 && run?.laps?.length > 3 ? run.laps.filter(e => calcPace(e.distance, e.elapsed_time) < new Time("8:00")).map(e => e.distance) : undefined),
    },

    avg_workout_split_time: {
        TITLE: "Average Workout Split",
        SYMBOL: "Seconds",
        DISPLAY: Time.stringify,
        GENERATE: run => {
            let splits = units.workout_split_times.GENERATE(run);
            if (splits?.length) {
                //not nullish or length 0
                return splits.reduce((p, c) => p + c, 0) / splits.length;
            }
        },
    },
    weekly_mileage: {
        TITLE: "Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            let dayOfWeek = runDate.getDay() == 0 ? 6 : runDate.getDay() - 1;
            const monday = new Date(runDate.valueOf() - millisPerDay * dayOfWeek);
            monday.setHours(0, 0, 0);
            const nextMonday = new Date(monday.valueOf() + millisPerDay * 7 - 1000);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monday && new Date(e.start_date) <= nextMonday);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_weekly_mileage: {
        TITLE: "Cumulative Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            let dayOfWeek = runDate.getDay() == 0 ? 6 : runDate.getDay() - 1;
            const monday = new Date(runDate.valueOf() - millisPerDay * dayOfWeek);
            monday.setHours(0);
            monday.setMinutes(0);
            monday.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monday && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    rolling_weekly_mileage: {
        TITLE: "Rolling Weekly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const sevenDaysAgo = new Date(runDate.valueOf() - millisPerDay * 7);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= sevenDaysAgo && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_monthly_mileage: {
        TITLE: "Cumulative Monthly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const monthDay = new Date(runDate);
            monthDay.setDate(1);
            monthDay.setHours(0);
            monthDay.setMinutes(0);
            monthDay.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= monthDay && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
    cumulative_yearly_mileage: {
        TITLE: "Cumulative Yearly Mileage",
        SYMBOL: "Miles",
        DISPLAY: val => val.toFixed(1) + " Mi",
        GENERATE: run => {
            const runDate = new Date(run.start_date);
            const millisPerDay = 1000 * 60 * 60 * 24;
            const yearDay = new Date(runDate);
            yearDay.setMonth(0);
            yearDay.setDate(1);
            yearDay.setHours(0);
            yearDay.setMinutes(0);
            yearDay.setSeconds(0);
            const runsThisWeek = data.strava.filter(e => new Date(e.start_date) >= yearDay && new Date(e.start_date) <= runDate);
            const totalDist = runsThisWeek.reduce((p, c) => (c.type == "Run" ? p + c.distance : p), 0);
            return totalDist / 1609.34;
        },
    },
};

let modularAxes = {
    best_efforts: {
        add: params => {
            let d = params.bestEffort;
            units["best_efforts_" + d] = {
                TITLE: "Best Effort (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.best_efforts?.find(e.name == d)?.elapsed_time,
            };

            return d;
        },
        className: "hideBestEffort",
    },
    equivalent_times: {
        add: params => {
            let d = params.equivDist;
            units["equivalent_times_" + d] = {
                TITLE: "Equivalent Race Time: (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    flat_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["flat_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (Flat): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.flat_equivalent?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    temp_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["temp_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (at 60℉): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.temp_equivalent?.[d] ?? run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
    flat_temp_equivalent: {
        add: params => {
            let d = params.equivDist;
            units["flat_temp_equivalent_" + d] = {
                TITLE: "Equivalent Race Time (Flat and at 60℉): (" + d + ")",
                SYMBOL: "Seconds",
                DISPLAY: Time.stringify,
                GENERATE: run => run.race_analysis?.flat_temp_equivalent?.[d] ?? run.race_analysis?.equivalent_times?.[d],
            };

            return d;
        },
        className: "hideEquivalentDistances",
    },
};

let query = new URLSearchParams(window.location.search);
let data;
let graph;

//set defaults for dropdowns/axies

let xAxis = query.get("x") || "date";
let yAxis = query.get("y") || "pace";

let flipFilter = query.get("flipFilter") || "off";
let enableTrendLine = query.get("trendLine") || "off";
let bestEffortY = query.get("bestEffortY") || "400m";
let bestEffortX = query.get("bestEffortX") || "400m";
let equivDistX = query.get("equivDistX") || "1 mile";
let equivDistY = query.get("equivDistY") || "1 mile";
let filterTextInc = query.get("filterInc") || ".";
let filterTextExc = query.get("filterExc") || "a^";

for (let axis of ["x", "y"]) {
    //add options to both axies
    for (let opt in units) {
        let parent = document.getElementById(axis);

        let child = document.createElement("option");
        child.setAttribute("value", opt);
        child.innerText = units[opt].TITLE;

        parent.appendChild(child);
    }
}

document.getElementById("x").value = xAxis;
document.getElementById("y").value = yAxis;
document.getElementById("bestEffortX").value = bestEffortX;
document.getElementById("bestEffortY").value = bestEffortY;
document.getElementById("equivDistX").value = equivDistX;
document.getElementById("equivDistY").value = equivDistY;
document.getElementById("filterBoxInc").value = filterTextInc == "." ? "" : filterTextInc;
document.getElementById("filterBoxExc").value = filterTextExc == "a^" ? "" : filterTextExc;

document.getElementById("trendLine").checked = enableTrendLine == "on";

if (modularAxes[xAxis]) {
    document.getElementById(modularAxes[xAxis].className + "X").className = "";
    xAxis += "_" + modularAxes[xAxis].add({ bestEffort: bestEffortX, equivDist: equivDistY });
}

if (modularAxes[yAxis]) {
    document.getElementById(modularAxes[yAxis].className + "Y").className = "";
    yAxis += "_" + modularAxes[yAxis].add({ bestEffort: bestEffortY, equivDist: equivDistY });
}

let xLabel = `${units[xAxis].TITLE} (${units[xAxis].SYMBOL})`;
let yLabel = `${units[yAxis].TITLE} (${units[yAxis].SYMBOL})`;

(async () => {
    let configReq = await fetch("/config");
    let config = await configReq.json();
    let response = await fetch("/getData");
    let json = await response.json();

    data = {
        weather: json.weather,
        equiv: json.equiv,
        strava: json.strava.map((e, i) => ({ ...e, race_analysis: json.equiv[i] })),
    };

    console.log(data);

    makeChart(data);

    let updatedReq = await fetch("/update");
    let updatedJson = await updatedReq.json();

    if (updatedJson.errors) {
        window.location.replace(`https://www.strava.com/oauth/authorize?client_id=${config.client_id}&response_type=code&redirect_uri=http://localhost:3000/exchange_token.html${window.location.search}&approval_prompt=force&scope=activity:read_all`);
    }

    let addToAnalysis = [];

    console.log("updating race analysis");

    for (let i = 0; i < updatedJson.strava.length - data.equiv.length; i++) {
        //get race analysis for each new activity
        let analysis = {};
        if (updatedJson.strava[i].workout_type == 1) {
            let run = {
                ...updatedJson.strava[i],
                elapsed_time: predictTime(updatedJson.strava[i]),
                distance: predictDistance(updatedJson.strava[i]),
            };

            console.log(run);

            analysis.toFlat = (await getAdjustedHillsTime(run)).toFlat;
            analysis.equivalent_times = await getEquivalentTimes(run);
            analysis.to60 = await getAdjustedTempTime(run, updatedJson.weather[i]);

            analysis.toFlat_and_to60 = await getAdjustedTempTime({ ...run, elapsed_time: analysis.toFlat }, updatedJson.weather[i]);
            analysis.flat_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.toFlat });
            analysis.temp_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.to60 });
            analysis.flat_temp_equivalent = await getEquivalentTimes({ ...run, elapsed_time: analysis.toFlat_and_to60 });

            analysis.original = {
                distance: run.distance,
                elapsed_time: run.elapsed_time,
                name: run.name,
            };
        } else {
            analysis = {
                error: "Not a race",
            };
        }

        addToAnalysis.push(analysis);
    }
    console.log(addToAnalysis);

    let body = JSON.stringify({
        data: addToAnalysis,
        size: updatedJson.strava.length,
    });

    if (addToAnalysis.length > 0) {
        //add them to the json file
        await fetch("/updateRaceAnalysis", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body,
        });
    }
})();

function makeChart(data) {
    let stravaData = data.strava.filter(e => (e.name ? e.name.match(new RegExp(filterTextInc, "i")) != null && e.name.match(new RegExp(filterTextExc, "i")) == null : false));
    let weatherData = data.weather.filter((e, i) => (data.strava[i].name ? data.strava[i].name.match(new RegExp(filterTextInc, "i")) != null && data.strava[i].name.match(new RegExp(filterTextExc, "i")) == null : false));

    console.log(xAxis, yAxis);

    let labels = [];

    for (let i = 0; i < stravaData.length; i++) {
        const run = stravaData[i];
        const weather = weatherData[i];

        let xs = units[xAxis].GENERATE(run, weather);
        let ys = units[yAxis].GENERATE(run, weather);

        let category = +run.workout_type;

        xs = xs instanceof Array ? xs : [xs];
        ys = ys instanceof Array ? ys : [ys];

        for (let x of xs) {
            for (let y of ys) {
                if (x !== undefined && y !== undefined && run.type == "Run") {
                    points[category].push({ x, y, run, weather });
                    labels.push(run.name);
                }
            }
        }
    }

    let ctx = document.getElementById("graph").getContext("2d");
    graph = new Chart(ctx, {
        type: "scatter",

        data: {
            labels: labels,
            datasets: [
                {
                    label: "Run",
                    data: points[0],
                    backgroundColor: "rgba(28, 200, 28, 0.4)",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    trendlineLinear:
                        enableTrendLine == "on" && points[0].length > 1
                            ? {
                                  style: "rgba(28, 200, 28, 0.5)",
                                  lineStyle: "solid",
                                  width: 4,
                              }
                            : undefined,
                },
                {
                    label: "Race",
                    data: points[1],
                    backgroundColor: units[yAxis].COLOR || "rgba(255, 28, 28, 0.6)",
                    pointRadius: 8,
                    pointHoverRadius: 7,
                    trendlineLinear:
                        enableTrendLine == "on" && points[1].length > 1
                            ? {
                                  style: "rgba(255, 28, 28, 0.6)",
                                  lineStyle: "solid",
                                  width: 4,
                              }
                            : undefined,
                },
                {
                    label: "Long Run",
                    data: points[2],
                    backgroundColor: "rgba(28, 28, 200, 0.45)",
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    trendlineLinear:
                        enableTrendLine == "on" && points[2].length > 1
                            ? {
                                  style: "rgba(28, 28, 200, 0.45)",
                                  lineStyle: "solid",
                                  width: 4,
                              }
                            : undefined,
                },
                {
                    label: "Workout",
                    data: points[3],
                    backgroundColor: "rgba(200, 0, 200, 0.6)",
                    pointRadius: 6,
                    pointHoverRadius: 7,
                    trendlineLinear:
                        enableTrendLine == "on" && points[3].length > 1
                            ? {
                                  style: "rgba(200, 0, 200, 0.6)",
                                  lineStyle: "solid",
                                  width: 4,
                              }
                            : undefined,
                },
            ],
        },
        options: {
            tooltips: {
                bodyFontSize: 15,
                callbacks: {
                    label: (tooltipItem, data) => {
                        let run = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].run;
                        let xLabel = units[xAxis].DISPLAY(tooltipItem.xLabel);
                        let yLabel = units[yAxis].DISPLAY(tooltipItem.yLabel);

                        if (yAxis == "race_split_times") {
                            let sameRun = data.datasets[tooltipItem.datasetIndex].data.filter(e => e.run.id == run.id && e.y < tooltipItem.yLabel);
                            if (sameRun.length) {
                                let lastSplit = tooltipItem.yLabel - sameRun.reduce((p, c) => (c.y > p ? c.y : p), 0);
                                yLabel += " - " + Time.stringify(lastSplit, 1);
                            }
                        }

                        return `${run.name}: (${xLabel}, ${yLabel})`;
                    },
                },
            },
            scales: {
                xAxes: [
                    {
                        type: "linear",
                        position: "bottom",
                        scaleLabel: {
                            display: true,
                            labelString: xLabel,
                        },
                        ticks: {
                            callback: val => units[xAxis].DISPLAY(val),
                            maxRotation: 0,
                            minRotation: 0,
                            autoskip: true,
                            // beginAtZero: true
                        },
                    },
                ],
                yAxes: [
                    {
                        scaleLabel: {
                            display: true,
                            labelString: yLabel,
                        },
                        ticks: {
                            callback: val => units[yAxis].DISPLAY(val),
                        },
                    },
                ],
            },
            title: {
                display: true,
                text: `Visualizing Running Data: ${units[xAxis].TITLE} vs. ${units[yAxis].TITLE}`,
                fontSize: 60,
            },
            responsive: false,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                        speed: 10,
                        threshold: 10,
                    },
                    zoom: {
                        enabled: true,
                        mode: "x",
                    },
                },
            },
        },
    });

    graph.options.plugins.zoom.pan.rangeMin = {
        x: graph.scales["x-axis-1"].min,
    };
    graph.options.plugins.zoom.pan.rangeMax = {
        x: graph.scales["x-axis-1"].max,
    };
    graph.options.plugins.zoom.zoom.rangeMin = {
        x: graph.scales["x-axis-1"].min,
    };
    graph.options.plugins.zoom.zoom.rangeMax = {
        x: graph.scales["x-axis-1"].max,
    };

    document.getElementById("graph").onclick = async function (evt) {
        let activePoint = graph.getElementAtEvent(evt);
        if (activePoint[0]) {
            let chartData = activePoint[0]._chart.config.data;
            let category = activePoint[0]._datasetIndex;
            let idx = activePoint[0]._index;

            let value = chartData.datasets[category].data[idx];

            console.log(value, activePoint[0]);

            let widget = document.getElementById("widget");

            let splits_tag = "";
            let dots = false;
            let splits = value.run.laps;
            if (splits) {
                if (value.run.splits_standard && splits.length <= 1) {
                    splits = value.run.splits_standard;
                }
                let show = splits.filter(e => {
                    let pace = calcPace(e.distance, e.moving_time);
                    return value.run.workout_type != 3 || pace < SLOW; //only dont't show it if it's a workout AND the pace is too slow
                });
                for (let i = 0; i < show.length; i++) {
                    let s = show[i];
                    let pace = calcPace(s.distance, s.moving_time);
                    if (value.weather.error || i < 5 || i > show.length - 6 || show.length < 11) {
                        splits_tag += `<p class = "run split"> ${value.run.workout_type != 3 && value.run.workout_type != 1 ? "Lap " + (i + 1) + " - " : ""}
                                    ${(s.distance / 1609.34).toFixed(1)} Mi - ${value.run.workout_type == 3 || value.run.workout_type == 1 ? " Time: " + units.elapsed_time.DISPLAY(s.elapsed_time, 1) + " - " : ""}
                                    ${pace.toString()} Min/Mi</p>`;
                    } else if (!dots) {
                        splits_tag += `<p class = "run split"> ... </p>`;
                        dots = true;
                    }
                }
            }

            widget.innerHTML = `
                                <iframe height="${!value.weather.error ? 300 : 131}" width="390" frameborder='0' allowtransparency='true' scrolling='no'    style="float: left; margin: 0px; margin-right: 50px; border-radius: 10px" src='https://www.strava.com/activities/${value.run.id}/embed/${value.run.embed_token}'></iframe>
                                ${
                                    !value.weather.error
                                        ? `
                                <div style="border-bottom: 1px solid #666; height: 400px; background-color: rgba(255, 255, 255, 0);" >
                                        <div style="float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat" >&nbsp;${value.weather.temperature.toFixed(0)}&deg; </h1>
                                                <p class="run " style="margin-top: 0px">Temperature</p>
                                        </div>
                                        <div style="float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat">&nbsp;${value.weather.apparentTemperature.toFixed(0)}&deg; </h1>
                                                <p class="run " style="margin-top: 0px">Feels Like</p>
                                        </div>
                                        <div style= "float: left; text-align: center; width: 133px;"> 
                                                <h1 class="run stat">&nbsp;${(value.weather.humidity * 100).toFixed(0)}%</h1>
                                                <p class= "run" style="margin-top: 0px">Humidity</p>
                                        </div>
                                </div>
                                `
                                        : ""
                                }
                                <div id="not-analysis">
                                ${
                                    value.run.description
                                        ? `
                                <div style="float: left; width: ${!value.weather.error ? 200 : 400}px; text-align: center; margin-top: 10px">
                                        <p class="run split"><b>Description:</b></p>
                                        <p class="run split" style="margin-left: 10px; margin-right: 10px; text-align: center">${value.run.description.replace(/\n/g, "<br>")}</p>
                                </div>`
                                        : ""
                                }
                                ${
                                    splits_tag
                                        ? `
                                <div style="float: left; width: ${value.run.description && !value.weather.error ? 200 : 400}px; text-align: center; margin-top: 10px">
                                        <p class="run split"><b>Splits: </b></p>
                                        ${splits_tag}
                                </div>`
                                        : ""
                                }
                        </div>
                                ${
                                    value.run.workout_type == 1
                                        ? `
                                        <div id="race-analysis" style="float: left; width: 400px; text-align: center; margin-top: 10px; display: none;">
                                            <div style="float: left; width: 400px; text-align: center; margin-top: 0px;">
                                                <b>
                                                    <p class="run split" id="predicted-distance-time"></p>
                                                </b>
                                            </div>
                                                <div style="float: left; width: 200px; text-align: center; margin-top: 0px;">
                                                        <p class="run split"><b>Adjusted for Flat Course:</b></p>
                                                        <p id="flat-course" class="run split"></p>
                                                        <br>
                                                        <p class="run split"><b>Adjusted for Hilly Course:</b></p>
                                                        <p id="hilly-course" class="run split"></p>
                                                        <p class="run split"><input value="68" type="number" id="hills" style="width: 45px"></input>ft Elevation Gain</p>
                                                        
                                                </div>
                                                <div style="float: left; width: 200px; text-align: center; margin-top: 0px;">

                                                        <p class="run split"><b id="eqTimesTitle">Equivalent Times: </b></p>
                                                        <div id="equivalent-times"></div>
                                                        <button id="defaultEqButton">Default</button>
                                                        <button id="flatEqButton" style: "margin-left: 10px; margin-right: 10px">Flat</button>
                                                        <button id="hillsEqButton">Hills</button>
                                                </div>

                                        </div>
                                        <div id = "button-container"style="float: right; width: 200px; text-align: center; margin-top: 20px;">
                                        <button id="analysis-toggle-button" style="display: block; margin: auto;" onclick="toggleAnalysis()">View Race Analysis</button>
                                        </div>
                                        
                                `
                                        : ""
                                }
                                `;

            if (value.run.workout_type == 1) {
                let run = {
                    ...value.run,
                    elapsed_time: predictTime(value.run),
                    distance: predictDistance(value.run),
                };

                document.getElementById("predicted-distance-time").innerText = run.distance + "m: " + units.elapsed_time.DISPLAY(run.elapsed_time, 2);

                setEquivalentTimes(run, "equivalent_times");

                let flatPara = document.getElementById("flat-course");
                let hillyPara = document.getElementById("hilly-course");
                let hillInput = document.getElementById("hills");
                let adjustedHills = await getAdjustedHillsTime(run, hillInput.value);

                flatPara.innerText = units.elapsed_time.DISPLAY(adjustedHills.toFlat, 1);
                hillyPara.innerText = units.elapsed_time.DISPLAY(adjustedHills.toHilly, 1);

                let defaultEqButton = document.getElementById("defaultEqButton");
                let flatEqButton = document.getElementById("flatEqButton");
                let hillsEqButton = document.getElementById("hillsEqButton");
                let hillsInput = document.getElementById("hills");

                if (hillsInput) {
                    defaultEqButton.onclick = () => setEquivalentTimes(run, "equivalent_times");
                    flatEqButton.onclick = () => setEquivalentTimes(run, "flat_equivalent");

                    hillsEqButton.onclick = async () => {
                        let hillyRun = await getEquivalentTimes({
                            distance: run.distance,
                            elapsed_time: adjustedHills.toHilly,
                        });
                        setEquivalentTimes(
                            {
                                race_analysis: {
                                    hills_equivalent: hillyRun,
                                },
                            },
                            "hills_equivalent"
                        );
                    };

                    hillsInput.onchange = () => recalculateHills(run);
                }
            }
        }
    };
}

function calcPace(meters, seconds) {
    let miles = meters / 1609.34;
    return new Time(seconds / miles);
}

function toggleAnalysis() {
    let hideElt = document.getElementById("not-analysis");
    let analysis = document.getElementById("race-analysis");
    let btn = document.getElementById("analysis-toggle-button");
    let btnDiv = document.getElementById("button-container");
    if (hideElt.style.display == "none") {
        hideElt.style.display = "";
        analysis.style.display = "none";
        btn.innerText = "View Race Analysis";
        btnDiv.style.float = "right";
    } else {
        hideElt.style.display = "none";
        analysis.style.display = "";
        btn.innerText = "Hide Race Analysis";
        btnDiv.style.float = "left";
        btnDiv.style.width = "400px";
    }
}

async function getEquivalentTimes(run) {
    if (!run.elapsed_time || !run.distance) {
        return;
    }

    let parser = new DOMParser();

    const res = await fetch(`/runCalc/distance=${units.distance.GENERATE(run)}&time=0:${run.elapsed_time}&mode=eqperformance`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    let table = html.getElementsByTagName("table")[6].children[0].children;

    let results = {};

    for (let i = 2; i < 7; i++) {
        results[table[i].children[0].innerText] = Time.parse(table[i].children[1].innerText);
    }
    return results;
}

async function getAdjustedHillsTime(run, hypclimb) {
    let parser = new DOMParser();

    const res = await fetch(`/runCalc/mode=climbpace&climbing=${units.total_elevation_gain.GENERATE(run)}&downhill=${units.total_elevation_gain.GENERATE(run)}&distance=${units.distance.GENERATE(run)}&time=0:${run.elapsed_time}&hypclimbing=${hypclimb}&hypdownhill=${hypclimb}`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    let toFlat = Time.parse(
        html
            .getElementsByClassName("gen")[0]
            .innerText.replace(/^(.*?):/, "")
            .trim()
    );
    let toHilly = Time.parse(
        html
            .getElementsByClassName("gen")[1]
            .innerText.replace(/^(.*?):/, "")
            .trim()
    );

    return { toFlat, toHilly };
}

async function getAdjustedTempTime(run, weather) {
    if (weather.error) {
        return run.elapsed_time;
    }

    let parser = new DOMParser();

    const res = await fetch(`/runCalc/distance=${units.distance.GENERATE(run)}&time=0:${run.elapsed_time}&mode=to60&temp1=${weather.apparentTemperature}`);
    const txt = await res.text();

    let html = parser.parseFromString(txt, "text/html");
    return Time.parse(html.getElementsByClassName("row2")[1].innerText);
}

async function recalculateHills(run) {
    let hillyPara = document.getElementById("hilly-course");
    let hillInput = document.getElementById("hills");

    hillyPara.innerText = "Loading...";

    if (hillInput.value == undefined || hillInput.value <= 0) {
        hillyPara.innerText = "Enter a valid number";
        return;
    }

    let adjustedHills = await getAdjustedHillsTime(run, hillInput.value);
    hillyPara.innerText = units.elapsed_time.DISPLAY(adjustedHills.toHilly, 1);

    let hillyRun = await getEquivalentTimes({ distance: run.distance, elapsed_time: adjustedHills.toHilly });
    setEquivalentTimes({ race_analysis: { hills_equivalent: hillyRun } }, "hills_equivalent");
}

function setEquivalentTimes(run, mode) {
    let eq = run.race_analysis[mode];
    let eqDiv = document.getElementById("equivalent-times");

    let title = document.getElementById("eqTimesTitle");

    switch (mode) {
        case "equivalent_times":
            title.innerText = "Equivalent Race Times";
            break;
        case "flat_equivalent":
            title.innerText = "Equivalent Race Times (Flat)";
            break;
        case "hills_equivalent":
            title.innerText = "Equivalent Race Times (Hills)";
            break;
    }

    let eqText = "";
    for (let t in eq) {
        eqText += `<p class="run split" style="width: 90px; float: left">${t}</p><p class="run split" style="width: 90px; float: left">${units.elapsed_time.DISPLAY(eq[t], 1)}</p>`;
    }

    eqDiv.innerHTML = eqText;
}

async function recalculate(until) {
    await fetch("/delete/" + until);
    console.log("deleted");
    await fetch("/update");
    console.log("updated");
}

function predictDistance(run) {
    let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));
    let distanceError = commonEvents.map(event => Math.abs(event.distance - run.distance) / run.distance);

    const smallTolorance = 0.035;
    const bigTolorance = 0.06;

    let probabilities = [];

    for (let i = 0; i < commonEvents.length; i++) {
        let sum = 0;
        sum += nameMatches[i].length * 4;
        // sum += distanceError[i] == Math.min(...distanceError);
        sum += (distanceError[i] <= bigTolorance) * 1;
        sum += (distanceError[i] <= smallTolorance) * 3;
        sum -= distanceError[i] / 10;
        probabilities[i] = sum;
    }
    if (run.distance >= Math.max(...commonEvents.map(e => e.distance))) {
        return Math.max(...commonEvents.map(e => e.distance));
    }

    let highestIndex = probabilities.reduce((p, c, i, arr) => (c >= arr[p] ? i : p), 0);
    let sum = probabilities.reduce((p, c) => p + c);
    if (sum <= 1) {
        return run.distance;
    }

    return commonEvents[highestIndex].distance;
}

function predictDistance_workout(run, splitDistance) {
    let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));
    let distanceError = splitDistance ? commonEvents.map(event => Math.abs(event.distance - splitDistance) / splitDistance) : null;

    const smallTolorance = 0.035;
    const bigTolorance = 0.06;

    let probabilities = [];

    for (let i = 0; i < commonEvents.length; i++) {
        let sum = 0;
        sum += nameMatches[i].length * 4;
        // sum += distanceError[i] == Math.min(...distanceError);
        if (distanceError) {
            sum += (distanceError[i] <= bigTolorance) * 1;
            sum += (distanceError[i] <= smallTolorance) * 3;
            sum -= distanceError[i] / 10;
        }

        probabilities[i] = sum;
    }

    // console.log(probabilities)
    if (splitDistance >= Math.max(...commonEvents.map(e => e.distance))) {
        return Math.max(...commonEvents.map(e => e.distance));
    }

    let highestIndex = probabilities.reduce((p, c, i, arr) => (c >= arr[p] ? i : p), 0);
    let sum = probabilities.reduce((p, c) => p + c);
    if (sum <= 1) {
        return splitDistance;
    }

    return commonEvents[highestIndex].distance;
}

function predictTime(run) {
    let original = run.elapsed_time;
    let captured = run.description ? run.description.match(/(?:\d+\:){0,3}\d+(?:\.\d+)?/g) || [] : [];
    let best = Infinity;
    for (let c of captured) {
        let t = new Time(c);
        best = Math.abs(original - best) < Math.abs(original - t) ? best : t;
    }

    if (Math.abs((original - best) / best) < 0.15 && best != Infinity) {
        return best;
    }
    return original;
}

async function reloadAtIndex(index, id) {
    await fetch("/reloadAtIndex/" + index + "/" + id);
    console.log("Reloaded");
}

// function analyzeWorkout(run) {
//     //let nameMatches = commonEvents.map(event => event.names.filter(name => new RegExp(name, "i").exec(run.name)));

// }
